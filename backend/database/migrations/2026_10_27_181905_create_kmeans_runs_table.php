<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kmeans_runs', function (Blueprint $table) {
            $table->id();
            $table->integer('cluster_count');
            $table->integer('random_seed');
            $table->integer('iteration_count')->nullable();
            $table->double('inertia')->nullable();
            $table->boolean('converged')->nullable();
            $table->json('feature_criterion_ids')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('ran_at')->nullable();
            $table->timestamps();

            $table->index(['ran_at']);
        });

        Schema::create('kmeans_run_partners', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kmeans_run_id')->constrained('kmeans_runs')->cascadeOnDelete();
            $table->foreignId('partner_id')->constrained('partners')->cascadeOnDelete();
            $table->integer('cluster_label');
            $table->timestamps();

            $table->unique(['kmeans_run_id', 'partner_id']);
            $table->index(['cluster_label']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kmeans_run_partners');
        Schema::dropIfExists('kmeans_runs');
    }
};
