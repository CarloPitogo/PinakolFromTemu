<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = 'superadmin@ccs.edu';
$password = 'admin456';

$user = User::where('email', $email)->first();

if ($user) {
    $user->password = $password;
    $user->save();
    echo "Existing admin updated.\n";
} else {
    User::create([
        'name' => 'Super Administrator',
        'email' => $email,
        'password' => $password,
        'role' => 'admin'
    ]);
    echo "New admin created: $email / $password\n";
}
