<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\Roles\RoleEnum;
use App\Models\Roles\Role;
use Illuminate\Database\Seeder;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        Role::query()->delete();

        foreach (RoleEnum::cases() as $roleEnum) {
            Role::create([
                'id' => $roleEnum->value,
                'name' => $roleEnum->getName(),
                'display_name' => $roleEnum->getDisplayName(),
                'description' => $roleEnum->getDescription(),
                'is_active' => true,
            ]);
        }

        $this->command->info('Roles seeded successfully:');
        foreach (RoleEnum::cases() as $roleEnum) {
            $this->command->info("- {$roleEnum->value}: {$roleEnum->getDisplayName()}");
        }
    }
}
