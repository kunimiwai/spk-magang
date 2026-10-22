<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dpm_placements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_application_id')
                ->unique()
                ->constrained('internship_applications')
                ->cascadeOnDelete();
            $table->foreignId('dpm_id')
                ->constrained('users')
                ->restrictOnDelete();
            $table->foreignId('assigned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('assigned_at');
            $table->timestamps();

            $table->index('dpm_id');
            $table->index('assigned_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dpm_placements');
    }
};
