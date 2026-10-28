<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('application_communications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('internship_application_id')
                ->constrained('internship_applications')
                ->cascadeOnDelete();
            $table->string('direction', 20);
            $table->string('channel', 20);
            $table->timestamp('occurred_at');
            $table->text('summary');
            $table->foreignId('recorded_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamps();

            $table->index(
                ['internship_application_id', 'occurred_at'],
                'application_communications_application_occurred_index',
            );
            $table->index('recorded_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_communications');
    }
};
