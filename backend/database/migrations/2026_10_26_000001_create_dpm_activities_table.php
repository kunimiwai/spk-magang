<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dpm_activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dpm_placement_id')
                ->constrained('dpm_placements')
                ->cascadeOnDelete();
            $table->foreignId('dpm_id')
                ->constrained('users')
                ->cascadeOnDelete();
            $table->string('activity_type')->index();
            $table->text('description')->nullable();
            $table->timestamp('occurred_at')->useCurrent();
            $table->timestamps();

            $table->index(['dpm_id', 'occurred_at']);
            $table->index(['dpm_placement_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dpm_activities');
    }
};
