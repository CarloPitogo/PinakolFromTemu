<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Services\CourseService;
use App\Http\Resources\CourseResource;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

use Illuminate\Http\Request;

class CourseController extends Controller
{
    use AuthorizesRequests;

    protected CourseService $courseService;

    public function __construct(CourseService $courseService)
    {
        $this->courseService = $courseService;
    }

    public function index()
    {
        $this->authorize('viewAny', Course::class);
        return CourseResource::collection($this->courseService->getAllCourses());
    }

    public function store(Request $request)
    {
        $this->authorize('create', Course::class);

        $validated = $request->validate([
            'code' => 'required|string|unique:courses,code',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'units' => 'required|integer|min:1',
            'program' => 'required|string|in:Bachelor of Science in Computer Science,Bachelor of Science in Information Technology',
            'year_level' => 'required|integer|min:1|max:4',
            'semester' => 'required|string|in:1st Semester,2nd Semester',
        ]);

        $course = $this->courseService->createCourse($validated);
        return new CourseResource($course);
    }

    public function update(Request $request, Course $course)
    {
        $this->authorize('update', $course);

        $validated = $request->validate([
            'code' => 'required|string|unique:courses,code,' . $course->id,
            'name' => 'required|string',
            'description' => 'nullable|string',
            'units' => 'required|integer|min:1',
            'program' => 'required|string|in:Bachelor of Science in Computer Science,Bachelor of Science in Information Technology',
            'year_level' => 'required|integer|min:1|max:4',
            'semester' => 'required|string|in:1st Semester,2nd Semester',
        ]);

        $updatedCourse = $this->courseService->updateCourse($course, $validated);
        return new CourseResource($updatedCourse);
    }

    public function toggleStatus(Course $course)
    {
        $this->authorize('update', $course);
        $updatedCourse = $this->courseService->toggleCourseStatus($course);
        return new CourseResource($updatedCourse);
    }
}
