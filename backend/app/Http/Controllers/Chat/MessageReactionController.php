<?php

declare(strict_types=1);

namespace App\Http\Controllers\Chat;

use App\Events\Chat\ReactionAdded;
use App\Events\Chat\ReactionRemoved;
use App\Http\Controllers\Controller;
use App\Http\Resources\Chat\MessageReactionResource;
use App\Models\Chat\ChatMessage;
use App\Models\Chat\MessageReaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageReactionController extends Controller
{
    public function store(Request $request, ChatMessage $message): JsonResponse
    {
        $user = $request->user();
        $family = $request->get('_family');
        $room = $message->chatRoom;

        // Verify the room belongs to the family
        if ($room->family_id !== $family->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Message not found.'
            ], 404);
        }

        // Verify user is a member of the room
        if (!$room->isMember($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this chat room.'
            ], 403);
        }

        // Validate emoji
        $request->validate([
            'emoji' => [
                'required',
                'string',
                'max:10',
                function ($attribute, $value, $fail) {
                    // Basic emoji validation - you might want to use a more sophisticated check
                    if (!preg_match('/^[\x{1F600}-\x{1F64F}]|[\x{1F300}-\x{1F5FF}]|[\x{1F680}-\x{1F6FF}]|[\x{1F1E0}-\x{1F1FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]/u', $value)) {
                        $fail('Invalid emoji format.');
                    }
                }
            ]
        ]);

        $emoji = $request->input('emoji');

        // Check if user already reacted with this emoji
        $existingReaction = MessageReaction::where('message_id', $message->id)
            ->where('user_id', $user->id)
            ->where('emoji', $emoji)
            ->first();

        if ($existingReaction) {
            return response()->json([
                'success' => false,
                'message' => 'You have already reacted with this emoji.'
            ], 422);
        }

        // Create the reaction
        $reaction = $message->addReaction($user, $emoji);

        $reaction->load('user:id,name,email');

        // Broadcast reaction via WebSocket
        broadcast(new ReactionAdded($reaction));

        return response()->json([
            'success' => true,
            'message' => 'Reaction added successfully.',
            'data' => new MessageReactionResource($reaction)
        ], 201);
    }

    public function destroy(Request $request, ChatMessage $message, string $emoji): JsonResponse
    {
        $user = $request->user();
        $family = $request->get('_family');
        $room = $message->chatRoom;

        // Verify the room belongs to the family
        if ($room->family_id !== $family->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Message not found.'
            ], 404);
        }

        // Verify user is a member of the room
        if (!$room->isMember($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this chat room.'
            ], 403);
        }

        // Find and remove the reaction
        $reaction = MessageReaction::where('message_id', $message->id)
            ->where('user_id', $user->id)
            ->where('emoji', $emoji)
            ->first();

        if (!$reaction) {
            return response()->json([
                'success' => false,
                'message' => 'Reaction not found.'
            ], 404);
        }

        $reaction->delete();

        // Broadcast reaction removal via WebSocket
        broadcast(new ReactionRemoved(
            $message->id,
            $room->id,
            $user->id,
            $emoji
        ));

        return response()->json([
            'success' => true,
            'message' => 'Reaction removed successfully.'
        ]);
    }
}