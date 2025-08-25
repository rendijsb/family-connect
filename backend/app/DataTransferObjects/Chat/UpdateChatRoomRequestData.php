<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Chat;

readonly class UpdateChatRoomRequestData
{
    public function __construct(
        public ?string $name = null,
        public ?string $description = null,
        public ?bool $isPrivate = null,
        public ?array $settings = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'] ?? null,
            description: $data['description'] ?? null,
            isPrivate: isset($data['isPrivate']) ? $data['isPrivate'] : ($data['is_private'] ?? null),
            settings: $data['settings'] ?? null,
        );
    }

    public function toArray(): array
    {
        $result = [];
        
        if ($this->name !== null) {
            $result['name'] = $this->name;
        }
        
        if ($this->description !== null) {
            $result['description'] = $this->description;
        }
        
        if ($this->isPrivate !== null) {
            $result['is_private'] = $this->isPrivate;
        }
        
        if ($this->settings !== null) {
            $result['settings'] = $this->settings;
        }
        
        return $result;
    }

    public function hasUpdates(): bool
    {
        return $this->name !== null 
            || $this->description !== null 
            || $this->isPrivate !== null 
            || $this->settings !== null;
    }
}
