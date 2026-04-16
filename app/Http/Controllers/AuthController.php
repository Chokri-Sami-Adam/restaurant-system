<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use RuntimeException;

class AuthController extends Controller
{
    // ✅ REGISTER
    public function register(Request $request)
    {
        $minPasswordLength = (int) (Setting::query()->where('key', 'min_password_length')->value('value') ?? 8);
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|min:' . $minPasswordLength
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token
        ], 201);
    }

    // ✅ LOGIN
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'otp_code' => 'nullable|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();

        $passwordMatches = false;
        if ($user) {
            try {
                $passwordMatches = Hash::check($request->password, $user->password);
            } catch (RuntimeException $e) {
                Log::warning('Invalid stored password hash for user', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ]);
                $passwordMatches = false;
            }
        }

        if (!$user || !$passwordMatches) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $enable2FA = (Setting::query()->where('key', 'enable_2fa')->value('value') ?? '0') === '1';
        if ($enable2FA) {
            $cacheKey = 'login_2fa_' . $user->id;

            if (!$request->filled('otp_code')) {
                $code = (string) random_int(100000, 999999);
                Cache::put($cacheKey, $code, now()->addMinutes(10));
                $mailSent = true;

                try {
                    Mail::raw('Votre code de verification est: ' . $code, function ($message) use ($user) {
                        $message->to($user->email)->subject('Code de verification 2FA');
                    });
                } catch (\Throwable $e) {
                    // Fallback: keep system usable even without mail provider
                    Log::warning('2FA mail not sent', ['user_id' => $user->id, 'code' => $code, 'error' => $e->getMessage()]);
                    $mailSent = false;
                }

                $response = [
                    'two_factor_required' => true,
                    'message' => 'Code 2FA requis. Vérifiez votre email.',
                ];

                if (!$mailSent && config('app.debug')) {
                    $response['otp_demo_code'] = $code;
                    $response['message'] = 'Mail non configuré. Code de test retourné en mode debug.';
                }

                return response()->json($response, 202);
            }

            $cached = Cache::get($cacheKey);
            if (!$cached || $request->otp_code !== $cached) {
                return response()->json([
                    'message' => 'Code 2FA invalide ou expiré.'
                ], 422);
            }

            Cache::forget($cacheKey);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        // Load role so frontend gets the role name
        $user->load('role');

        return response()->json([
            'user' => $user,
            'token' => $token
        ]);
    }

    // ✅ LOGOUT
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }
}
