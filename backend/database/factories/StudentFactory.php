<?php

namespace Database\Factories;

use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Student>
 */
class StudentFactory extends Factory
{
    protected $model = Student::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $programs = [
            'Bachelor of Science in Computer Science',
            'Bachelor of Science in Information Technology'
        ];

        $technicalSkills = ['React', 'PHP', 'Laravel', 'Python', 'Java', 'SQL', 'Git', 'Docker', 'AWS', 'JavaScript', 'TypeScript', 'TailwindCSS', 'Node.js', 'C++', 'C#'];
        $otherSkills = ['Communication', 'Leadership', 'Critical Thinking', 'Project Management', 'Public Speaking', 'Analytical Writing'];

        $firstName = $this->faker->firstName();
        $lastName = $this->faker->lastName();

        return [
            'first_name' => $firstName,
            'last_name' => $lastName,
            'student_number' => '2026-' . $this->faker->unique()->numberBetween(10000, 99999),
            'email' => strtolower($firstName . '.' . $lastName . $this->faker->numberBetween(1, 999)) . '@student.edu',
            'phone' => '+63 9' . $this->faker->numberBetween(10, 99) . ' ' . $this->faker->numberBetween(100, 999) . ' ' . $this->faker->numberBetween(1000, 9999),
            'date_of_birth' => $this->faker->dateTimeBetween('-25 years', '-18 years')->format('Y-m-d'),
            'gender' => $this->faker->randomElement(['Male', 'Female']),
            'address' => $this->faker->address(),
            'enrollment_date' => $this->faker->dateTimeBetween('-3 years', 'now')->format('Y-m-d'),
            'program' => $this->faker->randomElement($programs),
            'year_level' => $this->faker->numberBetween(1, 4),
            'status' => $this->faker->randomElement(['Active', 'Active', 'Active', 'Inactive', 'Suspended']), // Weighted towards Active
            'gpa' => $this->faker->randomFloat(2, 1.5, 4.0),
            'classification' => 'Regular',
            'technical_skills' => $this->faker->randomElements($technicalSkills, rand(3, 6)),
            'other_skills' => $this->faker->randomElements($otherSkills, rand(1, 3)),
        ];
    }
}
