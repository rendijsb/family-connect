<?php

namespace Database\Seeders;

use App\Enums\Roles\RoleEnum;
use App\Models\Users\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolesSeeder::class);

        User::create([
            'name' => 'Test User',
            'email' => 'test@admin.com',
            'password' => Hash::make('123qwe@W'),
            'role_id' => RoleEnum::ADMIN->value,
        ]);
    }
}
