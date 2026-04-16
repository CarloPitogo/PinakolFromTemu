<?php

namespace App\Services;

use App\Models\Schedule;

class ScheduleService
{
    public function getAllSchedules()
    {
        return Schedule::all();
    }

    public function createSchedule(array $data)
    {
        $day = $data['day'];
        $start = $this->to24Hours($data['time_start']);
        $end = $this->to24Hours($data['time_end']);
        $facultyId = $data['faculty_id'];
        $section = $data['section'];
        $room = $data['room'];

        // Normalize time in data for consistent storage
        $data['time_start'] = $start;
        $data['time_end'] = $end;

        // 1. Check Faculty overlap
        $facultyConflict = Schedule::where('faculty_id', $facultyId)
            ->where('day', $day)
            ->where(function ($query) use ($start, $end) {
                $query->where('time_start', '<', $end)
                      ->where('time_end', '>', $start);
            })
            ->first();

        if ($facultyConflict) {
            throw new \Exception("Schedule overlap for faculty: conflicts with {$facultyConflict->course_code} at {$facultyConflict->time_start}-{$facultyConflict->time_end}");
        }

        // 2. Check Room overlap
        $roomConflict = Schedule::where('room', $room)
            ->where('day', $day)
            ->where(function ($query) use ($start, $end) {
                $query->where('time_start', '<', $end)
                      ->where('time_end', '>', $start);
            })
            ->first();

        if ($roomConflict) {
            throw new \Exception("Room overlap: {$room} is occupied by {$roomConflict->course_code} at {$roomConflict->time_start}-{$roomConflict->time_end}");
        }

        // 3. Check Section overlap (a class section can't be in two places at once)
        $sectionConflict = Schedule::where('section', $section)
            ->where('day', $day)
            ->where(function ($query) use ($start, $end) {
                $query->where('time_start', '<', $end)
                      ->where('time_end', '>', $start);
            })
            ->first();

        if ($sectionConflict) {
            throw new \Exception("Section overlap: {$section} has another class {$sectionConflict->course_code} at {$sectionConflict->time_start}-{$sectionConflict->time_end}");
        }

        return Schedule::create($data);
    }

    private function to24Hours($time)
    {
        return date("H:i", strtotime($time));
    }
}
