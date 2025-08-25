<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Chat;

use App\Enums\Chat\ChatRoomTypeEnum;

readonly class CreateChatRoomRequestData
{
    public function __construct(
        public string $name,
        public ChatRoomTypeEnum $type,
        public array $memberIds,
        public ?string $description = null,
        public bool $isPrivate = false,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            type: ChatRoomTypeEnum::from($data['type']),
            memberIds: $data['memberIds'] ?? $data['member_ids'] ?? [],
            description: $data['description'] ?? null,
            isPrivate: $data['isPrivate'] ?? $data['is_private'] ?? false,
        );
    }

    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'type' => $this->type->value,
            'member_ids' => $this->memberIds,
            'description' => $this->description,
            'is_private' => $this->isPrivate,
        ];
    }
}
