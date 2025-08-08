<?php

declare(strict_types=1);

namespace App\Http\Resources\Auth;

use App\DataTransferObjects\Auth\AuthResponseData;
use App\Http\Resources\Users\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthResource extends JsonResource
{
    /**
     * @var AuthResponseData $resource
     */
    public $resource;

    public function toArray(Request $request): array
    {
        return [
            'user' => UserResource::make($this->resource->user),
            'token' => $this->resource->token,
            'tokenType' => $this->resource->tokenType,
        ];
    }
}
