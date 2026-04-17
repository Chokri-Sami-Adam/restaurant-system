<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProductIngredientController;
use App\Http\Controllers\StockController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\IngredientController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\UserController;

// ──────────────────────────────────────────────
// 🔓 Public routes
// ──────────────────────────────────────────────
Route::middleware(['runtime.settings'])->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/public/settings', [AdminController::class, 'publicSettings']);
});

// ──────────────────────────────────────────────
// 🔐 Authenticated routes (any logged-in user)
// ──────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'runtime.settings', 'maintenance.mode', 'session.timeout'])->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

// ──────────────────────────────────────────────
// 👑 Admin only
// ──────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'runtime.settings', 'maintenance.mode', 'session.timeout', 'role:admin'])->group(function () {
    // 📊 Dashboard & Analytics
    Route::get('/admin/stats', [AdminController::class, 'stats']);
    Route::get('/admin/analytics/revenue', [AdminController::class, 'analyticsRevenue']);
    Route::get('/admin/best-selling-products', [AdminController::class, 'bestSellingProducts']);
    Route::get('/admin/system-activity', [AdminController::class, 'systemActivity']);
    Route::get('/admin/performance-metrics', [AdminController::class, 'performanceMetrics']);
    Route::post('/admin/backups', [AdminController::class, 'createBackup']);

    // 📊 Reports & Statistics
    Route::get('/admin/reports/sales', [AdminController::class, 'salesReport']);
    Route::get('/admin/trends', [AdminController::class, 'trendAnalysis']);
    Route::get('/admin/profit-margins', [AdminController::class, 'profitMargins']);

    // ⚙️ System Settings
    Route::get('/admin/settings', [SettingsController::class, 'index']);
    Route::post('/admin/settings', [SettingsController::class, 'update']);
    Route::put('/admin/settings', [SettingsController::class, 'update']);

    // 👤 User Management
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::get('/roles', [UserController::class, 'roles']);

    // 🍽️ Menu Management
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/products/{id}/ingredients', [ProductIngredientController::class, 'attach']);
    Route::post('/categories', [CategoryController::class, 'store']);

    // 🥦 Stock & Inventory Management
    Route::get('/ingredients', [IngredientController::class, 'index']);
    Route::post('/ingredients', [IngredientController::class, 'store']);
    Route::put('/ingredients/{id}', [IngredientController::class, 'update']);
    Route::delete('/ingredients/{id}', [IngredientController::class, 'destroy']);
    Route::get('/admin/low-stock', [StockController::class, 'lowStock']);
    Route::get('/stock-movements', [StockController::class, 'movements']);

    // 💰 Payments & Transactions
    Route::get('/payments', [PaymentController::class, 'index']);
});

// ──────────────────────────────────────────────
// 👑🧑‍💼 Admin + Manager
// ──────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'runtime.settings', 'maintenance.mode', 'session.timeout', 'role:admin,manager'])->group(function () {
    // Product management
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/products/{id}/ingredients', [ProductIngredientController::class, 'attach']);

    // Category management
    Route::post('/categories', [CategoryController::class, 'store']);

    // Ingredient management
    Route::get('/ingredients', [IngredientController::class, 'index']);
    Route::post('/ingredients', [IngredientController::class, 'store']);
    Route::put('/ingredients/{id}', [IngredientController::class, 'update']);

    // Stock
    Route::get('/admin/low-stock', [StockController::class, 'lowStock']);
    Route::get('/stock-movements', [StockController::class, 'movements']);

    // 🍽️ Orders Management (Admin + Manager)
    Route::post('/orders', [OrderController::class, 'store']); // Create orders
    Route::put('/orders/{id}', [OrderController::class, 'update']); // Edit orders
    Route::delete('/orders/{id}', [OrderController::class, 'destroy']); // Delete orders
    Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']); // Update order status
});

// ──────────────────────────────────────────────
// 🍽️ Serveur routes
// ──────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'runtime.settings', 'maintenance.mode', 'session.timeout', 'role:serveur'])->group(function () {
    Route::post('/orders', [OrderController::class, 'store']);
});

// ──────────────────────────────────────────────
// 💰 Payments (Admin + Manager + Caissier)
// ──────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'runtime.settings', 'maintenance.mode', 'session.timeout'])->group(function () {
    Route::get('/payments', [PaymentController::class, 'index'])->middleware('role:admin,manager,caissier');
    Route::post('/payments', [PaymentController::class, 'store'])->middleware('role:admin,manager,caissier');
});

// ──────────────────────────────────────────────
// 👨‍🍳 Cuisine routes
// ──────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'runtime.settings', 'maintenance.mode', 'session.timeout', 'role:cuisine'])->group(function () {
    // Kitchen can view orders (already available in authenticated routes)
});
