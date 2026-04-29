<?php

namespace App\Services;

use App\Models\Course;

class CourseService
{
    public function getAllCourses()
    {
        return Course::all();
    }

    public function createCourse(array $data)
    {
        return Course::create($data);
    }

    public function updateCourse(Course $course, array $data)
    {
        $course->update($data);
        return $course;
    }

    public function toggleCourseStatus(Course $course)
    {
        $course->is_active = !$course->is_active;
        $course->save();
        return $course;
    }
}
