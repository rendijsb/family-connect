<?php

declare(strict_types=1);

namespace App\Http\Controllers\Broadcasting;

use App\Http\Controllers\Controller;
use App\Models\Chat\ChatRoom;
use App\Models\Families\FamilyMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Broadcasting\Broadcasters\ReverseProxyBroadcaster;
use Laravel\Reverb\Contracts\ApplicationProvider;

class BroadcastController extends Controller
{
    public function authenticate(Request $request)
    {
        try {
            Log::info('Broadcasting auth request received', [
                'headers' => $request->headers->all(),
                'body' => $request->all(),
            ]);

            $user = $request->user();

            if (!$user) {
                Log::warning('Broadcasting auth: No authenticated user');
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $channelName = $request->input('channel_name');
            $socketId = $request->input('socket_id');

            Log::info('Broadcasting auth request details', [
                'user_id' => $user->id,
                'channel' => $channelName,
                'socket_id' => $socketId
            ]);

            if (!$channelName || !$socketId) {
                Log::error('Missing required fields', [
                    'channel_name' => $channelName,
                    'socket_id' => $socketId
                ]);
                return response()->json(['message' => 'Missing required fields'], 400);
            }

            // Handle private chat room channels
            if (preg_match('/^private-chat-room\.(\d+)$/', $channelName, $matches)) {
                $roomId = (int) $matches[1];

                Log::info('Checking access for chat room', [
                    'room_id' => $roomId,
                    'user_id' => $user->id
                ]);

                if ($this->canAccessChatRoom($user, $roomId)) {
                    // For Reverb, we need to return the proper auth format
                    $auth = $this->generateReverbAuth($channelName, $socketId, [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ]);

                    Log::info('Broadcasting auth successful', [
                        'user_id' => $user->id,
                        'channel' => $channelName,
                        'auth_response' => $auth
                    ]);

                    return response()->json($auth);
                }
            }

            // Handle family presence channels
            if (preg_match('/^presence-family\.(\d+)$/', $channelName, $matches)) {
                $familyId = (int) $matches[1];

                Log::info('Checking access for family', [
                    'family_id' => $familyId,
                    'user_id' => $user->id
                ]);

                if ($this->canAccessFamily($user, $familyId)) {
                    $familyMember = FamilyMember::where('family_id', $familyId)
                        ->where('user_id', $user->id)
                        ->first();

                    $auth = $this->generateReverbPresenceAuth($channelName, $socketId, [
                        'id' => $user->id,
                        'name' => $user->name,
                        'role' => $familyMember->role ?? null,
                    ]);

                    Log::info('Family presence auth successful', [
                        'user_id' => $user->id,
                        'family_id' => $familyId,
                        'auth_response' => $auth
                    ]);

                    return response()->json($auth);
                }
            }

            Log::warning('Broadcasting auth: Access denied', [
                'user_id' => $user->id,
                'channel' => $channelName
            ]);

            return response()->json(['message' => 'Forbidden'], 403);

        } catch (\Exception $e) {
            Log::error('Broadcasting auth error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return response()->json(['message' => 'Authentication failed'], 500);
        }
    }

    private function canAccessChatRoom($user, int $roomId): bool
    {
        try {
            $chatRoom = ChatRoom::find($roomId);

            if (!$chatRoom) {
                Log::warning('Chat room not found', ['room_id' => $roomId]);
                return false;
            }

            // Check if user is a family member
            $familyMember = FamilyMember::where('family_id', $chatRoom->family_id)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->first();

            if (!$familyMember) {
                Log::warning('User is not a family member', [
                    'user_id' => $user->id,
                    'family_id' => $chatRoom->family_id
                ]);
                return false;
            }

            // Check if user is a room member
            $isMember = $chatRoom->isMember($user);

            Log::info('Chat room access check result', [
                'user_id' => $user->id,
                'room_id' => $roomId,
                'is_family_member' => true,
                'is_room_member' => $isMember
            ]);

            return $isMember;

        } catch (\Exception $e) {
            Log::error('Error checking chat room access', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'room_id' => $roomId
            ]);
            return false;
        }
    }

    private function canAccessFamily($user, int $familyId): bool
    {
        try {
            $exists = FamilyMember::where('family_id', $familyId)
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->exists();

            Log::info('Family access check result', [
                'user_id' => $user->id,
                'family_id' => $familyId,
                'has_access' => $exists
            ]);

            return $exists;

        } catch (\Exception $e) {
            Log::error('Error checking family access', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
                'family_id' => $familyId
            ]);
            return false;
        }
    }

    private function generateReverbAuth(string $channelName, string $socketId, array $userData = null)
    {
        // For Reverb, we need to generate the auth signature
        $stringToSign = $socketId . ':' . $channelName;
        $signature = hash_hmac('sha256', $stringToSign, config('broadcasting.connections.reverb.secret'));

        $auth = config('broadcasting.connections.reverb.key') . ':' . $signature;

        return [
            'auth' => $auth,
        ];
    }

    private function generateReverbPresenceAuth(string $channelName, string $socketId, array $userData)
    {
        // For presence channels, include user data
        $presenceData = json_encode($userData);
        $stringToSign = $socketId . ':' . $channelName . ':' . $presenceData;
        $signature = hash_hmac('sha256', $stringToSign, config('broadcasting.connections.reverb.secret'));

        $auth = config('broadcasting.connections.reverb.key') . ':' . $signature;

        return [
            'auth' => $auth,
            'channel_data' => $presenceData,
        ];
    }
}
