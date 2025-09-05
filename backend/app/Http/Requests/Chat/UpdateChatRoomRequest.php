<?php

declare(strict_types=1);

namespace App\Http\Requests\Chat;

use App\DataTransferObjects\Chat\UpdateChatRoomRequestData;
use Illuminate\Foundation\Http\FormRequest;

class UpdateChatRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'name' => [
                'sometimes',
                'string',
                'min:2',
                'max:50',
                'regex:/^[a-zA-Z0-9\s\-_]+$/',
            ],
            'description' => [
                'sometimes',
                'nullable',
                'string',
                'max:200',
            ],
            'isPrivate' => [
                'sometimes',
                'boolean',
            ],
            'settings' => [
                'sometimes',
                'nullable',
                'array',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.min' => 'Chat room name must be at least 2 characters.',
            'name.max' => 'Chat room name cannot exceed 50 characters.',
            'name.regex' => 'Chat room name can only contain letters, numbers, spaces, hyphens, and underscores.',
            'description.max' => 'Description cannot exceed 200 characters.',
        ];
    }

    public function getData(): UpdateChatRoomRequestData
    {
        return UpdateChatRoomRequestData::fromArray($this->validated());
    }
}
