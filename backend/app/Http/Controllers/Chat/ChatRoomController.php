<?php

declare(strict_types=1);

namespace App\Http\Controllers\Chat;

use App\Enums\Chat\ChatRoomTypeEnum;
use App\Enums\Families\FamilyRoleEnum;
use App\Events\Chat\UserTyping;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\CreateChatRoomRequest;
use App\Http\Requests\Chat\UpdateChatRoomRequest;
use App\Http\Resources\Chat\ChatRoomResource;
use App\Models\Chat\ChatMessage;
use App\Models\Chat\ChatRoom;
use App\Models\Chat\ChatRoomMember;
use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use App\Models\Users\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Throwable;

class ChatRoomController extends Controller
{
    public function getAll(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Family $family */
        $family = $request->get('_family');

        /** @var ChatRoom $chatRooms */
        $chatRooms = ChatRoom::query()
            ->forFamily($family->getId())
            ->active()
            ->whereHas(ChatRoom::MEMBERS_RELATION, function (Builder $query) use ($user) {
                $query->where(ChatRoomMember::USER_ID, $user->getId());
            })
            ->with([
                ChatRoom::CREATOR_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
                ChatRoom::LAST_MESSAGE_RELATION . '.' . ChatMessage::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
                ChatRoom::MEMBERS_RELATION => function ($query) use ($user) {
                    $query->where(ChatRoomMember::USER_ID, $user->getId());
                }
            ])
            ->orderByDesc(ChatRoom::LAST_MESSAGE_AT)
            ->orderByDesc(ChatRoom::CREATED_AT)
            ->get();

        return ChatRoomResource::collection($chatRooms);
    }

    /**
     * @throws Throwable
     */
    public function createChatRoom(CreateChatRoomRequest $request): JsonResponse
    {
        $user = $request->user();
        $family = $request->get('_family');
        $data = $request->getData();

        $familyMemberIds = FamilyMember::where(FamilyMember::FAMILY_ID, $family->getId())
            ->pluck(FamilyMember::USER_ID)
            ->toArray();

        $invalidMembers = array_diff($data->memberIds, $familyMemberIds);
        if (!empty($invalidMembers)) {
            return response()->json([
                'success' => false,
                'message' => 'Some selected members are not part of this family.',
                'errors' => ['memberIds' => ['Invalid family members selected.']]
            ], 422);
        }

        DB::beginTransaction();
        /** @var ChatRoom $chatRoom */
        $chatRoom = ChatRoom::create([
            ChatRoom::FAMILY_ID => $family->getId(),
            ChatRoom::NAME => $data->name,
            ChatRoom::TYPE => $data->type,
            ChatRoom::DESCRIPTION => $data->description,
            ChatRoom::CREATED_BY => $user->getId(),
            ChatRoom::IS_PRIVATE => $data->isPrivate,
        ]);

        $chatRoom->addMember($user, true);

        $usersToAdd = User::whereIn(User::ID, $data->memberIds)
            ->where(User::ID, '!=', $user->getId())
            ->get();

        foreach ($usersToAdd as $memberUser) {
            $chatRoom->addMember($memberUser);
        }

        DB::commit();

        $chatRoom->load([
            ChatRoom::CREATOR_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
            ChatRoom::MEMBERS_RELATION . '.' . ChatRoomMember::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Chat room created successfully.',
            'data' => new ChatRoomResource($chatRoom)
        ], 201);
    }

    public function show(Request $request, string $family_slug, ChatRoom $room): JsonResponse
    {
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

        $room->load([
            ChatRoom::CREATOR_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
            ChatRoom::MEMBERS_RELATION . '.' . ChatRoomMember::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
            ChatRoom::LAST_MESSAGE_RELATION . '.' . ChatMessage::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
        ]);

        return response()->json([
            'success' => true,
            'data' => new ChatRoomResource($room)
        ]);
    }

