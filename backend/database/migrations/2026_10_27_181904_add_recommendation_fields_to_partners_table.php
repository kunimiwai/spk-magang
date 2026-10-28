<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->string('partner_type')->nullable()->after('name');
            $table->decimal('da_score', 8, 4)->nullable()->after('partner_type');
            $table->decimal('sd_score', 8, 4)->nullable()->after('da_score');
            $table->decimal('itg_score', 8, 4)->nullable()->after('sd_score');
            $table->decimal('distance_km', 10, 3)->nullable()->after('itg_score');
            $table->decimal('rating', 6, 2)->nullable()->after('distance_km');
            $table->enum('vacancy_status', ['open', 'closed', 'limited'])->nullable()->after('rating');
            $table->integer('quota')->nullable()->after('vacancy_status');
            $table->json('requirements')->nullable()->after('quota');
            $table->boolean('is_verified')->default(false)->after('requirements');
            $table->json('source_metadata')->nullable()->after('is_verified');
            $table->index(['is_verified', 'vacancy_status']);
        });
    }

    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->dropIndex(['is_verified', 'vacancy_status']);
            $table->dropColumn([
                'partner_type',
                'da_score',
                'sd_score',
                'itg_score',
                'distance_km',
                'rating',
                'vacancy_status',
                'quota',
                'requirements',
                'is_verified',
                'source_metadata',
            ]);
        });
    }
};
