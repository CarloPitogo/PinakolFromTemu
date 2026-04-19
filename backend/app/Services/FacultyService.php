<?php

namespace App\Services;

use App\Models\Faculty;

class FacultyService
{
    /**
     * Get all faculty for the listing view.
     */
    public function getAllFaculty(array $filters = [])
    {
        $query = Faculty::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('first_name', 'LIKE', "%{$search}%")
                  ->orWhere('last_name', 'LIKE', "%{$search}%")
                  ->orWhere('department', 'LIKE', "%{$search}%")
                  ->orWhere('employee_number', 'LIKE', "%{$search}%");
            });
        }

        return $query->latest()->paginate($filters['perPage'] ?? 10);
    }

    /**
     * Get a single faculty by ID.
     */
    public function getFacultyById(string $id)
    {
        return Faculty::findOrFail($id);
    }

    /**
     * Create a new faculty member and their user account.
     */
    public function createFaculty(array $data)
    {
        return \DB::transaction(function () use ($data) {
            $faculty = Faculty::create($data);

            // Create user account
            \App\Models\User::updateOrCreate(
                ['email' => strtolower($faculty->email)],
                [
                    'name' => "{$faculty->first_name} {$faculty->last_name}",
                    'first_name' => $faculty->first_name,
                    'last_name' => $faculty->last_name,
                    'password' => 'password123',
                    'role' => 'faculty',
                ]
            );

            return $faculty;
        });
    }

    /**
     * Update a faculty member and their user account.
     */
    public function updateFaculty(string $id, array $data)
    {
        return \DB::transaction(function () use ($id, $data) {
            $faculty = Faculty::findOrFail($id);
            $oldEmail = $faculty->email;
            $faculty->update($data);

            // Update user account
            $user = \App\Models\User::where('email', $oldEmail)->first();
            if ($user) {
                $user->update([
                    'name' => "{$faculty->first_name} {$faculty->last_name}",
                    'first_name' => $faculty->first_name,
                    'last_name' => $faculty->last_name,
                    'email' => strtolower($faculty->email),
                ]);
            }

            return $faculty;
        });
    }

    /**
     * Delete a faculty member and their user account.
     */
    public function deleteFaculty(string $id)
    {
        return \DB::transaction(function () use ($id) {
            $faculty = Faculty::findOrFail($id);
            $email = $faculty->email;
            
            // Delete user account first
            \App\Models\User::where('email', $email)->delete();
            
            return $faculty->delete();
        });
    }
}
