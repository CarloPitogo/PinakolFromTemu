<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = 'admin@ccs.edu';
$password = 'admin123';

$user = User::where('email', $email)->first();

if ($user) {
    echo "User found: " . $user->name . "\n";
    echo "Role: " . $user->role . "\n";
    if (Hash::check($password, $user->password)) {
        echo "Password matches!\n";
    } else {
        echo "Password DOES NOT match!\n";
    }
} else {
    echo "User NOT found.\n";
    
    // Create it if missing
    User::create([
        'name' => 'CCS Administrator',
        'email' => $email,
        'password' => $password,
        'role' => 'admin'
    ]);
    echo "User created now.\n";
}
