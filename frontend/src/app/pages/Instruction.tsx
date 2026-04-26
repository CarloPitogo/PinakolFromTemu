import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BookOpen, FileText, Target, Plus, Pencil, PowerOff, Power } from 'lucide-react';
import { fetchWithAuth, useAuth } from '../context/AuthContext';
import { Course, Syllabus, Faculty } from '../types';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { CourseModal } from '../components/CourseModal';
import { SyllabusModal } from '../components/SyllabusModal';

export function Instruction() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cRes, sRes, fRes] = await Promise.all([
          fetchWithAuth('/courses'),
          fetchWithAuth('/syllabi'),
          fetchWithAuth('/faculty')
        ]);
        const cData = cRes.ok ? await cRes.json() : { data: [] };
        const sData = sRes.ok ? await sRes.json() : { data: [] };
        const fData = fRes.ok ? await fRes.json() : { data: [] };

        setCourses(cData.data || []);
        setSyllabi(sData.data || []);
        setFacultyList(fData.data || []);
      } catch (error) {
        console.error('Error fetching instruction data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSaveCourse = async (data: Partial<Course>) => {
    try {
      const isEditing = !!selectedCourse;
      const url = isEditing ? `/courses/${selectedCourse.id}` : '/courses';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...data,
        year_level: data.yearLevel,
      };

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save course');
      }

      const savedCourse = (await res.json()).data;

      if (isEditing) {
        setCourses(courses.map(c => c.id === savedCourse.id ? savedCourse : c));
        toast.success('Course updated successfully');
      } else {
        setCourses([...courses, savedCourse]);
        toast.success('Course created successfully');
      }
      setIsCourseModalOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggleCourseStatus = async (course: Course) => {
    try {
      const res = await fetchWithAuth(`/courses/${course.id}/toggle-status`, {
        method: 'PATCH'
      });

      if (!res.ok) throw new Error('Failed to toggle status');

      const updatedCourse = (await res.json()).data;
      setCourses(courses.map(c => c.id === updatedCourse.id ? updatedCourse : c));
      toast.success(`Course ${updatedCourse.isActive ? 'enabled' : 'disabled'} successfully`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSaveSyllabus = async (data: Partial<Syllabus>) => {
    try {
      const isEditing = !!selectedSyllabus;
      const url = isEditing ? `/syllabi/${selectedSyllabus.id}` : '/syllabi';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...data,
        course_code: data.courseCode,
        course_name: data.courseName,
        grading_system: data.gradingSystem,
      };

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save syllabus');
      }

      const savedSyllabus = (await res.json()).data;

      if (isEditing) {
        setSyllabi(syllabi.map(s => s.id === savedSyllabus.id ? savedSyllabus : s));
        toast.success('Syllabus updated successfully');
      } else {
        setSyllabi([...syllabi, savedSyllabus]);
        toast.success('Syllabus created successfully');
      }
      setIsSyllabusModalOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const bscsCourses = useMemo(() => courses.filter(c => c.program === 'Bachelor of Science in Computer Science'), [courses]);
  const bsitCourses = useMemo(() => courses.filter(c => c.program === 'Bachelor of Science in Information Technology'), [courses]);

  const calcProgramStats = (progCourses: Course[]) => {
    return {
      totalCourses: progCourses.length,
      totalUnits: progCourses.reduce((sum, c) => sum + c.units, 0),
    };
  };

  const availableCoursesForSyllabus = useMemo(() => {
    return courses.filter(c => !syllabi.some(s => s.courseCode === c.code));
  }, [courses, syllabi]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading Instruction Information...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF7F11] to-orange-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#FF7F11] tracking-tight">
              Instruction Management
            </h1>
            <p className="text-sm text-gray-500 font-medium font-sans mt-0.5">
              Curriculum, courses, and syllabi overview
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
            <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
             <TabsContent value="courses" className="m-0">
               {user?.role === 'admin' && (
                  <Button 
                    className="bg-[#FF7F11] hover:bg-orange-600 text-white"
                    onClick={() => { setSelectedCourse(null); setIsCourseModalOpen(true); }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Course
                  </Button>
               )}
             </TabsContent>
             <TabsContent value="syllabus" className="m-0">
               {(user?.role === 'admin' || user?.role === 'faculty') && (
                  <Button 
                    className="bg-[#FF7F11] hover:bg-orange-600 text-white"
                    onClick={() => { setSelectedSyllabus(null); setIsSyllabusModalOpen(true); }}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Create Syllabus
                  </Button>
               )}
             </TabsContent>
          </div>
        </div>

        {/* Courses */}
        <TabsContent value="courses" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {courses.length === 0 && (
              <div className="p-8 text-center text-gray-400 bg-white rounded-lg border">No courses found.</div>
            )}
            {courses.map((course) => (
              <Card key={course.id} className={`transition-all ${!course.isActive ? 'bg-gray-50 opacity-75' : ''}`}>
                <CardContent className="p-0 flex items-stretch">
                  {user?.role === 'admin' && (
                    <div className="w-16 bg-gray-50 border-r flex flex-col items-center justify-center gap-4 py-4 mr-4 rounded-l-lg hover:bg-gray-100 transition-colors">
                      <button 
                        onClick={() => { setSelectedCourse(course); setIsCourseModalOpen(true); }}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-full transition-all shadow-sm"
                        title="Edit Course"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleToggleCourseStatus(course)}
                        className={`p-2 rounded-full transition-all shadow-sm ${course.isActive ? 'text-red-500 hover:text-red-600 hover:bg-white' : 'text-green-500 hover:text-green-600 hover:bg-white'}`}
                        title={course.isActive ? "Disable Course" : "Enable Course"}
                      >
                        {course.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                    </div>
                  )}
                  <div className={`flex-1 py-6 pr-6 pl-2 ${user?.role !== 'admin' ? 'pl-6' : ''}`}>
                    <div className="flex items-center gap-3 mb-2">
                       <h3 className={`text-lg font-semibold ${!course.isActive ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                         {course.code} - {course.name}
                       </h3>
                       <Badge variant={course.isActive ? "default" : "secondary"}>{course.units} Units</Badge>
                       {!course.isActive && <Badge variant="destructive" className="text-[10px]">Disabled</Badge>}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{course.description}</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block mb-1">Program</span>
                        <p className="font-semibold text-gray-800">{course.program}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Year Level</span>
                        <p className="font-semibold text-gray-800">Year {course.yearLevel}</p>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1">Semester</span>
                        <p className="font-semibold text-gray-800">{course.semester}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Syllabus */}
        <TabsContent value="syllabus" className="space-y-4">
          {syllabi.length === 0 && (
            <div className="p-8 text-center text-gray-400 bg-white rounded-lg border">No syllabi found.</div>
          )}
          {syllabi.map((syllabus) => {
            return (
              <Card key={syllabus.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" />
                        {syllabus.courseCode} - {syllabus.courseName}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{syllabus.semester}</p>
                    </div>
                    <div className="flex items-center gap-3">
                       {syllabus.facultyName && (
                         <Badge variant="outline" className="bg-gray-50">
                           {syllabus.facultyName}
                         </Badge>
                       )}
                       {(user?.role === 'admin' || user?.role === 'faculty') && (
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           onClick={() => { setSelectedSyllabus(syllabus); setIsSyllabusModalOpen(true); }}
                           className="text-gray-500 hover:text-indigo-600"
                         >
                           <Pencil className="w-4 h-4" />
                         </Button>
                       )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Description */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Course Description</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{syllabus.description}</p>
                  </div>

                  {/* Objectives */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-500" />
                      Learning Objectives
                    </h4>
                    <ul className="list-disc list-inside space-y-1 ml-1">
                      {syllabus.objectives.map((obj, idx) => (
                        <li key={idx} className="text-sm text-gray-600">{obj}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Topics */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Course Topics</h4>
                    <div className="space-y-3">
                      {syllabus.topics.map((topic) => (
                        <div key={topic.week} className="p-4 bg-gray-50/50 border border-gray-100 rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="bg-white border text-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
                              W{topic.week}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-bold text-gray-900">{topic.title}</h5>
                              <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                              <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wider">Learning Outcomes</p>
                                <div className="flex flex-wrap gap-2">
                                  {topic.learningOutcomes.map((outcome, idx) => (
                                    <Badge key={idx} variant="secondary" className="font-normal text-xs bg-white border">
                                      {outcome}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grading System */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 border-b pb-2">Grading System</h4>
                    <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Component</th>
                            <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Percentage</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {syllabus.gradingSystem.map((criteria, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="py-3 px-4 text-sm font-medium text-gray-700">{criteria.component}</td>
                              <td className="py-3 px-4 text-sm text-right font-black text-gray-900">{criteria.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50/80 border-t border-gray-200">
                           <tr>
                              <td className="py-3 px-4 text-sm font-bold text-gray-700 text-right">TOTAL</td>
                              <td className="py-3 px-4 text-sm font-black text-green-600 text-right">
                                {syllabus.gradingSystem.reduce((sum, item) => sum + item.percentage, 0).toFixed(2)}%
                              </td>
                           </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Curriculum */}
        <TabsContent value="curriculum" className="space-y-4">
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-gray-900 text-white p-8">
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Curriculum Overview</CardTitle>
              <p className="text-gray-400 text-sm font-semibold tracking-widest mt-1">PROGRAM STATISTICS AND COURSE ALLOCATION</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-10">
                {/* BS Computer Science */}
                <div>
                  <h3 className="font-black text-xl text-gray-900 mb-4 uppercase tracking-tight border-b pb-2">Bachelor of Science in Computer Science</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] uppercase font-black tracking-widest text-blue-500 mb-2">Total Units</p>
                      <p className="text-4xl font-black text-blue-700">{calcProgramStats(bscsCourses).totalUnits}</p>
                    </div>
                    <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mb-2">Total Courses</p>
                      <p className="text-4xl font-black text-indigo-700">{calcProgramStats(bscsCourses).totalCourses}</p>
                    </div>
                    <div className="p-6 bg-sky-50/50 border border-sky-100 rounded-2xl flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] uppercase font-black tracking-widest text-sky-500 mb-2">1st Year Courses</p>
                      <p className="text-3xl font-black text-sky-700">{bscsCourses.filter(c => c.yearLevel === 1).length}</p>
                    </div>
                    <div className="p-6 bg-cyan-50/50 border border-cyan-100 rounded-2xl flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] uppercase font-black tracking-widest text-cyan-500 mb-2">4th Year Courses</p>
                      <p className="text-3xl font-black text-cyan-700">{bscsCourses.filter(c => c.yearLevel === 4).length}</p>
                    </div>
                  </div>
                </div>

                {/* BS Information Technology */}
                <div>
                  <h3 className="font-black text-xl text-gray-900 mb-4 uppercase tracking-tight border-b pb-2">Bachelor of Science in Information Technology</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-6 bg-orange-50/50 border border-orange-100 rounded-2xl flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] uppercase font-black tracking-widest text-orange-500 mb-2">Total Units</p>
                      <p className="text-4xl font-black text-orange-700">{calcProgramStats(bsitCourses).totalUnits}</p>
                    </div>
                    <div className="p-6 bg-[#FF7F11]/10 border border-[#FF7F11]/20 rounded-2xl flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] uppercase font-black tracking-widest text-[#FF7F11] mb-2">Total Courses</p>
                      <p className="text-4xl font-black text-[#FF7F11]">{calcProgramStats(bsitCourses).totalCourses}</p>
                    </div>
                    <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-2xl flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] uppercase font-black tracking-widest text-amber-500 mb-2">1st Year Courses</p>
                      <p className="text-3xl font-black text-amber-700">{bsitCourses.filter(c => c.yearLevel === 1).length}</p>
                    </div>
                    <div className="p-6 bg-yellow-50/50 border border-yellow-100 rounded-2xl flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] uppercase font-black tracking-widest text-yellow-600 mb-2">4th Year Courses</p>
                      <p className="text-3xl font-black text-yellow-700">{bsitCourses.filter(c => c.yearLevel === 4).length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CourseModal 
        isOpen={isCourseModalOpen} 
        onClose={() => setIsCourseModalOpen(false)} 
        course={selectedCourse} 
        onSave={handleSaveCourse} 
      />

      <SyllabusModal 
        isOpen={isSyllabusModalOpen} 
        onClose={() => setIsSyllabusModalOpen(false)} 
        syllabus={selectedSyllabus} 
        availableCourses={availableCoursesForSyllabus}
        onSave={handleSaveSyllabus} 
      />
    </div>
  );
}