    public function update(UpdateChatRoomRequest $request, string $family_slug, ChatRoom $room): JsonResponse
    {
        $user = $request->user();
        $family = $request->get('_family');

        if ($room->getFamilyId() !== $family->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Chat room not found.'
            ], 404);
        }

        if (!$room->canUserManage($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to update this chat room.'
            ], 403);
        }

        $data = $request->getData();

        if (!$data->hasUpdates()) {
            return response()->json([
                'success' => false,
                'message' => 'No updates provided.'
            ], 422);
        }

        $room->update($data->toArray());

        $room->load([
            ChatRoom::CREATOR_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
            ChatRoom::MEMBERS_RELATION . '.' . ChatRoomMember::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Chat room updated successfully.',
            'data' => new ChatRoomResource($room)
        ]);
    }

    public function destroy(Request $request, ChatRoom $room): JsonResponse
    {
        $user = $request->user();
        $family = $request->get('_family');

        if ($room->getFamilyId() !== $family->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Chat room not found.'
            ], 404);
        }

        $familyMember = $request->get('_family_member');
        if (!$room->canUserManage($user) && $familyMember->getRole()->value !== FamilyRoleEnum::OWNER->value) { // OWNER role
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete this chat room.'
            ], 403);
        }

        $room->update(['is_archived' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Chat room archived successfully.'
        ]);
    }

    public function markAsRead(Request $request, string $family_slug, ChatRoom $room): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var Family $family */
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

        $room->markAsRead($user);

        return response()->json([
            'success' => true,
            'message' => 'Messages marked as read.'
        ]);
    }

    public function typing(Request $request, string $family_slug, ChatRoom $room): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        /** @var Family $family */
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

        $request->validate([
            'isTyping' => 'boolean'
        ]);

        $isTyping = $request->boolean('isTyping', true);

        broadcast(new UserTyping($user, $room->getId(), $isTyping));

        return response()->json([
            'success' => true,
            'message' => 'Typing indicator sent.'
        ]);
    }

    /**
     * @throws Throwable
     */
    public function findOrCreateDirectMessage(Request $request): JsonResponse
    {
        $user = $request->user();
        $family = $request->get('_family');

        $request->validate([
            'otherUserId' => 'required|integer|exists:users,id'
        ]);

        $otherUserId = $request->integer('otherUserId');

        $otherMember = FamilyMember::where(FamilyMember::FAMILY_ID, $family->getId())
            ->where(FamilyMember::USER_ID, $otherUserId)
            ->where(FamilyMember::IS_ACTIVE, true)
            ->first();

        if (!$otherMember) {
            return response()->json([
                'success' => false,
                'message' => 'User is not a member of this family.',
            ], 404);
        }

        if ($user->getId() === $otherUserId) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot create direct message with yourself.',
            ], 400);
        }

        $existingRoom = ChatRoom::findDirectMessageRoom($family->getId(), $user->id, $otherUserId);

        if ($existingRoom) {
            return response()->json([
                'success' => true,
                'message' => 'Direct message room found.',
                'data' => new ChatRoomResource($existingRoom->load([
                    ChatRoom::CREATOR_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
                    ChatRoom::MEMBERS_RELATION . '.' . ChatRoomMember::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
                ])),
            ]);
        }

        /** @var User $otherUser */
        $otherUser = $otherMember->relatedUser();

        $roomName = "{$user->getName()}, {$otherUser->getName()}";

        DB::beginTransaction();
        /** @var ChatRoom $chatRoom */
        $chatRoom = ChatRoom::create([
            ChatRoom::FAMILY_ID => $family->getId(),
            ChatRoom::NAME => $roomName,
            ChatRoom::TYPE => ChatRoomTypeEnum::DIRECT,
            ChatRoom::CREATED_BY => $user->getId(),
            ChatRoom::IS_PRIVATE => true,
        ]);

        $chatRoom->addMember($user, false);
        $chatRoom->addMember($otherUser, false);

        DB::commit();

        $chatRoom->load([
            ChatRoom::CREATOR_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
            ChatRoom::MEMBERS_RELATION . '.' . ChatRoomMember::USER_RELATION . ':' . User::ID . ',' . User::NAME . ',' . User::EMAIL,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Direct message room created successfully.',
            'data' => new ChatRoomResource($chatRoom),
        ], 201);
    }

    public function addMember(Request $request, string $family_slug, ChatRoom $room): JsonResponse
    {
        $user = $request->user();
        $family = $request->get('_family');

        if ($room->getFamilyId() !== $family->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Chat room not found.'
            ], 404);
        }

        if (!$room->canUserManage($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to add members to this chat room.'
            ], 403);
        }

        $request->validate([
            'userId' => 'required|integer|exists:users,id',
            'isAdmin' => 'boolean'
        ]);

        $userId = $request->integer('userId');
        $isAdmin = $request->boolean('isAdmin', false);

        $familyMember = FamilyMember::where(FamilyMember::FAMILY_ID, '=', $family->getId())
            ->where(FamilyMember::USER_ID, '=', $userId)
            ->where(FamilyMember::IS_ACTIVE, '=', true)
            ->first();

        if (!$familyMember) {
            return response()->json([
                'success' => false,
                'message' => 'User is not a member of this family.'
            ], 404);
        }

        if ($room->isMember($familyMember->relatedUser())) {
            return response()->json([
                'success' => false,
                'message' => 'User is already a member of this chat room.'
            ], 409);
        }

        $room->addMember($familyMember->relatedUser(), $isAdmin);

        return response()->json([
            'success' => true,
            'message' => 'Member added successfully.'
        ]);
    }

    public function removeMember(Request $request, string $family_slug, ChatRoom $room, User $member): JsonResponse
    {
        $user = $request->user();
        $family = $request->get('_family');

        if ($room->getFamilyId() !== $family->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Chat room not found.'
            ], 404);
        }

        if (!$room->canUserManage($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to remove members from this chat room.'
            ], 403);
        }

        if ($member->getId() === $user->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot remove yourself from the chat room. Use leave room instead.'
            ], 400);
        }

        if (!$room->isMember($member)) {
            return response()->json([
                'success' => false,
                'message' => 'User is not a member of this chat room.'
            ], 404);
        }

        $room->removeMember($member);

        return response()->json([
            'success' => true,
            'message' => 'Member removed successfully.'
        ]);
    }

    public function toggleMemberAdmin(Request $request, string $family_slug, ChatRoom $room, User $member): JsonResponse
    {
        $user = $request->user();
        $family = $request->get('_family');

        if ($room->getFamilyId() !== $family->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Chat room not found.'
            ], 404);
        }

        if (!$room->canUserManage($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to manage member roles in this chat room.'
            ], 403);
        }

        if (!$room->isMember($member)) {
            return response()->json([
                'success' => false,
                'message' => 'User is not a member of this chat room.'
            ], 404);
        }

        $wasAdmin = $room->isAdmin($member);
        $room->toggleMemberAdmin($member);

        $action = $wasAdmin ? 'removed' : 'granted';

        return response()->json([
            'success' => true,
            'message' => "Admin privileges {$action} successfully.",
            'data' => [
                'userId' => $member->getId(),
                'isAdmin' => !$wasAdmin
            ]
        ]);
    }

    public function leaveRoom(Request $request, string $family_slug, ChatRoom $room): JsonResponse
    {
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
            ], 404);
        }

        if ($room->getCreatedBy() === $user->getId()) {
            $adminCount = $room->relatedMembers()->where(ChatRoomMember::IS_ADMIN, true)->count();
            if ($adminCount <= 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'As the room creator and only admin, you cannot leave. Please transfer admin rights to another member first or delete the room.'
                ], 400);
            }
        }

        $room->removeMember($user);

        return response()->json([
            'success' => true,
            'message' => 'You have successfully left the chat room.'
        ]);
    }
}
