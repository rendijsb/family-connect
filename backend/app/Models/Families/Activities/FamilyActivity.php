<?php

declare(strict_types=1);

namespace App\Models\Families\Activities;

use App\Enums\Families\Activities\ActivityStatusEnum;
use App\Enums\Families\Activities\ActivityTypeEnum;
use App\Models\Families\Family;
use App\Models\Families\FamilyMedia;
use App\Models\Families\FamilyMessage;
use App\Models\Users\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @mixin Builder
 */
class FamilyActivity extends Model
{
    public const TABLE = 'family_activities';
    protected $table = self::TABLE;

    public const ID = 'id';
    public const FAMILY_ID = 'family_id';
    public const CREATED_BY = 'created_by';
    public const TITLE = 'title';
    public const DESCRIPTION = 'description';
    public const TYPE = 'type';
    public const STATUS = 'status';
    public const ACTIVITY_DATE = 'activity_date';
    public const START_TIME = 'start_time';
    public const END_TIME = 'end_time';
    public const LOCATION = 'location';
    public const ATTENDEES = 'attendees';
    public const METADATA = 'metadata';
    public const IS_PRIVATE = 'is_private';
    public const CREATED_AT = 'created_at';
    public const UPDATED_AT = 'updated_at';

    protected $fillable = [
        self::FAMILY_ID,
        self::CREATED_BY,
        self::TITLE,
        self::DESCRIPTION,
        self::TYPE,
        self::STATUS,
        self::ACTIVITY_DATE,
        self::START_TIME,
        self::END_TIME,
        self::LOCATION,
        self::ATTENDEES,
        self::METADATA,
        self::IS_PRIVATE,
    ];

    protected $casts = [
        self::FAMILY_ID => 'integer',
        self::CREATED_BY => 'integer',
        self::TYPE => ActivityTypeEnum::class,
        self::STATUS => ActivityStatusEnum::class,
        self::ACTIVITY_DATE => 'datetime',
        self::START_TIME => 'datetime',
        self::END_TIME => 'datetime',
        self::ATTENDEES => 'array',
        self::METADATA => 'array',
        self::IS_PRIVATE => 'boolean',
    ];

    /** Relations */
    /** @see FamilyActivity::familyRelation() */
    const FAMILY_RELATION = 'familyRelation';
    /** @see FamilyActivity::creatorRelation() */
    const CREATOR_RELATION = 'creatorRelation';
    /** @see FamilyActivity::messagesRelation() */
    const MESSAGES_RELATION = 'messagesRelation';
    /** @see FamilyActivity::mediaRelation() */
    const MEDIA_RELATION = 'mediaRelation';

    public function familyRelation(): BelongsTo
    {
        return $this->belongsTo(Family::class, self::FAMILY_ID, Family::ID);
    }

    public function creatorRelation(): BelongsTo
    {
        return $this->belongsTo(User::class, self::CREATED_BY, User::ID);
    }

    public function messagesRelation(): HasMany
    {
        return $this->hasMany(FamilyMessage::class, FamilyMessage::ACTIVITY_ID, self::ID);
    }

    public function mediaRelation(): HasMany
    {
        return $this->hasMany(FamilyMedia::class, FamilyMedia::ACTIVITY_ID, self::ID);
    }

    // Getters
    public function getId(): int
    {
        return $this->getAttribute(self::ID);
    }

    public function getFamilyId(): int
    {
        return $this->getAttribute(self::FAMILY_ID);
    }

    public function getCreatedBy(): int
    {
        return $this->getAttribute(self::CREATED_BY);
    }

    public function getTitle(): string
    {
        return $this->getAttribute(self::TITLE);
    }

    public function getDescription(): ?string
    {
        return $this->getAttribute(self::DESCRIPTION);
    }

    public function getType(): ActivityTypeEnum
    {
        return $this->getAttribute(self::TYPE);
    }

    public function getStatus(): ActivityStatusEnum
    {
        return $this->getAttribute(self::STATUS);
    }

    public function getActivityDate(): ?Carbon
    {
        return $this->getAttribute(self::ACTIVITY_DATE);
    }

    public function getStartTime(): ?Carbon
    {
        return $this->getAttribute(self::START_TIME);
    }

    public function getEndTime(): ?Carbon
    {
        return $this->getAttribute(self::END_TIME);
    }

    public function getLocation(): ?string
    {
        return $this->getAttribute(self::LOCATION);
    }

    public function getAttendees(): ?array
    {
        return $this->getAttribute(self::ATTENDEES);
    }

    public function getMetadata(): ?array
    {
        return $this->getAttribute(self::METADATA);
    }

    public function getIsPrivate(): bool
    {
        return $this->getAttribute(self::IS_PRIVATE);
    }

