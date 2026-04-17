<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Role;
use App\Models\Setting;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

class BackupService
{
    public function create(): array
    {
        $backupEnabled = (Setting::query()->where('key', 'backup_enabled')->value('value') ?? '1') === '1';

        if (!$backupEnabled) {
            throw new \RuntimeException('Les sauvegardes automatiques sont désactivées dans les paramètres.');
        }

        $backupPayload = [
            'generated_at' => now()->toIso8601String(),
            'settings' => Setting::query()->get()->map(fn ($setting) => [
                'key' => $setting->key,
                'value' => $setting->value,
            ])->all(),
            'users' => User::query()->get()->toArray(),
            'roles' => Role::query()->get()->toArray(),
            'categories' => Category::query()->get()->toArray(),
            'ingredients' => Ingredient::query()->get()->toArray(),
            'products' => Product::with('ingredients')->get()->toArray(),
            'orders' => Order::with('items.product')->get()->toArray(),
            'order_items' => OrderItem::query()->get()->toArray(),
            'payments' => Payment::query()->get()->toArray(),
            'stock_movements' => StockMovement::query()->with('ingredient')->get()->toArray(),
        ];

        $directory = 'backups';
        $fileName = 'backup-' . now()->format('Ymd-His') . '.json';
        Storage::disk('local')->makeDirectory($directory);
        Storage::disk('local')->put($directory . '/' . $fileName, json_encode($backupPayload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return [
            'file' => $fileName,
            'path' => storage_path('app/' . $directory . '/' . $fileName),
        ];
    }
}
