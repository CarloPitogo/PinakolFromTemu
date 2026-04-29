import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Course } from '../types';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
  onSave: (data: Partial<Course>) => void;
}

export function CourseModal({ isOpen, onClose, course, onSave }: CourseModalProps) {
  const [formData, setFormData] = useState<Partial<Course>>({
    code: '',
    name: '',
    description: '',
    units: 3,
    program: '',
    yearLevel: 1,
    semester: '',
  });

  useEffect(() => {
    if (course) {
      setFormData(course);
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        units: 3,
        program: '',
        yearLevel: 1,
        semester: '',
      });
    }
  }, [course, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{course ? 'Edit Course' : 'Add Course'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Course Code</Label>
              <Input
                id="code"
                required
                value={formData.code || ''}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. CS101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="units">Units</Label>
              <Input
                id="units"
                type="number"
                min="1"
                required
                value={formData.units || 1}
                onChange={e => setFormData({ ...formData, units: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Course Name</Label>
            <Input
              id="name"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Introduction to Programming"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Course description..."
            />
          </div>

          <div className="space-y-2">
            <Label>Program</Label>
            <Select 
              value={formData.program || ''} 
              onValueChange={v => setFormData({ ...formData, program: v })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bachelor of Science in Computer Science">Bachelor of Science in Computer Science</SelectItem>
                <SelectItem value="Bachelor of Science in Information Technology">Bachelor of Science in Information Technology</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Year Level</Label>
              <Select 
                value={formData.yearLevel?.toString() || ''} 
                onValueChange={v => setFormData({ ...formData, yearLevel: parseInt(v) })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1st Year</SelectItem>
                  <SelectItem value="2">2nd Year</SelectItem>
                  <SelectItem value="3">3rd Year</SelectItem>
                  <SelectItem value="4">4th Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select 
                value={formData.semester || ''} 
                onValueChange={v => setFormData({ ...formData, semester: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Semester">1st Semester</SelectItem>
                  <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-[#FF7F11] hover:bg-orange-600">Save Course</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
