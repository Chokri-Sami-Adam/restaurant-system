<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;

class MaintenanceModeMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $maintenanceMode = (Setting::query()->where('key', 'maintenance_mode')->value('value') ?? '0') === '1';

        if (!$maintenanceMode) {
            return $next($request);
        }

        $user = $request->user();

        if ($user && $user->role && $user->role->name === 'admin') {
            return $next($request);
        }

        return response()->json([
            'message' => 'Le système est en maintenance. Réessayez plus tard.',
        ], 503);
    }
}
