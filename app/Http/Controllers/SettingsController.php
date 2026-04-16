<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    /**
     * Real defaults used when DB has no value yet.
     */
    private const DEFAULTS = [
        // 1) Restaurant Information
        'restaurant_name' => 'RestauPro',
        'restaurant_address' => '',
        'restaurant_phone' => '',
        'restaurant_email' => '',
        'restaurant_logo_path' => '',
        'opening_hours' => 'Lundi - Dimanche: 08:00 - 23:00',

        // 2) Payment Settings
        'currency' => 'MAD',
        'tax_rate' => 20.0,
        'payment_cash' => true,
        'payment_card' => true,
        'payment_online' => false,

        // 3) Order Settings
        'order_dine_in' => true,
        'order_takeaway' => true,
        'order_delivery' => false,
        'default_order_status' => 'pending',
        'auto_update_order_status' => false,

        // 4) Notifications
        'notify_email' => true,
        'notify_low_stock' => true,
        'notify_sms' => false,

        // 5) Localization
        'language' => 'fr',
        'timezone' => 'Africa/Casablanca',
        'date_format' => 'd/m/Y',

        // 6) Receipt Settings
        'receipt_show_logo' => true,
        'receipt_footer_message' => 'Merci pour votre visite',
        'receipt_show_tax_details' => true,

        // 7) Stock Settings
        'low_stock_threshold' => 5,
        'auto_stock_deduction' => true,

        // 8) Security Settings
        'min_password_length' => 8,
        'session_timeout_minutes' => 120,
        'enable_2fa' => false,

        // Compatibility with existing UI
        'app_name' => 'RestauPro',
        'app_url' => 'http://localhost',
        'notifications' => true,
        'maintenance_mode' => false,
        'backup_enabled' => true,
        'debug_mode' => false,
    ];

    private const TYPES = [
        'tax_rate' => 'float',
        'low_stock_threshold' => 'int',
        'min_password_length' => 'int',
        'session_timeout_minutes' => 'int',

        'payment_cash' => 'bool',
        'payment_card' => 'bool',
        'payment_online' => 'bool',
        'order_dine_in' => 'bool',
        'order_takeaway' => 'bool',
        'order_delivery' => 'bool',
        'auto_update_order_status' => 'bool',
        'notify_email' => 'bool',
        'notify_low_stock' => 'bool',
        'notify_sms' => 'bool',
        'receipt_show_logo' => 'bool',
        'receipt_show_tax_details' => 'bool',
        'auto_stock_deduction' => 'bool',
        'enable_2fa' => 'bool',

        // compatibility booleans
        'notifications' => 'bool',
        'maintenance_mode' => 'bool',
        'backup_enabled' => 'bool',
        'debug_mode' => 'bool',
    ];

    public function index(): JsonResponse
    {
        $stored = Setting::query()->pluck('value', 'key')->toArray();

        $settings = self::DEFAULTS;

        foreach ($stored as $key => $value) {
            $settings[$key] = $this->castFromStorage($key, $value);
        }

        if (!empty($settings['restaurant_logo_path'])) {
            $settings['restaurant_logo_url'] = asset('storage/' . $settings['restaurant_logo_path']);
        } else {
            $settings['restaurant_logo_url'] = null;
        }

        // keep compatibility in sync
        $settings['app_name'] = $settings['restaurant_name'];
        $settings['notifications'] = $settings['notify_email'];

        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            // 1) Restaurant Information
            'restaurant_name' => 'sometimes|string|max:255',
            'restaurant_address' => 'sometimes|string|max:500',
            'restaurant_phone' => 'sometimes|string|max:50',
            'restaurant_email' => 'sometimes|nullable|email|max:255',
            'opening_hours' => 'sometimes|string|max:1000',
            'restaurant_logo' => 'sometimes|nullable|image|mimes:jpg,jpeg,png,webp|max:2048',

            // 2) Payment Settings
            'currency' => 'sometimes|string|in:MAD,EUR,USD,GBP',
            'tax_rate' => 'sometimes|numeric|min:0|max:100',
            'payment_cash' => 'sometimes|boolean',
            'payment_card' => 'sometimes|boolean',
            'payment_online' => 'sometimes|boolean',

            // 3) Order Settings
            'order_dine_in' => 'sometimes|boolean',
            'order_takeaway' => 'sometimes|boolean',
            'order_delivery' => 'sometimes|boolean',
            'default_order_status' => 'sometimes|string|in:pending,preparing,ready,served,cancelled',
            'auto_update_order_status' => 'sometimes|boolean',

            // 4) Notifications
            'notify_email' => 'sometimes|boolean',
            'notify_low_stock' => 'sometimes|boolean',
            'notify_sms' => 'sometimes|boolean',

            // 5) Localization
            'language' => 'sometimes|string|in:fr,ar,en',
            'timezone' => 'sometimes|string|max:100',
            'date_format' => 'sometimes|string|in:d/m/Y,m/d/Y,Y-m-d',

            // 6) Receipt Settings
            'receipt_show_logo' => 'sometimes|boolean',
            'receipt_footer_message' => 'sometimes|string|max:500',
            'receipt_show_tax_details' => 'sometimes|boolean',

            // 7) Stock Settings
            'low_stock_threshold' => 'sometimes|integer|min:0|max:100000',
            'auto_stock_deduction' => 'sometimes|boolean',

            // 8) Security Settings
            'min_password_length' => 'sometimes|integer|min:6|max:64',
            'session_timeout_minutes' => 'sometimes|integer|min:5|max:1440',
            'enable_2fa' => 'sometimes|boolean',

            // compatibility keys
            'maintenance_mode' => 'sometimes|boolean',
            'backup_enabled' => 'sometimes|boolean',
            'debug_mode' => 'sometimes|boolean',
            'app_url' => 'sometimes|nullable|url|max:255',
        ]);

        if ($request->hasFile('restaurant_logo')) {
            // Delete all old logos first
            if (Storage::disk('public')->exists('restaurant-logos')) {
                Storage::disk('public')->deleteDirectory('restaurant-logos');
                Storage::disk('public')->makeDirectory('restaurant-logos');
            }

            // Save new logo as exactly logo.png
            $file = $request->file('restaurant_logo');
            Storage::disk('public')->put('restaurant-logos/logo.png', file_get_contents($file));

            $validated['restaurant_logo_path'] = 'restaurant-logos/logo.png';
        }

        // Keep backward compatibility in sync
        if (array_key_exists('restaurant_name', $validated)) {
            $validated['app_name'] = $validated['restaurant_name'];
        }
        if (array_key_exists('notify_email', $validated)) {
            $validated['notifications'] = $validated['notify_email'];
        }

        foreach ($validated as $key => $value) {
            if ($key === 'restaurant_logo') {
                continue;
            }

            Setting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $this->castForStorage($key, $value)]
            );
        }

        return response()->json([
            'message' => 'Paramètres mis à jour avec succès',
            'data' => $this->index()->getData(true),
        ]);
    }

    private function castForStorage(string $key, mixed $value): string
    {
        if (isset(self::TYPES[$key]) && self::TYPES[$key] === 'bool') {
            return $value ? '1' : '0';
        }

        return (string) $value;
    }

    private function castFromStorage(string $key, string $value): mixed
    {
        $type = self::TYPES[$key] ?? 'string';

        return match ($type) {
            'bool' => $value === '1',
            'int' => (int) $value,
            'float' => (float) $value,
            default => $value,
        };
    }
}
