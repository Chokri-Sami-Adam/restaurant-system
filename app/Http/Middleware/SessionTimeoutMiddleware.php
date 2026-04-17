<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Carbon\Carbon;
use Closure;
use Illuminate\Http\Request;

class SessionTimeoutMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return $next($request);
        }

        $token = $user->currentAccessToken();
        if (!$token || !$token->created_at) {
            return $next($request);
        }

        $timeout = (int) (Setting::query()->where('key', 'session_timeout_minutes')->value('value') ?? 120);
        if ($timeout < 5) {
            $timeout = 5;
        }

        $tokenCreated = Carbon::parse($token->created_at);
        if ($tokenCreated->diffInMinutes(now()) > $timeout) {
            $token->delete();
            return response()->json([
                'message' => 'Session expirée. Veuillez vous reconnecter.'
            ], 401);
        }

        return $next($request);
    }
}
