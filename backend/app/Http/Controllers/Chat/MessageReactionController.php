<?php

declare(strict_types=1);

namespace App\Http\Controllers\Chat;

use App\Events\Chat\ReactionAdded;
use App\Events\Chat\ReactionRemoved;
use App\Http\Controllers\Controller;
use App\Http\Resources\Chat\MessageReactionResource;
use App\Models\Chat\ChatMessage;
use App\Models\Chat\MessageReaction;
use App\Models\Users\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageReactionController extends Controller
{
    public function store(Request $request, ChatMessage $message): JsonResponse
    {
        $user = $request->user();
        $family = $request->get('_family');
        $room = $message->relatedChatRoom();

        if ($room->getFamilyId() !== $family->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Message not found.'
            ], 404);
        }

        if (!$room->isMember($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this chat room.'
            ], 403);
        }

        $request->validate([
            'emoji' => [
                'required',
                'string',
                'max:10',
                function ($attribute, $value, $fail) {
                    if (!preg_match('/^[\x{1F600}-\x{1F64F}]|[\x{1F300}-\x{1F5FF}]|[\x{1F680}-\x{1F6FF}]|[\x{1F1E0}-\x{1F1FF}]|[\x{2600}-\x{26FF}]|[\x{2700}-\x{27BF}]/u', $value)) {
                        $fail('Invalid emoji format.');
                    }
                }
            ]
        ]);

        $emoji = $request->input('emoji');

        $existingReaction = MessageReaction::where(MessageReaction::MESSAGE_ID, $message->getId())
            ->where(MessageReaction::USER_ID, $user->getId())
            ->where(MessageReaction::EMOJI, $emoji)
            ->first();

        if ($existingReaction) {
            return response()->json([
                'success' => false,
                'message' => 'You have already reacted with this emoji.'
            ], 422);
        }

        $reaction = $message->addReaction($user, $emoji);

        $reaction->load(
            MessageReaction::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
        );

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
        $room = $message->relatedChatRoom();

        if ($room->getFamilyId() !== $family->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Message not found.'
            ], 404);
        }

        if (!$room->isMember($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this chat room.'
            ], 403);
        }

        $reaction = MessageReaction::where(MessageReaction::MESSAGE_ID, $message->getId())
            ->where(MessageReaction::USER_ID, $user->getId())
            ->where(MessageReaction::EMOJI, $emoji)
            ->first();

        if (!$reaction) {
            return response()->json([
                'success' => false,
                'message' => 'Reaction not found.'
            ], 404);
        }

        $reaction->delete();

        broadcast(new ReactionRemoved(
            $message->getId(),
            $room->getId(),
            $user->getId(),
            $emoji
        ));

        return response()->json([
            'success' => true,
            'message' => 'Reaction removed successfully.'
        ]);
    }
}
