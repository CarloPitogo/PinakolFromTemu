<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Faculty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Auto-close overdue tasks
        Task::where('status', 'Open')
            ->where('due_date', '<', now())
            ->update(['status' => 'Closed']);

        $user = Auth::user();

        // Faculty and Admin see all tasks
        if ($user->role === 'faculty' || $user->role === 'admin') {
            $tasks = Task::with('faculty')->latest()->get();
            return response()->json(['data' => $tasks]);
        }

        // Students only see tasks for their enrolled section
        $student = \App\Models\Student::where('email', $user->email)->first();

        // If no student record, or not enrolled (no section), return empty
        if (!$student || empty($student->section) || empty($student->enrollment_date)) {
            return response()->json(['data' => []]);
        }

        $tasks = Task::with('faculty')
            ->where('section', $student->section)
            ->latest()
            ->get();

        return response()->json(['data' => $tasks]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|min:3|max:255',
            'description' => 'required|string|min:5|max:5000',
            'section' => 'required|string|max:50',
            'courseCode' => 'required|string|max:50',
            'due_date' => 'required|date|after_or_equal:today',
            'type' => 'required|string|in:assignment,quiz,exam,post',
        ]);

        $user = Auth::user();
        if ($user->role !== 'faculty') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $faculty = Faculty::where('email', $user->email)->first();
        if (!$faculty) {
            return response()->json(['message' => 'Faculty record not found'], 404);
        }

        $task = Task::create([
            'faculty_id' => $faculty->id,
            'title' => $request->title,
            'description' => $request->description,
            'section' => $request->section,
            'course_code' => $request->courseCode,
            'due_date' => date('Y-m-d H:i:s', strtotime($request->due_date)),
            'status' => 'Open',
            'type' => $request->type,
        ]);

        return response()->json(['data' => $task, 'message' => 'Task created successfully']);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Task $task)
    {
        $request->validate([
            'status' => 'required|in:Open,Closed',
        ]);

        $task->update($request->only('status'));

        return response()->json(['data' => $task, 'message' => 'Task status updated']);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Task $task)
    {
        $task->delete();
        return response()->json(['message' => 'Task deleted']);
    }
}
