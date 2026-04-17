<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * List all users with their roles
     */
    public function index()
    {
        $users = User::with('role')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $users
        ]);
    }

    /**
     * Create a new user with role assignment
     */
    public function store(Request $request)
    {
        $minPasswordLength = (int) (Setting::query()->where('key', 'min_password_length')->value('value') ?? 8);
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:' . $minPasswordLength,
            'role_id' => 'required|exists:roles,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
        ]);

        $user->load('role');

        return response()->json([
            'message' => 'User created successfully',
            'data' => $user
        ], 201);
    }

    /**
     * Update user info and/or role
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $minPasswordLength = (int) (Setting::query()->where('key', 'min_password_length')->value('value') ?? 8);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|min:' . $minPasswordLength,
            'role_id' => 'sometimes|exists:roles,id',
        ]);

        // Prepare data to update
        $data = $request->only(['name', 'email', 'role_id']);

        if ($request->has('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);
        $user->load('role');

        return response()->json([
            'message' => 'User updated successfully',
            'data' => $user
        ]);
    }

    /**
     * Delete a user
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        // Prevent self-deletion
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'You cannot delete yourself'
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * List all available roles
     */
    public function roles()
    {
        return response()->json([
            'data' => Role::all()
        ]);
    }
}
