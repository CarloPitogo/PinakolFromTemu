<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Test a few common passwords
$passwords = ['admin123', 'password123', 'password'];

$users = \App\Models\User::all();

foreach ($users as $user) {
    echo "User: {$user->email} (Role: {$user->role})\n";
    foreach ($passwords as $p) {
        $match = \Illuminate\Support\Facades\Hash::check($p, $user->password);
        if ($match) {
            echo "  [OK] Matches: $p\n";
        }
        
        // Check for double hashing
        $doubleMatch = \Illuminate\Support\Facades\Hash::check(\Illuminate\Support\Facades\Hash::make($p), $user->password);
        // Wait, Hash::make includes a salt, so double hashing check is different.
        // We'd need to know if the stored hash IS a hash of a hash.
    }
    echo "  Hash starts with: " . substr($user->password, 0, 10) . "...\n";
}
