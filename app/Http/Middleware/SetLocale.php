<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Setting;

class SetLocale
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Get language from settings (single 'language' setting)
        $languageSetting = Setting::where('key', 'language')->first();
        
        if ($languageSetting) {
            $locale = $languageSetting->value;
            // Validate that the locale is supported
            if (in_array($locale, ['en', 'fr', 'ar'])) {
                app()->setLocale($locale);
            }
        } else {
            // Fallback to default
            app()->setLocale(config('app.locale', 'en'));
        }

        return $next($request);
    }
}
