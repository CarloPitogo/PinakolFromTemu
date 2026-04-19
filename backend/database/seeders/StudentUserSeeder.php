<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Student;
use Illuminate\Support\Facades\Hash;

class StudentUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $students = Student::all();

        foreach ($students as $student) {
            // Check if user already exists to avoid duplicates
            User::updateOrCreate(
                ['email' => strtolower($student->email)],
                [
                    'name' => "{$student->first_name} {$student->last_name}",
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'password' => 'password123', // Default password
                    'role' => 'student',
                ]
            );
        }
    }
}
