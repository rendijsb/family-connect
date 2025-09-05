<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Chat;

use App\Enums\Chat\MessageTypeEnum;

readonly class SendMessageRequestData
{
    public function __construct(
        public string $message,
        public MessageTypeEnum $type = MessageTypeEnum::TEXT,
        public ?int $replyToId = null,
        public ?array $attachments = null,
        public ?array $metadata = null,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            message: $data['message'],
            type: isset($data['type']) ? MessageTypeEnum::from($data['type']) : MessageTypeEnum::TEXT,
            replyToId: $data['replyToId'] ?? $data['reply_to_id'] ?? null,
            attachments: $data['attachments'] ?? null,
            metadata: $data['metadata'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'message' => $this->message,
            'type' => $this->type->value,
            'reply_to_id' => $this->replyToId,
            'attachments' => $this->attachments,
            'metadata' => $this->metadata,
        ];
    }
}
