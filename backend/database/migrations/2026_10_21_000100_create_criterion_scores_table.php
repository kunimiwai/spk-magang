<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('criterion_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('partner_id')
                ->constrained('partners')
                ->cascadeOnDelete();
            $table->foreignId('criterion_id')
                ->constrained('criteria')
                ->restrictOnDelete();
            $table->decimal('score', 12, 6);
            $table->timestamps();

            $table->unique(['partner_id', 'criterion_id']);
            $table->index('criterion_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('criterion_scores');
    }
};
