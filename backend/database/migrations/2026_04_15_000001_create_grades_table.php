<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('student_id')->index();
            $table->unsignedBigInteger('faculty_id')->index();
            $table->string('course_code');
            $table->string('section');
            $table->decimal('prelim', 5, 2)->nullable();
            $table->decimal('midterm', 5, 2)->nullable();
            $table->decimal('finals', 5, 2)->nullable();
            $table->decimal('final_grade', 5, 2)->nullable();
            $table->string('remarks')->nullable();
            $table->string('semester')->default('1st Semester');
            $table->string('school_year')->default('2026-2027');
            $table->timestamps();

            $table->unique(['student_id', 'course_code', 'section', 'semester', 'school_year'], 'grades_unique_enrollment');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
