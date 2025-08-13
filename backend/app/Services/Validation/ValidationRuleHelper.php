<?php

declare(strict_types=1);

namespace App\Services\Validation;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;

class ValidationRuleHelper
{
    public const REQUIRED = 'required';
    public const STRING = 'string';
    public const EMAIL = 'email';
    public const INTEGER = 'integer';
    public const BOOLEAN = 'boolean';
    public const NULLABLE = 'nullable';
    public const ARRAY = 'array';
    public const SOMETIMES = 'sometimes';
    public const UNIQUE = 'unique';
    public const MIN = 'min';
    public const MAX = 'max';
    public const CONFIRMED = 'confirmed';

    public static function min(int $length): string
    {
        return self::MIN . ':' . $length;
    }

    public static function max(int $length): string
    {
        return self::MAX . ':' . $length;
    }

    public static function unique(string $table, string $column = 'NULL', ?int $ignoreId = null): string
    {
        $rule = self::UNIQUE . ':' . $table . ',' . $column;

        if ($ignoreId) {
            $rule .= ',' . $ignoreId;
        }

        return $rule;
    }

    public static function existsOnDatabase(string $table, string $column): Exists
    {
        return Rule::exists($table, $column);
    }
}
