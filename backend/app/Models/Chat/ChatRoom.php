<?php

declare(strict_types=1);

namespace App\Models\Chat;

use App\Enums\Chat\ChatRoomTypeEnum;
use App\Models\Families\Family;
use App\Models\Users\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ChatRoom extends Model
{
    use HasFactory;

    protected $fillable = [
        'family_id',
        'name',
        'type',
        'description',
        'created_by',
        'is_private',
        'is_archived',
        'settings',
        'last_message_at',
    ];

    protected $casts = [
        'type' => ChatRoomTypeEnum::class,
        'is_private' => 'boolean',
        'is_archived' => 'boolean',
        'settings' => 'array',
        'last_message_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(ChatRoomMember::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'chat_room_members')
            ->withPivot([
                'is_admin',
                'is_muted',
                'last_read_at',
                'unread_count',
                'muted_until',
                'created_at',
                'updated_at'
            ])
            ->withTimestamps();
    }

    public function lastMessage(): BelongsTo
    {
        return $this->belongsTo(ChatMessage::class, 'last_message_id');
    }

    // Custom methods
    public static function findDirectMessageRoom(int $familyId, int $userId1, int $userId2): ?self
    {
        return self::query()
            ->where('family_id', $familyId)
            ->where('type', ChatRoomTypeEnum::DIRECT)
            ->whereHas('members', function ($query) use ($userId1) {
                $query->where('user_id', $userId1);
            })
            ->whereHas('members', function ($query) use ($userId2) {
                $query->where('user_id', $userId2);
            })
            ->first();
    }

    // Scopes
    public function scopeForFamily($query, int $familyId)
    {
        return $query->where('family_id', $familyId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_archived', false);
    }

    public function scopePublic($query)
    {
        return $query->where('is_private', false);
    }

    public function scopePrivate($query)
    {
        return $query->where('is_private', true);
    }

    public function scopeByType($query, ChatRoomTypeEnum $type)
    {
        return $query->where('type', $type);
    }

    // Helper methods
    public function isAdmin(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->where('is_admin', true)->exists();
    }

    public function isMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }

    public function isMuted(User $user): bool
    {
        $member = $this->members()->where('user_id', $user->id)->first();
        if (!$member) {
            return false;
        }

        if (!$member->is_muted) {
            return false;
        }

        if ($member->muted_until && $member->muted_until->isPast()) {
            // Unmute if mute period has expired
            $member->update(['is_muted' => false, 'muted_until' => null]);
            return false;
        }

        return true;
    }

    public function getUnreadCount(User $user): int
    {
        $member = $this->members()->where('user_id', $user->id)->first();
        return $member ? $member->unread_count : 0;
    }

    public function addMember(User $user, bool $isAdmin = false): ChatRoomMember
    {
        return $this->members()->create([
            'user_id' => $user->id,
            'is_admin' => $isAdmin,
        ]);
    }

    public function removeMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->delete() > 0;
    }

    public function markAsRead(User $user): void
    {
        $this->members()
            ->where('user_id', $user->id)
            ->update([
                'last_read_at' => now(),
                'unread_count' => 0,
            ]);
    }

    public function incrementUnreadCount(User $user): void
    {
        $this->members()
            ->where('user_id', $user->id)
            ->increment('unread_count');
    }

    public function updateLastMessageAt(): void
    {
        $this->update(['last_message_at' => now()]);
    }
}
