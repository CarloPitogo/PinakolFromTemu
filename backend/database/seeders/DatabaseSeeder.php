<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'CCS Administrator',
            'email' => 'admin@ccs.edu',
            'password' => 'admin123',
            'role' => 'admin',
        ]);

        $this->call([
            StudentSeeder::class ,
            FacultySeeder::class ,
            FacultyUserSeeder::class ,
            StudentUserSeeder::class ,
            CourseSeeder::class ,
            SyllabusSeeder::class ,
            ScheduleSeeder::class ,
            EventSeeder::class ,
            AnnouncementSeeder::class ,
            MassStudentSeeder::class ,
        ]);
    }
}
