<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;

class RuntimeSettingsMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $settings = Setting::query()->pluck('value', 'key')->toArray();

        $timezone = $settings['timezone'] ?? config('app.timezone', 'UTC');
        $language = $settings['language'] ?? config('app.locale', 'fr');
        $appName = $settings['restaurant_name'] ?? $settings['app_name'] ?? config('app.name', 'RestauPro');
        $debugMode = ($settings['debug_mode'] ?? '0') === '1';

        config([
            'app.name' => $appName,
            'app.timezone' => $timezone,
            'app.debug' => $debugMode,
            'app.locale' => $language,
        ]);

        app()->setLocale($language);
        date_default_timezone_set($timezone);

        return $next($request);
    }
}
