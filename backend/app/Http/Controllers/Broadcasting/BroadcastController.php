<?php

declare(strict_types=1);

namespace App\Http\Controllers\Broadcasting;

use App\Http\Controllers\Controller;
use App\Models\Chat\ChatRoom;
use App\Models\Families\FamilyMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Pusher\Pusher;

class BroadcastController extends Controller
{
    public function authenticate(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $channelName = $request->input('channel_name');
            $socketId = $request->input('socket_id');

            Log::info('Broadcasting auth request', [
                'user_id' => $user->id,
                'channel' => $channelName,
                'socket_id' => $socketId
            ]);

            // Handle private chat room channels
            if (preg_match('/^private-chat-room\.(\d+)$/', $channelName, $matches)) {
                $roomId = (int) $matches[1];

                if ($this->canAccessChatRoom($user, $roomId)) {
                    return $this->generatePusherAuth($channelName, $socketId, [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                    ]);
                }
            }

            // Handle family presence channels
            if (preg_match('/^presence-family\.(\d+)$/', $channelName, $matches)) {
                $familyId = (int) $matches[1];

                if ($this->canAccessFamily($user, $familyId)) {
                    $familyMember = FamilyMember::where('family_id', $familyId)
                        ->where('user_id', $user->id)
                        ->first();

                    return $this->generatePusherAuth($channelName, $socketId, [
                        'id' => $user->id,
                        'name' => $user->name,
                        'role' => $familyMember->role ?? null,
                    ]);
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
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['message' => 'Authentication failed'], 500);
        }
    }

    private function canAccessChatRoom($user, int $roomId): bool
    {
        $chatRoom = ChatRoom::find($roomId);

        if (!$chatRoom) {
            return false;
        }

        // Check if user is a family member
        $familyMember = FamilyMember::where('family_id', $chatRoom->family_id)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$familyMember) {
            return false;
        }

        // Check if user is a room member
        return $chatRoom->isMember($user);
    }

    private function canAccessFamily($user, int $familyId): bool
    {
        return FamilyMember::where('family_id', $familyId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->exists();
    }

    private function generatePusherAuth(string $channelName, string $socketId, array $userData = null)
    {
        $pusher = new Pusher(
            config('broadcasting.connections.reverb.key'),
            config('broadcasting.connections.reverb.secret'),
            config('broadcasting.connections.reverb.app_id'),
            [
                'cluster' => config('broadcasting.connections.reverb.options.cluster'),
                'host' => config('broadcasting.connections.reverb.options.host'),
                'port' => config('broadcasting.connections.reverb.options.port'),
                'scheme' => config('broadcasting.connections.reverb.options.scheme'),
            ]
        );

        if (str_starts_with($channelName, 'presence-')) {
            $auth = $pusher->presenceAuth($channelName, $socketId, $userData['id'], $userData);
        } else {
            $auth = $pusher->socketAuth($channelName, $socketId);
        }

        return response($auth);
    }
}
