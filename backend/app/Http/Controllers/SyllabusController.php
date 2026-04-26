<?php

namespace App\Http\Controllers;

use App\Models\Syllabus;
use App\Services\SyllabusService;
use App\Http\Resources\SyllabusResource;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

use Illuminate\Http\Request;
use App\Models\Faculty;

class SyllabusController extends Controller
{
    use AuthorizesRequests;

    protected SyllabusService $syllabusService;

    public function __construct(SyllabusService $syllabusService)
    {
        $this->syllabusService = $syllabusService;
    }

    public function index()
    {
        $this->authorize('viewAny', Syllabus::class);
        return SyllabusResource::collection($this->syllabusService->getAllSyllabi());
    }

    public function store(Request $request)
    {
        $this->authorize('create', Syllabus::class);

        $validated = $request->validate([
            'course_code' => 'required|string|unique:syllabi,course_code',
            'course_name' => 'required|string',
            'semester' => 'required|string',
            'description' => 'required|string',
            'objectives' => 'required|array',
            'topics' => 'required|array',
            'grading_system' => 'required|array',
        ]);

        $totalGrading = collect($validated['grading_system'])->sum('percentage');
        if (abs($totalGrading - 100) > 0.01) {
            return response()->json(['message' => 'Grading system percentages must exactly add up to 100%'], 422);
        }

        $user = $request->user();
        if ($user->role === 'faculty') {
            $faculty = Faculty::where('email', $user->email)->first();
            $validated['faculty_id'] = $faculty ? $faculty->id : '1';
        } else {
            $validated['faculty_id'] = '1';
        }

        $syllabus = $this->syllabusService->createSyllabus($validated);
        return new SyllabusResource($syllabus);
    }

    public function update(Request $request, Syllabus $syllabus)
    {
        $this->authorize('update', $syllabus);

        $validated = $request->validate([
            'course_code' => 'required|string|unique:syllabi,course_code,' . $syllabus->id,
            'course_name' => 'required|string',
            'semester' => 'required|string',
            'description' => 'required|string',
            'objectives' => 'required|array',
            'topics' => 'required|array',
            'grading_system' => 'required|array',
        ]);

        $totalGrading = collect($validated['grading_system'])->sum('percentage');
        if (abs($totalGrading - 100) > 0.01) {
            return response()->json(['message' => 'Grading system percentages must exactly add up to 100%'], 422);
        }

        $updatedSyllabus = $this->syllabusService->updateSyllabus($syllabus, $validated);
        return new SyllabusResource($updatedSyllabus);
    }
}