    public function getCreatedAt(): Carbon
    {
        return $this->getAttribute(self::CREATED_AT);
    }

    public function getUpdatedAt(): Carbon
    {
        return $this->getAttribute(self::UPDATED_AT);
    }

    // Related models
    public function relatedFamily(): Family
    {
        return $this->{self::FAMILY_RELATION};
    }

    public function relatedCreator(): User
    {
        return $this->{self::CREATOR_RELATION};
    }

    /** @return Collection<FamilyMessage> */
    public function relatedMessages(): Collection
    {
        return $this->{self::MESSAGES_RELATION};
    }

    /** @return Collection<FamilyMedia> */
    public function relatedMedia(): Collection
    {
        return $this->{self::MEDIA_RELATION};
    }

    // Utility methods
    public function isUpcoming(): bool
    {
        if (!$this->getActivityDate()) {
            return false;
        }

        return $this->getActivityDate()->isFuture() &&
            in_array($this->getStatus(), [ActivityStatusEnum::PLANNED, ActivityStatusEnum::ACTIVE]);
    }

    public function isOngoing(): bool
    {
        if (!$this->getStartTime() || !$this->getEndTime()) {
            return $this->getStatus() === ActivityStatusEnum::ACTIVE;
        }

        $now = now();
        return $now->between($this->getStartTime(), $this->getEndTime()) &&
            $this->getStatus() === ActivityStatusEnum::ACTIVE;
    }

    public function isPast(): bool
    {
        if (!$this->getActivityDate()) {
            return $this->getStatus() === ActivityStatusEnum::COMPLETED;
        }

        return $this->getActivityDate()->isPast() ||
            $this->getStatus() === ActivityStatusEnum::COMPLETED;
    }

    public function canBeEdited(): bool
    {
        return $this->getStatus()->canBeEdited();
    }

    public function canBeCancelled(): bool
    {
        return $this->getStatus()->canBeCancelled();
    }

    public function hasAttendee(int $userId): bool
    {
        $attendees = $this->getAttendees();
        return $attendees && in_array($userId, $attendees);
    }

    public function addAttendee(int $userId): void
    {
        $attendees = $this->getAttendees() ?? [];
        if (!in_array($userId, $attendees)) {
            $attendees[] = $userId;
            $this->setAttribute(self::ATTENDEES, $attendees);
        }
    }

    public function removeAttendee(int $userId): void
    {
        $attendees = $this->getAttendees() ?? [];
        $attendees = array_values(array_filter($attendees, fn($id) => $id !== $userId));
        $this->setAttribute(self::ATTENDEES, $attendees);
    }

    public function getAttendeeCount(): int
    {
        return count($this->getAttendees() ?? []);
    }

    public function getDuration(): ?int
    {
        if (!$this->getStartTime() || !$this->getEndTime()) {
            return null;
        }

        return $this->getStartTime()->diffInMinutes($this->getEndTime());
    }

    public function isAllDay(): bool
    {
        if (!$this->getStartTime() || !$this->getEndTime()) {
            return false;
        }

        return $this->getStartTime()->format('H:i') === '00:00' &&
            $this->getEndTime()->format('H:i') === '23:59';
    }

    public function getDisplayDate(): string
    {
        if (!$this->getActivityDate()) {
            return 'No date set';
        }

        if ($this->isAllDay()) {
            return $this->getActivityDate()->format('M j, Y');
        }

        return $this->getActivityDate()->format('M j, Y \a\t g:i A');
    }

    // Scopes
    public function scopeForFamily(Builder $query, int $familyId): Builder
    {
        return $query->where(self::FAMILY_ID, $familyId);
    }

    public function scopeByType(Builder $query, ActivityTypeEnum $type): Builder
    {
        return $query->where(self::TYPE, $type);
    }

    public function scopeByStatus(Builder $query, ActivityStatusEnum $status): Builder
    {
        return $query->where(self::STATUS, $status);
    }

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where(self::ACTIVITY_DATE, '>', now())
            ->whereIn(self::STATUS, [ActivityStatusEnum::PLANNED, ActivityStatusEnum::ACTIVE]);
    }

    public function scopePast(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->where(self::ACTIVITY_DATE, '<', now())
                ->orWhere(self::STATUS, ActivityStatusEnum::COMPLETED);
        });
    }

    public function scopePublic(Builder $query): Builder
    {
        return $query->where(self::IS_PRIVATE, false);
    }

    public function scopePrivate(Builder $query): Builder
    {
        return $query->where(self::IS_PRIVATE, true);
    }

    public function scopeWithAttendee(Builder $query, int $userId): Builder
    {
        return $query->whereJsonContains(self::ATTENDEES, $userId);
    }
}
