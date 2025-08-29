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
use App\Models\Chat\ChatRoomMember;
use App\Models\Chat\MessageReaction;
use App\Models\Users\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Throwable;

class ChatMessageController extends Controller
{
    public function index(Request $request, string $family_slug, ChatRoom $room): AnonymousResourceCollection
    {
        $user = $request->user();
        $family = $request->get('_family');

        if ($room->getFamilyId() !== $family->getId()) {
            abort(404, 'Chat room not found.');
        }

        if (!$room->isMember($user)) {
            abort(403, 'You are not a member of this chat room.');
        }

        $perPage = min($request->integer('per_page', 50), 100);
        $beforeId = $request->integer('before_id');

        $query = ChatMessage::query()
            ->forRoom($room->getId())
            ->notDeleted()
            ->with([
                ChatMessage::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
                ChatMessage::REPLY_TO_RELATION . '.' . ChatMessage::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
                ChatMessage::REACTIONS_RELATION, // Load all reaction columns
                ChatMessage::REACTIONS_RELATION . '.' . MessageReaction::USER_RELATION => function ($query) {
                    $query->select(User::ID, User::NAME, User::EMAIL);
                },
            ])
            ->orderByDesc(ChatMessage::CREATED_AT);

        if ($beforeId) {
            $query->where(ChatMessage::ID, '<', $beforeId);
        }

        $messages = $query->paginate($perPage);

        $room->markAsRead($user);

        return ChatMessageResource::collection($messages);
    }

    /**
     * @throws Throwable
     */
    public function store(SendMessageRequest $request, string $family_slug, ChatRoom $room): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $family = $request->get('_family');

        if ($room->getFamilyId() !== $family->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Chat room not found.'
            ], 404);
        }

        if (!$room->isMember($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a member of this chat room.'
            ], 403);
        }

        if ($room->isMuted($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You are muted in this chat room.'
            ], 403);
        }

        $data = $request->getData();

        if ($data->replyToId) {
            $replyToMessage = ChatMessage::where(ChatMessage::ID, $data->replyToId)
                ->where(ChatMessage::CHAT_ROOM_ID, $room->getId())
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
            $message = ChatMessage::create([
                ChatMessage::CHAT_ROOM_ID => $room->getId(),
                ChatMessage::USER_ID => $user->getId(),
                ChatMessage::REPLY_TO_ID => $data->replyToId,
                ChatMessage::MESSAGE => $data->message,
                ChatMessage::TYPE => $data->type,
                ChatMessage::ATTACHMENTS => $data->attachments,
                ChatMessage::METADATA => $data->metadata,
            ]);

            $room->updateLastMessageAt();

            // Increment unread count for other members
            $room->membersRelation()
                ->where(ChatRoomMember::USER_ID, '!=', $user->getId())
                ->increment(ChatRoomMember::UNREAD_COUNT, 1);

            DB::commit();

            $message->load([
                'userRelation:id,name,email',
                'replyToRelation:id,user_id,message,created_at',
                'replyToRelation.userRelation:id,name,email',
            ]);

            broadcast(new MessageSent($message));

            return response()->json([
                'success' => true,
                'message' => 'Message sent successfully.',
                'data' => new ChatMessageResource($message)
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(Request $request, ChatMessage $message): JsonResponse
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
            ChatMessage::MESSAGE => $request->input('message'),
        ]);

        $message->markAsEdited();

        $message->load([
            ChatMessage::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
            ChatMessage::REPLY_TO_RELATION . '.' . ChatMessage::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
        ]);

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
        $room = $message->relatedChatRoom();

        if ($room->getFamilyId() !== $family->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Message not found.'
            ], 404);
        }

        if (!$message->canDelete($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete this message.'
            ], 403);
        }

        $message->softDelete();

        broadcast(new MessageDeleted(
            $message->getId(),
            $message->getChatRoomId(),
            $user->getId()
        ));

        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully.'
        ]);
    }
}
