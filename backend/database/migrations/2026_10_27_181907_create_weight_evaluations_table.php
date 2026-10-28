<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weight_evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evaluator_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('criterion_id')->constrained('criteria')->cascadeOnDelete();
            $table->decimal('weight', 8, 4);
            $table->enum('status', ['draft', 'submitted', 'approved', 'rejected'])->default('submitted');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['evaluator_id', 'criterion_id']);
            $table->index(['criterion_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weight_evaluations');
    }
};
