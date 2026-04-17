<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Services\BackupService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('app:backup', function () {
    try {
        $backup = app(BackupService::class)->create();
        $this->info('Backup created: ' . $backup['file']);
    } catch (\RuntimeException $e) {
        $this->warn($e->getMessage());
    }
})->purpose('Create a JSON backup of the restaurant application data');

Schedule::command('app:backup')->dailyAt('01:00');
