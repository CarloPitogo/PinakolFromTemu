<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Student;
use App\Models\User;
use App\Models\StudentAcademicHistory;
use App\Models\StudentSportsSkill;
use Illuminate\Support\Facades\Hash;

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

        // Hash the default password ONCE instead of 1000 times
        $hashedPassword = Hash::make('password123');
        $now = now();

        // Chunking the creation to handle memory efficiently
        $chunkSize = 100;
        for ($i = 0; $i < $toGenerate; $i += $chunkSize) {
            $count = min($chunkSize, $toGenerate - $i);
            
            $students = Student::factory()
                ->count($count)
                ->create();

            // Bulk-build user accounts for this chunk
            $userRecords = [];
            foreach ($students as $student) {
                // Academic History
                StudentAcademicHistory::create([
                    'student_id' => $student->id,
                    'semester' => '1st Semester 2026-2027',
                    'semester_gpa' => $student->gpa,
                    'courses' => [
                        ['courseCode' => 'CS101', 'courseName' => 'Intro to Programming', 'units' => 3, 'grade' => 1.5, 'remarks' => 'Passed'],
                        ['courseCode' => 'CS102', 'courseName' => 'Computing Fundamentals', 'units' => 3, 'grade' => 1.75, 'remarks' => 'Passed'],
                    ]
                ]);

                // Sports Skills (60% chance)
                if (rand(1, 10) > 4) {
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

                // Collect user record for bulk upsert
                $userRecords[] = [
                    'email' => strtolower($student->email),
                    'name' => "{$student->first_name} {$student->last_name}",
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'password' => $hashedPassword,
                    'role' => 'student',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Single bulk upsert per chunk instead of 1 query per student
            User::upsert($userRecords, ['email'], ['name', 'first_name', 'last_name', 'password', 'role', 'updated_at']);
            
            $this->command->info("Progress: " . ($i + $count) . "/{$toGenerate} students + accounts created.");
        }

        $this->command->info("SUCCESS: Database now contains " . Student::count() . " students.");
    }
}
