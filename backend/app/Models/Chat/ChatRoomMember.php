<?php

declare(strict_types=1);

namespace App\Models\Chat;

use App\Models\Users\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatRoomMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_room_id',
        'user_id',
        'is_admin',
        'is_muted',
        'last_read_at',
        'unread_count',
        'muted_until',
    ];

    protected $casts = [
        'is_admin' => 'boolean',
        'is_muted' => 'boolean',
        'last_read_at' => 'datetime',
        'unread_count' => 'integer',
        'muted_until' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function chatRoom(): BelongsTo
    {
        return $this->belongsTo(ChatRoom::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeForRoom($query, int $roomId)
    {
        return $query->where('chat_room_id', $roomId);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeAdmins($query)
    {
        return $query->where('is_admin', true);
    }

    public function scopeActive($query)
    {
        return $query->where('is_muted', false);
    }

    public function scopeMuted($query)
    {
        return $query->where('is_muted', true);
    }

    public function scopeWithUnreadMessages($query)
    {
        return $query->where('unread_count', '>', 0);
    }

    // Helper methods
    public function markAsRead(): void
    {
        $this->update([
            'last_read_at' => now(),
            'unread_count' => 0,
        ]);
    }

    public function incrementUnreadCount(): void
    {
        $this->increment('unread_count');
    }

    public function mute(?int $minutes = null): void
    {
        $this->update([
            'is_muted' => true,
            'muted_until' => $minutes ? now()->addMinutes($minutes) : null,
        ]);
    }

    public function unmute(): void
    {
        $this->update([
            'is_muted' => false,
            'muted_until' => null,
        ]);
    }

    public function makeAdmin(): void
    {
        $this->update(['is_admin' => true]);
    }

    public function removeAdmin(): void
    {
        $this->update(['is_admin' => false]);
    }

    public function isMutedNow(): bool
    {
        if (!$this->is_muted) {
            return false;
        }

        if ($this->muted_until && $this->muted_until->isPast()) {
            $this->unmute();
            return false;
        }

        return true;
    }

    public function hasUnreadMessages(): bool
    {
        return $this->unread_count > 0;
    }

    public function getTimeUntilUnmute(): ?int
    {
        if (!$this->is_muted || !$this->muted_until) {
            return null;
        }

        return $this->muted_until->diffInMinutes(now());
    }
}
