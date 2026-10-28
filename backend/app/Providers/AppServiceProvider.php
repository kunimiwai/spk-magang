<?php

namespace App\Providers;

use App\Models\DpmActivity;
use App\Models\DpmPlacement;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Route::model('dpm_placement', DpmPlacement::class);
        Route::model('dpm_activity', DpmActivity::class);
        Route::model('system_setting', SystemSetting::class);
    }
}
