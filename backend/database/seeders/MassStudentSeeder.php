<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Student;
use App\Models\StudentAcademicHistory;
use App\Models\StudentSportsSkill;

class MassStudentSeeder extends Seeder
{
    /**
     * Run the database seeds to reach 1,000 students for performance testing.
     */
    public function run(): void
    {
        $currentCount = Student::count();
        $targetCount = 1000;
        $toGenerate = $targetCount - $currentCount;

        if ($toGenerate <= 0) {
            $this->command->info("System already has {$currentCount} students. Skipping mass seed.");
            return;
        }

        $this->command->info("Seeding {$toGenerate} more students to reach target of 1,000...");

        // Chunking the creation to handle memory efficiently
        $chunkSize = 100;
        for ($i = 0; $i < $toGenerate; $i += $chunkSize) {
            $count = min($chunkSize, $toGenerate - $i);
            
            Student::factory()
                ->count($count)
                ->create()
                ->each(function ($student) {
                    // Seed Academic History
                    StudentAcademicHistory::create([
                        'student_id' => $student->id,
                        'semester' => '1st Semester 2026-2027',
                        'semester_gpa' => $student->gpa,
                        'courses' => [
                            ['courseCode' => 'CS101', 'courseName' => 'Intro to Programming', 'units' => 3, 'grade' => 1.5, 'remarks' => 'Passed'],
                            ['courseCode' => 'CS102', 'courseName' => 'Computing Fundamentals', 'units' => 3, 'grade' => 1.75, 'remarks' => 'Passed'],
                        ]
                    ]);

                    // Seed random Sports Skills
                    if (rand(1, 10) > 4) { // 60% chance to have a sport
                        $sports = ['Basketball', 'Volleyball', 'Football', 'Badminton', 'Chess', 'Swimming', 'Table Tennis'];
                        StudentSportsSkill::create([
                            'student_id' => $student->id,
                            'sport' => $sports[array_rand($sports)],
                            'level' => rand(1, 10) > 8 ? 'Varsity' : 'Advanced',
                            'height' => rand(160, 200),
                            'weight' => rand(55, 95),
                            'position' => null
                        ]);
                    }
                });
            
            $this->command->info("Progress: " . ($i + $count) . "/{$toGenerate} records created.");
        }

        $this->command->info("Registering login accounts for new students...");
        $userSeeder = new StudentUserSeeder();
        $userSeeder->run();

        $this->command->info("SUCCESS: Database now contains " . Student::count() . " students.");
    }
}
