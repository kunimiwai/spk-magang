<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recommendation_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('kmeans_run_id')->nullable()->constrained('kmeans_runs')->nullOnDelete();
            $table->json('peminatan')->nullable();
            $table->json('weights')->nullable();
            $table->json('ranking')->nullable();
            $table->json('metadata')->nullable();
            $table->string('status')->default('ready');
            $table->timestamp('calculated_at');
            $table->timestamps();

            $table->index(['user_id', 'calculated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recommendation_histories');
    }
};
