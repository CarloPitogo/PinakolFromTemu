<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Reset everyone's password using the Model so casts are applied properly
// Since the model has 'password' => 'hashed', we just pass the RAW string.

$passwords = [
    'admin@ccs.edu' => 'admin123',
    'robert.garcia@faculty.edu' => 'password123',
    'anna.mendoza@faculty.edu' => 'password123',
    'james.sy@faculty.edu' => 'password123',
    'OwaB@ccs.edu' => 'password123',
];

foreach ($passwords as $email => $pass) {
    $user = \App\Models\User::where('email', $email)->first();
    if ($user) {
        // We set the raw password, and the model cast 'hashed' handles the rest.
        $user->password = $pass;
        $user->save();
        echo "[DONE] Reset $email to $pass\n";
    } else {
        echo "[SKIP] User $email not found\n";
    }
}
