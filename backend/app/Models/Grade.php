<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Grade extends Model
{
    protected $fillable = [
        'student_id',
        'faculty_id',
        'course_code',
        'section',
        'prelim',
        'midterm',
        'finals',
        'final_grade',
        'remarks',
        'semester',
        'school_year',
    ];

    protected $casts = [
        'prelim'      => 'float',
        'midterm'     => 'float',
        'finals'      => 'float',
        'final_grade' => 'float',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function faculty(): BelongsTo
    {
        return $this->belongsTo(Faculty::class);
    }
}
