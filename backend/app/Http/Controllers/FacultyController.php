<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Faculty;
use App\Services\FacultyService;
use App\Http\Resources\FacultyResource;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class FacultyController extends Controller
{
    use AuthorizesRequests;

    protected FacultyService $facultyService;

    public function __construct(FacultyService $facultyService)
    {
        $this->facultyService = $facultyService;
    }

    public function index()
    {
        $this->authorize('viewAny', Faculty::class);
        $faculties = $this->facultyService->getAllFaculty();
        return FacultyResource::collection($faculties);
    }

    public function show(string $id)
    {
        $faculty = $this->facultyService->getFacultyById($id);
        $this->authorize('view', $faculty);
        return new FacultyResource($faculty);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Faculty::class);
        $validated = $request->validate([
            'firstName' => 'required|string|max:255',
            'lastName' => 'required|string|max:255',
            'email' => 'required|email|unique:faculties,email',
            'employeeNumber' => 'required|string|unique:faculties,employee_number',
            'department' => 'required|string|max:255',
            'position' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'status' => 'required|string|in:Active,Inactive',
            'specialization' => 'nullable|array',
        ]);

        // Map camelCase to snake_case for DB
        $dbData = [
            'first_name' => $validated['firstName'],
            'last_name' => $validated['lastName'],
            'email' => $validated['email'],
            'employee_number' => $validated['employeeNumber'],
            'department' => $validated['department'],
            'position' => $validated['position'],
            'phone' => $validated['phone'] ?? 'N/A',
            'status' => $validated['status'],
            'specialization' => $validated['specialization'] ?? [],
        ];

        $faculty = $this->facultyService->createFaculty($dbData);
        return new FacultyResource($faculty);
    }

    public function update(Request $request, string $id)
    {
        $faculty = $this->facultyService->getFacultyById($id);
        $this->authorize('update', $faculty);

        $validated = $request->validate([
            'firstName' => 'required|string|max:255',
            'lastName' => 'required|string|max:255',
            'email' => 'required|email|unique:faculties,email,' . $id,
            'employeeNumber' => 'required|string|unique:faculties,employee_number,' . $id,
            'department' => 'required|string|max:255',
            'position' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'status' => 'required|string|in:Active,Inactive',
            'specialization' => 'nullable|array',
        ]);

        $dbData = [
            'first_name' => $validated['firstName'],
            'last_name' => $validated['lastName'],
            'email' => $validated['email'],
            'employee_number' => $validated['employeeNumber'],
            'department' => $validated['department'],
            'position' => $validated['position'],
            'phone' => $validated['phone'] ?? 'N/A',
            'status' => $validated['status'],
            'specialization' => $validated['specialization'] ?? [],
        ];

        $faculty = $this->facultyService->updateFaculty($id, $dbData);
        return new FacultyResource($faculty);
    }

    public function destroy(string $id)
    {
        $faculty = $this->facultyService->getFacultyById($id);
        $this->authorize('delete', $faculty);
        $this->facultyService->deleteFaculty($id);
        return response()->json(['message' => 'Faculty deleted successfully']);
    }

    public function getMyClasses(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'faculty') return response()->json(['message' => 'Unauthorized'], 403);
        
        $faculty = Faculty::where('email', $user->email)->first();
        if (!$faculty) return response()->json(['data' => []]);

        $schedules = \App\Models\Schedule::where('faculty_id', $faculty->id)->get();
        // Group by course_code + section
        $classesMap = [];
        foreach($schedules as $s) {
            $key = $s->course_code . '_' . $s->section;
            if(!isset($classesMap[$key])) {
                $course = \App\Models\Course::where('code', $s->course_code)->first();
                $studentCount = \App\Models\Student::where('section', $s->section)->count();
                $classesMap[$key] = [
                    'courseCode' => $s->course_code,
                    'courseName' => $course ? $course->name : $s->course_code,
                    'section' => $s->section,
                    'studentCount' => $studentCount,
                    'day' => $s->day,
                    'timeStart' => $s->time_start,
                    'room' => $s->room,
                ];
            } else {
                // Combine days/times if needed, but for simplicity we keep the first one found or append
            }
        }
        
        return response()->json(['data' => array_values($classesMap)]);
    }

    public function getClassStudents(Request $request, $course_code, $section)
    {
        $user = $request->user();
        if ($user->role !== 'faculty') return response()->json(['message' => 'Unauthorized'], 403);
        
        // Return students matching section
        $students = \App\Models\Student::where('section', $section)->get();
        return response()->json(['data' => $students]);
    }
}
