<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $role = Role::where('name', 'admin')->first();

        User::firstOrCreate(
            ['email' => 'admin@restaurant.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'role_id' => $role->id,
            ]
        );
    }
}
