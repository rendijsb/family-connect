<?php

declare(strict_types=1);

namespace App\Http\Controllers\Chat;

use App\Events\Chat\MessageDeleted;
use App\Events\Chat\MessageSent;
use App\Events\Chat\MessageUpdated;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\SendMessageRequest;
use App\Http\Resources\Chat\ChatMessageResource;
use App\Models\Chat\ChatMessage;
use App\Models\Chat\ChatRoom;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ChatMessageController extends Controller
{
    public function index(Request $request, string $family_slug, ChatRoom $room): AnonymousResourceCollection
    {
        $user = $request->user();
        $family = $request->get('_family');

        // Verify the room belongs to the family
        if ($room->family_id !== $family->getId()) {
            abort(404, 'Chat room not found.');
        }

        // Verify user is a member of the room
        if (!$room->isMember($user)) {
            abort(403, 'You are not a member of this chat room.');
        }

        $perPage = min($request->integer('per_page', 50), 100);
        $beforeId = $request->integer('before_id');

        $query = ChatMessage::query()
            ->forRoom($room->id)
            ->notDeleted()
            ->with([
                'user:id,name,email',
                'replyTo.user:id,name,email',
                'reactions.user:id,name,email'
            ])
            ->orderByDesc('created_at');

        if ($beforeId) {
            $query->where('id', '<', $beforeId);
        }

        $messages = $query->paginate($perPage);

        // Mark messages as read
        $room->markAsRead($user);

        return ChatMessageResource::collection($messages);
    }

    public function store(SendMessageRequest $request, string $family_slug, ChatRoom $room): JsonResponse
    {
        $user = $request->user();
        $family = $request->get('_family');

        // Verify the room belongs to the family
        if ($room->family_id !== $family->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Chat room not found.'
            ], 404);
        }

        // Verify user is a member of the room
        if (!$room->isMember($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this chat room.'
            ], 403);
        }

        // Check if user is muted
        if ($room->isMuted($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are muted in this chat room.'
            ], 403);
        }

        $data = $request->getData();

        // Verify reply-to message exists and belongs to this room
        if ($data->replyToId) {
            $replyToMessage = ChatMessage::where('id', $data->replyToId)
                ->where('chat_room_id', $room->id)
                ->first();

            if (!$replyToMessage) {
                return response()->json([
                    'success' => false,
                    'message' => 'The message you are replying to does not exist.'
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            // Create the message
            $message = ChatMessage::create([
                'chat_room_id' => $room->id,
                'user_id' => $user->id,
                'reply_to_id' => $data->replyToId,
                'message' => $data->message,
                'type' => $data->type,
                'attachments' => $data->attachments,
                'metadata' => $data->metadata,
            ]);

            // Update chat room's last message timestamp
            $room->updateLastMessageAt();

            // Increment unread count for other members
            $room->members()
                ->where('user_id', '!=', $user->id)
                ->each(function ($member) {
                    $member->incrementUnreadCount();
                });

            DB::commit();

            // Load relations for response
            $message->load([
                'user:id,name,email',
                'replyTo.user:id,name,email'
            ]);

            // Broadcast message via WebSocket
            broadcast(new MessageSent($message));

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully.',
                'data' => new ChatMessageResource($message)
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to send message.',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    public function update(Request $request, ChatMessage $message): JsonResponse
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

        // Verify user can edit this message
        if (!$message->canEdit($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot edit this message.'
            ], 403);
        }

        $request->validate([
            'message' => 'required|string|min:1|max:5000',
        ]);

        $message->update([
            'message' => $request->input('message'),
        ]);

        $message->markAsEdited();

        $message->load([
            'user:id,name,email',
            'replyTo.user:id,name,email'
        ]);

        // Broadcast message update via WebSocket
        broadcast(new MessageUpdated($message));

        return response()->json([
            'success' => true,
            'message' => 'Message updated successfully.',
            'data' => new ChatMessageResource($message)
        ]);
    }

    public function destroy(Request $request, ChatMessage $message): JsonResponse
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

        // Verify user can delete this message
        if (!$message->canDelete($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete this message.'
            ], 403);
        }

        $message->softDelete();

        // Broadcast message deletion via WebSocket
        broadcast(new MessageDeleted(
            $message->id,
            $message->chat_room_id,
            $user->id
        ));

        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully.'
        ]);
    }
}