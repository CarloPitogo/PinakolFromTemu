<?php

namespace App\Http\Controllers;

use App\Models\Grade;
use App\Models\Student;
use App\Models\Faculty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GradeController extends Controller
{
    /**
     * Get grades for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if ($user->role === 'student') {
            $student = Student::where('email', $user->email)->first();
            if (!$student)
                return response()->json(['data' => []]);

            $grades = Grade::with(['faculty'])
                ->where('student_id', $student->id)
                ->get()
                ->map(function ($g) {
                    return [
                        'id' => $g->id,
                        'course_code' => $g->course_code,
                        'section' => $g->section,
                        'prelim' => $g->prelim,
                        'midterm' => $g->midterm,
                        'finals' => $g->finals,
                        'final_grade' => $g->final_grade,
                        'remarks' => $g->remarks,
                        'semester' => $g->semester,
                        'school_year' => $g->school_year,
                        'faculty_id' => $g->faculty_id,
                    ];
                });

            return response()->json(['data' => $grades]);
        }

        if ($user->role === 'faculty') {
            $faculty = Faculty::where('email', $user->email)->first();
            if (!$faculty)
                return response()->json(['data' => []]);

            $grades = Grade::with('student')
                ->where('faculty_id', $faculty->id)
                ->get();

            return response()->json(['data' => $grades]);
        }

        return response()->json(['data' => Grade::with(['student', 'faculty'])->get()]);
    }

    /**
     * Get grades for a specific class (section + course_code).
     */
    public function getClassGrades(Request $request)
    {
        $request->validate([
            'section' => 'required|string',
            'course_code' => 'required|string',
        ]);

        $user = Auth::user();
        if ($user->role !== 'faculty' && $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $grades = Grade::with('student')
            ->where('section', $request->section)
            ->where('course_code', $request->course_code)
            ->when($request->semester, function($q) use ($request) {
                return $q->where('semester', $request->semester);
            })
            ->when($request->school_year, function($q) use ($request) {
                return $q->where('school_year', $request->school_year);
            })
            ->get();

        return response()->json(['data' => $grades]);
    }

    private function parseTerm($input, $defaultYear = '2026-2027') {
        $semester = $input;
        $schoolYear = $defaultYear;
        if (str_contains($input, ' AY ')) {
            $parts = explode(' AY ', $input);
            $semester = $parts[0];
            $schoolYear = $parts[1];
        }
        return [$semester, $schoolYear];
    }

    /**
     * Upsert (create or update) a single grade record.
     */
    public function upsert(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'course_code' => 'required|string|max:20',
            'section' => 'required|string|max:50',
            'prelim' => 'nullable|numeric',
            'midterm' => 'nullable|numeric',
            'finals' => 'nullable|numeric',
        ]);

        $user = Auth::user();
        $faculty = Faculty::where('email', $user->email)->first();
        if (!$faculty) return response()->json(['message' => 'Faculty only'], 403);

        $termInput = $request->semester ?? '1st Sem AY 2026-2027';
        
        $grade = Grade::where([
            'student_id' => $request->student_id,
            'course_code' => strtoupper($request->course_code),
            'section' => $request->section,
            'semester' => $termInput,
        ])->first();

        // Calculate grades logic...
        $prelim = $request->has('prelim') ? $request->prelim : ($grade ? $grade->prelim : null);
        $midterm = $request->has('midterm') ? $request->midterm : ($grade ? $grade->midterm : null);
        $finals = $request->has('finals') ? $request->finals : ($grade ? $grade->finals : null);
        
        $finalGrade = null; $remarks = null;
        $filled = collect([$prelim, $midterm, $finals])->filter(fn($v) => $v !== null);
        if ($filled->count() > 0) {
            $finalGrade = round($filled->count() === 3 
                ? ($prelim*0.3 + $midterm*0.3 + $finals*0.4) 
                : ($filled->sum() / $filled->count()), 2);
            if ($filled->count() === 3) $remarks = $finalGrade >= 75 ? 'PASSED' : 'FAILED';
        }

        $grade = Grade::updateOrCreate(
            [
                'student_id' => $request->student_id,
                'course_code' => strtoupper($request->course_code),
                'section' => $request->section,
                'semester' => $termInput,
            ],
            [
                'faculty_id' => $faculty->id,
                'prelim' => $prelim, 'midterm' => $midterm, 'finals' => $finals,
                'final_grade' => $finalGrade, 'remarks' => $remarks,
                'school_year' => $request->school_year ?? '2026-2027'
            ]
        );

        return response()->json(['data' => $grade->load('student')]);
    }

    /**
     * Bulk upsert grades.
     */
    public function bulkUpsert(Request $request)
    {
        $user = Auth::user();
        $faculty = Faculty::where('email', $user->email)->first();
        if (!$faculty) return response()->json(['message' => 'Faculty only'], 403);

        $termInput = $request->semester ?? '1st Sem AY 2026-2027';
        $saved = [];

        foreach ($request->grades as $item) {
            $courseCode = strtoupper($item['course_code']);
            
            $grade = Grade::where([
                'student_id' => $item['student_id'],
                'course_code' => $courseCode,
                'section' => $item['section'],
                'semester' => $termInput,
            ])->first();

            $prelim = array_key_exists('prelim', $item) ? $item['prelim'] : ($grade ? $grade->prelim : null);
            $midterm = array_key_exists('midterm', $item) ? $item['midterm'] : ($grade ? $grade->midterm : null);
            $finals = array_key_exists('finals', $item) ? $item['finals'] : ($grade ? $grade->finals : null);

            $filled = collect([$prelim, $midterm, $finals])->filter(fn($v) => $v !== null);
            $finalGrade = null; $remarks = null;
            if ($filled->count() > 0) {
                $finalGrade = round($filled->count() === 3 
                    ? ($prelim*0.3 + $midterm*0.3 + $finals*0.4) 
                    : ($filled->sum() / $filled->count()), 2);
                if ($filled->count() === 3) $remarks = $finalGrade >= 75 ? 'PASSED' : 'FAILED';
            }

            $saved[] = Grade::updateOrCreate(
                [
                    'student_id' => $item['student_id'],
                    'course_code' => $courseCode,
                    'section' => $item['section'],
                    'semester' => $termInput,
                ],
                [
                    'faculty_id' => $faculty->id,
                    'prelim' => $prelim, 'midterm' => $midterm, 'finals' => $finals,
                    'final_grade' => $finalGrade, 'remarks' => $remarks,
                    'school_year' => $request->school_year ?? '2026-2027'
                ]
            );
        }

        return response()->json(['data' => $saved, 'message' => 'Grades synced']);
    }
}
