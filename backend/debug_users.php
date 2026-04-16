<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$users = \App\Models\User::all();
foreach ($users as $u) {
    echo "EMAIL: '{$u->email}' | ROLE: '{$u->role}'\n";
}
