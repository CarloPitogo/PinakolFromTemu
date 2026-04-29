<?php

namespace App\Services;

use App\Models\Syllabus;

class SyllabusService
{
    public function getAllSyllabi()
    {
        return Syllabus::all();
    }

    public function createSyllabus(array $data)
    {
        return Syllabus::create($data);
    }

    public function updateSyllabus(Syllabus $syllabus, array $data)
    {
        $syllabus->update($data);
        return $syllabus;
    }
}
