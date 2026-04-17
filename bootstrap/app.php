<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;


return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
    $middleware->api(append: [
        \Illuminate\Http\Middleware\HandleCors::class,
        \App\Http\Middleware\SetLocale::class,
    ]);

    $middleware->alias([
        'role' => \App\Http\Middleware\RoleMiddleware::class,
        'runtime.settings' => \App\Http\Middleware\RuntimeSettingsMiddleware::class,
        'maintenance.mode' => \App\Http\Middleware\MaintenanceModeMiddleware::class,
        'session.timeout' => \App\Http\Middleware\SessionTimeoutMiddleware::class,
    ]);
})
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
