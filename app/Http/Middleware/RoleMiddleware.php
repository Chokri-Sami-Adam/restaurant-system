<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * Supports multiple roles: role:admin,manager
     * NOTE: Admin role always has access to all routes
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!auth()->check()) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $user = auth()->user();
        $user->load('role');

        if (!$user->role || !$user->role->name) {
            return response()->json(['message' => 'User has no role assigned'], 403);
        }

        $userRole = strtolower($user->role->name);

        // 👑 Admin Override: Admin always has access
        if ($userRole === 'admin') {
            return $next($request);
        }

        // For other roles, check against allowed roles
        $allowedRoles = [];
        foreach ($roles as $roleGroup) {
            $parts = explode(',', $roleGroup);
            foreach ($parts as $part) {
                $allowedRoles[] = strtolower(trim($part));
            }
        }

        if (!empty($allowedRoles) && !in_array($userRole, $allowedRoles)) {
            return response()->json([
                'message' => 'Forbidden - Your role (' . $userRole . ') does not have access to this resource'
            ], 403);
        }

        return $next($request);
    }
}
