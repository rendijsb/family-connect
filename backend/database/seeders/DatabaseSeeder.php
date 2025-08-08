<?php

namespace Database\Seeders;

use App\Enums\Roles\RoleEnum;
use App\Models\Users\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolesSeeder::class);

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role_id' => RoleEnum::FAMILY_OWNER->value,
        ]);
    }
}
