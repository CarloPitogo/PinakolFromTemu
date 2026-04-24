<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Faculty;
use App\Models\Schedule;

class DashboardController extends Controller
{
    public function getStats()
    {
        $studentsCount = Student::count();
        $facultyCount = Faculty::count();
        $sectionsCount = Schedule::distinct('section')->count('section');
        $averageGpa = Student::avg('gpa') ?? 0;

        return response()->json([
            'students' => $studentsCount,
            'faculty' => $facultyCount,
            'sections' => $sectionsCount,
            'avg_gpa' => round((float)$averageGpa, 2),
        ]);
    }
}
