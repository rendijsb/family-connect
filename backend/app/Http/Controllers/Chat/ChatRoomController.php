<?php

declare(strict_types=1);

namespace App\Http\Controllers\Chat;

use App\Events\Chat\UserTyping;
use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\CreateChatRoomRequest;
use App\Http\Requests\Chat\UpdateChatRoomRequest;
use App\Http\Resources\Chat\ChatRoomResource;
use App\Models\Chat\ChatRoom;
use App\Models\Families\Family;
use App\Models\Families\FamilyMember;
use App\Models\Users\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class ChatRoomController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $family = $request->get('_family');
        
        // Get chat rooms where the user is a member
        $chatRooms = ChatRoom::query()
            ->forFamily($family->getId())
            ->active()
            ->whereHas('members', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->with([
                'creator:id,name,email',
                'lastMessage.user:id,name,email',
                'members' => function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                }
            ])
            ->orderByDesc('last_message_at')
            ->orderByDesc('created_at')
            ->get();

        return ChatRoomResource::collection($chatRooms);
    }

    public function store(CreateChatRoomRequest $request): JsonResponse
    {
        $user = $request->user();
        $family = $request->get('_family');
        $data = $request->getData();

        // Verify all members belong to the family
        $familyMemberIds = FamilyMember::where('family_id', $family->getId())
            ->pluck('user_id')
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
        try {
            // Create the chat room
            $chatRoom = ChatRoom::create([
                'family_id' => $family->getId(),
                'name' => $data->name,
                'type' => $data->type,
                'description' => $data->description,
                'created_by' => $user->id,
                'is_private' => $data->isPrivate,
            ]);

            // Add the creator as an admin
            $chatRoom->addMember($user, true);

            // Add other members
            $usersToAdd = User::whereIn('id', $data->memberIds)
                ->where('id', '!=', $user->id)
                ->get();

            foreach ($usersToAdd as $memberUser) {
                $chatRoom->addMember($memberUser, false);
            }

            DB::commit();

            // Load relations for response
            $chatRoom->load([
                'creator:id,name,email',
                'members.user:id,name,email'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Chat room created successfully.',
                'data' => new ChatRoomResource($chatRoom)
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create chat room.',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }

    public function show(Request $request, string $family_slug, ChatRoom $room): JsonResponse
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

        $room->load([
            'creator:id,name,email',
            'members.user:id,name,email',
            'lastMessage.user:id,name,email'
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

        // Verify the room belongs to the family
        if ($room->family_id !== $family->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Chat room not found.'
            ], 404);
        }

        // Verify user is an admin of the room
        if (!$room->isAdmin($user)) {
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
            'creator:id,name,email',
            'members.user:id,name,email'
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

        // Verify the room belongs to the family
        if ($room->family_id !== $family->getId()) {
            return response()->json([
                'success' => false,
                'message' => 'Chat room not found.'
            ], 404);
        }

        // Only the creator or family owner can delete a room
        $familyMember = $request->get('_family_member');
        if ($room->created_by !== $user->id && $familyMember->getRole()->value !== '1') { // OWNER role
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete this chat room.'
            ], 403);
        }

        // Archive instead of hard delete to preserve message history
        $room->update(['is_archived' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Chat room archived successfully.'
        ]);
    }

    public function markAsRead(Request $request, string $family_slug, ChatRoom $room): JsonResponse
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

        $room->markAsRead($user);

        return response()->json([
            'success' => true,
            'message' => 'Messages marked as read.'
        ]);
    }

    public function typing(Request $request, string $family_slug, ChatRoom $room): JsonResponse
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

        $request->validate([
            'isTyping' => 'boolean'
        ]);

        $isTyping = $request->boolean('isTyping', true);

        // Broadcast typing indicator via WebSocket
        broadcast(new UserTyping($user, $room->id, $isTyping));
        
        return response()->json([
            'success' => true,
            'message' => 'Typing indicator sent.'
        ]);
    }

    public function findOrCreateDirectMessage(Request $request): JsonResponse
    {
        $user = $request->user();
        $family = $request->get('_family');
        
        $request->validate([
            'otherUserId' => 'required|integer|exists:users,id'
        ]);

        $otherUserId = $request->integer('otherUserId');

        // Check if the other user is a member of this family
        $otherMember = FamilyMember::where('family_id', $family->getId())
            ->where('user_id', $otherUserId)
            ->where('is_active', true)
            ->first();

        if (!$otherMember) {
            return response()->json([
                'success' => false,
                'message' => 'User is not a member of this family.',
            ], 404);
        }

        // Prevent direct message with yourself
        if ($user->id === $otherUserId) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot create direct message with yourself.',
            ], 400);
        }

        // Check if a direct message room already exists
        $existingRoom = ChatRoom::findDirectMessageRoom($family->getId(), $user->id, $otherUserId);

        if ($existingRoom) {
            return response()->json([
                'success' => true,
                'message' => 'Direct message room found.',
                'data' => new ChatRoomResource($existingRoom->load([
                    'creator:id,name,email',
                    'members.user:id,name,email'
                ])),
            ]);
        }

        // Create new direct message room
        $otherUser = $otherMember->relatedUser();
        $roomName = "{$user->name}, {$otherUser->name}";

        DB::beginTransaction();
        try {
            $chatRoom = ChatRoom::create([
                'family_id' => $family->getId(),
                'name' => $roomName,
                'type' => \App\Enums\Chat\ChatRoomTypeEnum::DIRECT,
                'created_by' => $user->id,
                'is_private' => true,
            ]);

            // Add both users as members using the addMember method
            $chatRoom->addMember($user, false);
            $chatRoom->addMember($otherUser, false);

            DB::commit();

            $chatRoom->load([
                'creator:id,name,email',
                'members.user:id,name,email'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Direct message room created successfully.',
                'data' => new ChatRoomResource($chatRoom),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create direct message room.',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred'
            ], 500);
        }
    }
}