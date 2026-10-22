<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_peminatan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('peminatan', 20);
            $table->timestamps();

            $table->unique(['user_id', 'peminatan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_peminatan');
    }
};
