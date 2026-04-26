import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Syllabus, Course, Topic, GradingCriteria } from '../types';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  syllabus: Syllabus | null;
  availableCourses: Course[];
  onSave: (data: Partial<Syllabus>) => void;
}

export function SyllabusModal({ isOpen, onClose, syllabus, availableCourses, onSave }: SyllabusModalProps) {
  const [courseCode, setCourseCode] = useState('');
  const [semester, setSemester] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState<string[]>(['']);
  const [topics, setTopics] = useState<(Topic & { rawOutcomes?: string })[]>([
    { week: 1, title: '', description: '', learningOutcomes: [] }
  ]);
  const [grading, setGrading] = useState<GradingCriteria[]>([
    { component: 'Midterm', percentage: 30 },
    { component: 'Finals', percentage: 30 },
    { component: 'Quizzes', percentage: 20 },
    { component: 'Projects', percentage: 20 }
  ]);

  useEffect(() => {
    if (syllabus) {
      setCourseCode(syllabus.courseCode);
      setSemester(syllabus.semester);
      setDescription(syllabus.description);
      setObjectives(syllabus.objectives.length ? syllabus.objectives : ['']);
      setTopics(syllabus.topics.length ? syllabus.topics : [{ week: 1, title: '', description: '', learningOutcomes: [] }]);
      setGrading(syllabus.gradingSystem.length ? syllabus.gradingSystem : []);
    } else {
      setCourseCode('');
      setSemester('');
      setDescription('');
      setObjectives(['']);
      setTopics([{ week: 1, title: '', description: '', learningOutcomes: [] }]);
      setGrading([
        { component: 'Midterm', percentage: 30 },
        { component: 'Finals', percentage: 30 },
        { component: 'Quizzes', percentage: 20 },
        { component: 'Projects', percentage: 20 }
      ]);
    }
  }, [syllabus, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalPercentage = grading.reduce((sum, item) => sum + item.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast.error(`Grading percentages must exactly equal 100%. Current total: ${totalPercentage}%`);
      return;
    }

    const filteredObjectives = objectives.filter(o => o.trim() !== '');
    if (filteredObjectives.length === 0) {
      toast.error('Please provide at least one learning objective.');
      return;
    }

    const selectedCourse = availableCourses.find(c => c.code === courseCode);
    
    // In edit mode we already have courseName set by the backend/syllabus object.
    const finalCourseName = selectedCourse ? selectedCourse.name : (syllabus ? syllabus.courseName : '');

    onSave({
      courseCode,
      courseName: finalCourseName,
      semester,
      description,
      objectives: filteredObjectives,
      topics: topics.map(({ rawOutcomes, ...t }) => t),
      gradingSystem: grading
    });
  };

  // Objectives handlers
  const handleObjectiveChange = (index: number, value: string) => {
    const newObjs = [...objectives];
    newObjs[index] = value;
    setObjectives(newObjs);
  };
  const addObjective = () => setObjectives([...objectives, '']);
  const removeObjective = (index: number) => setObjectives(objectives.filter((_, i) => i !== index));

  // Topics handlers
  const handleTopicChange = (index: number, field: keyof Topic, value: any) => {
    const newTopics = [...topics];
    newTopics[index] = { ...newTopics[index], [field]: value };
    setTopics(newTopics);
  };
  const handleOutcomesChange = (index: number, value: string) => {
    const newTopics = [...topics];
    newTopics[index] = {
      ...newTopics[index],
      rawOutcomes: value,
      learningOutcomes: value.split(',').map(s => s.trim()).filter(s => s !== '')
    };
    setTopics(newTopics);
  };
  const addTopic = () => setTopics([...topics, { week: topics.length + 1, title: '', description: '', learningOutcomes: [] }]);
  const removeTopic = (index: number) => setTopics(topics.filter((_, i) => i !== index));

  // Grading handlers
  const handleGradingChange = (index: number, field: keyof GradingCriteria, value: any) => {
    const newGrading = [...grading];
    if (field === 'percentage') {
       newGrading[index].percentage = parseFloat(value) || 0;
    } else {
       newGrading[index] = { ...newGrading[index], [field]: value };
    }
    setGrading(newGrading);
  };
  const addGrading = () => setGrading([...grading, { component: '', percentage: 0 }]);
  const removeGrading = (index: number) => setGrading(grading.filter((_, i) => i !== index));

  const semesterOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const opts = [
      `1st Semester ${currentYear - 1}-${currentYear}`,
      `2nd Semester ${currentYear - 1}-${currentYear}`,
      `1st Semester ${currentYear}-${currentYear + 1}`,
      `2nd Semester ${currentYear}-${currentYear + 1}`,
    ];
    // If editing and the saved semester is outside this range, preserve it in the dropdown
    if (syllabus?.semester && !opts.includes(syllabus.semester)) {
      opts.unshift(syllabus.semester);
    }
    return opts;
  }, [syllabus]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{syllabus ? 'Edit Syllabus' : 'Create Syllabus'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Course</Label>
              {syllabus ? (
                <Input value={`${syllabus.courseCode} - ${syllabus.courseName}`} disabled />
              ) : (
                <Select value={courseCode} onValueChange={setCourseCode} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.code} - {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={semester} onValueChange={setSemester} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Course Description</Label>
            <textarea 
              required
              className="flex min-h-[80px] w-full border border-input rounded-md bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detailed description of the course..."
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Learning Objectives</Label>
              <Button type="button" variant="outline" size="sm" onClick={addObjective} className="text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Objective
              </Button>
            </div>
            {objectives.map((obj, i) => (
              <div key={i} className="flex gap-2">
                <Input 
                  value={obj} 
                  onChange={e => handleObjectiveChange(i, e.target.value)} 
                  placeholder={`Objective ${i + 1}`} 
                  required
                />
                {objectives.length > 1 && (
                   <Button type="button" variant="outline" size="icon" onClick={() => removeObjective(i)} className="shrink-0 text-red-500 hover:text-red-600">
                     <Trash2 className="w-4 h-4" />
                   </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-t pt-4">
              <Label className="text-lg font-semibold">Course Topics</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTopic} className="text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Topic
              </Button>
            </div>
            {topics.map((topic, i) => (
              <div key={i} className="p-4 border rounded-lg bg-gray-50/50 space-y-3 relative">
                {topics.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeTopic(i)} className="absolute top-2 right-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <div className="grid grid-cols-4 gap-3 pr-8">
                   <div className="space-y-1 col-span-1">
                     <Label className="text-xs">Week</Label>
                     <Input type="number" required min="1" value={topic.week} onChange={e => handleTopicChange(i, 'week', parseInt(e.target.value))} />
                   </div>
                   <div className="space-y-1 col-span-3">
                     <Label className="text-xs">Title</Label>
                     <Input required value={topic.title} onChange={e => handleTopicChange(i, 'title', e.target.value)} />
                   </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input required value={topic.description} onChange={e => handleTopicChange(i, 'description', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Learning Outcomes (comma separated)</Label>
                  <Input 
                    value={topic.rawOutcomes !== undefined ? topic.rawOutcomes : topic.learningOutcomes.join(', ')} 
                    onChange={e => handleOutcomesChange(i, e.target.value)} 
                    placeholder="E.g. Identify variables, write loops"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-t pt-4">
              <Label className="text-lg font-semibold">Grading System</Label>
              <Button type="button" variant="outline" size="sm" onClick={addGrading} className="text-xs">
                <Plus className="w-3 h-3 mr-1" /> Add Component
              </Button>
            </div>
            {grading.map((grade, i) => (
              <div key={i} className="flex gap-2">
                <div className="flex-1">
                  <Input 
                    value={grade.component} 
                    onChange={e => handleGradingChange(i, 'component', e.target.value)} 
                    placeholder="Component Name (e.g. Quizzes)" 
                    required
                  />
                </div>
                <div className="w-32 relative">
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="100" 
                    value={grade.percentage} 
                    onChange={e => handleGradingChange(i, 'percentage', e.target.value)} 
                    required 
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-500">%</span>
                </div>
                {grading.length > 1 && (
                  <Button type="button" variant="outline" size="icon" onClick={() => removeGrading(i)} className="shrink-0 text-red-500 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <div className="flex justify-end text-sm font-semibold">
              Total: <span className={grading.reduce((sum, item) => sum + item.percentage, 0) === 100 ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                {grading.reduce((sum, item) => sum + item.percentage, 0).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-[#FF7F11] hover:bg-orange-600">Save Syllabus</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
