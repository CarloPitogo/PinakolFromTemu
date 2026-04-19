<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

use App\Models\User;
use App\Models\Student;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$students = Student::all();
$users = User::where('role', 'student')->get();

echo "REGISTERED STUDENTS IN SYSTEM:\n";
echo "========================================================================\n";
echo str_pad("NAME", 25) . " | " . str_pad("EMAIL", 30) . " | " . "HAS LOGIN?\n";
echo "------------------------------------------------------------------------\n";
foreach ($students as $student) {
    $hasUser = User::where('email', $student->email)->exists();
    echo str_pad($student->first_name . " " . $student->last_name, 25) . " | " . 
         str_pad($student->email, 30) . " | " . 
         ($hasUser ? "YES (password: password123)" : "NO") . "\n";
}
echo "========================================================================\n";
echo "Total Students: " . $students->count() . "\n";
echo "Total Login Accounts: " . $users->count() . "\n";
