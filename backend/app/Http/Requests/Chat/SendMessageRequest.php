<?php

declare(strict_types=1);

namespace App\Http\Requests\Chat;

use App\DataTransferObjects\Chat\SendMessageRequestData;
use App\Enums\Chat\MessageTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'message' => [
                'required',
                'string',
                'min:1',
                'max:5000',
            ],
            'type' => [
                'nullable',
                'string',
                Rule::enum(MessageTypeEnum::class),
            ],
            'replyToId' => [
                'nullable',
                'integer',
                'exists:chat_messages,id',
            ],
            'attachments' => [
                'nullable',
                'array',
                'max:10',
            ],
            'attachments.*' => [
                'array',
            ],
            'attachments.*.url' => [
                'required_with:attachments.*',
                'string',
                'url',
            ],
            'attachments.*.type' => [
                'required_with:attachments.*',
                'string',
                'in:image,video,audio,file,document',
            ],
            'attachments.*.name' => [
                'nullable',
                'string',
                'max:255',
            ],
            'attachments.*.size' => [
                'nullable',
                'integer',
                'min:0',
            ],
            'metadata' => [
                'nullable',
                'array',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'message.required' => 'Message content is required.',
            'message.min' => 'Message cannot be empty.',
            'message.max' => 'Message cannot exceed 5000 characters.',
            'type.enum' => 'Invalid message type.',
            'replyToId.exists' => 'The message you are replying to does not exist.',
            'attachments.max' => 'Cannot send more than 10 attachments.',
            'attachments.*.url.required_with' => 'Attachment URL is required.',
            'attachments.*.url.url' => 'Invalid attachment URL.',
            'attachments.*.type.required_with' => 'Attachment type is required.',
            'attachments.*.type.in' => 'Invalid attachment type.',
            'attachments.*.name.max' => 'Attachment name cannot exceed 255 characters.',
            'attachments.*.size.min' => 'Invalid attachment size.',
        ];
    }

    public function getData(): SendMessageRequestData
    {
        return SendMessageRequestData::fromArray($this->validated());
    }
}
