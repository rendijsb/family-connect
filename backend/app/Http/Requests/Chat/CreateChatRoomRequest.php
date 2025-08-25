<?php

declare(strict_types=1);

namespace App\Http\Requests\Chat;

use App\DataTransferObjects\Chat\CreateChatRoomRequestData;
use App\Enums\Chat\ChatRoomTypeEnum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateChatRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:50',
                'regex:/^[a-zA-Z0-9\s\-_]+$/',
            ],
            'description' => [
                'nullable',
                'string',
                'max:200',
            ],
            'type' => [
                'required',
                'string',
                Rule::enum(ChatRoomTypeEnum::class),
            ],
            'memberIds' => [
                'required',
                'array',
                'min:1',
                'max:50',
            ],
            'memberIds.*' => [
                'required',
                'integer',
                'exists:users,id',
            ],
            'isPrivate' => [
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Chat room name is required.',
            'name.min' => 'Chat room name must be at least 2 characters.',
            'name.max' => 'Chat room name cannot exceed 50 characters.',
            'name.regex' => 'Chat room name can only contain letters, numbers, spaces, hyphens, and underscores.',
            'description.max' => 'Description cannot exceed 200 characters.',
            'type.required' => 'Chat room type is required.',
            'type.enum' => 'Invalid chat room type.',
            'memberIds.required' => 'At least one member must be selected.',
            'memberIds.min' => 'At least one member must be selected.',
            'memberIds.max' => 'Cannot add more than 50 members at once.',
            'memberIds.*.exists' => 'One or more selected members do not exist.',
        ];
    }

    public function getData(): CreateChatRoomRequestData
    {
        return CreateChatRoomRequestData::fromArray($this->validated());
    }
}
