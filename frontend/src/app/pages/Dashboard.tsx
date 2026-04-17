import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Users, 
  GraduationCap, 
  Award, 
  TrendingUp, 
  Calendar, 
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  BookOpen,
  Presentation,
  Loader2,
  Megaphone,
  PartyPopper
} from 'lucide-react';
import { useAuth, fetchWithAuth } from '../context/AuthContext';
import { Student, Schedule, Faculty, Course } from '../types';
import { EnrollmentModal } from '../components/EnrollmentModal';
import { toast } from 'sonner';
import { cn } from '../components/ui/utils';
import { Link } from 'react-router';

export function Dashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
         const [stuRes, schRes, facRes, crsRes] = await Promise.all([
           fetchWithAuth('/students'),
           fetchWithAuth('/schedules'),
           fetchWithAuth('/faculty'),
           fetchWithAuth('/courses')
         ]);
         
         const stu = stuRes.ok ? await stuRes.json() : { data: [] };
         const sch = schRes.ok ? await schRes.json() : { data: [] };
         const fac = facRes.ok ? await facRes.json() : { data: [] };
         const crs = crsRes.ok ? await crsRes.json() : { data: [] };

        setStudents(stu.data || []);
        setSchedules(sch.data || []);
        setFaculty(fac.data || []);
        setCourses(crs.data || []);
      } catch (error) {
        console.error('Data error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const currentStudent = useMemo(() => students.find(s => s.email === user?.email), [students, user]);
  const currentFaculty = useMemo(() => faculty.find(f => f.email === user?.email), [faculty, user]);
  
  const mySubjects = useMemo(() => {
    if (!currentStudent) return [];
    return schedules.filter(s => s.section === currentStudent.section).map(s => ({
      ...s,
      name: courses.find(c => c.code === s.courseCode)?.name || s.courseCode
    }));
  }, [currentStudent, schedules, courses]);

  const myClasses = useMemo(() => {
    if (!currentFaculty) return [];
    return schedules.filter(s => s.facultyId.toString() === currentFaculty.id.toString());
  }, [currentFaculty, schedules]);

  const stats = [
    { title: "Students", value: students.length, icon: Users, color: "blue" },
    { title: "Faculty", value: faculty.length, icon: GraduationCap, color: "green" },
    { title: "Sections", value: new Set(schedules.map(s => s.section)).size, icon: Award, color: "purple" },
    { title: "Avg. GPA", value: students.length > 0 ? (students.reduce((sum, s) => sum + s.gpa, 0) / students.length).toFixed(2) : "0.00", icon: TrendingUp, color: "orange" },
  ];

  const announcements = [
    { title: "Project Defense 2026", content: "Capstone defense schedules are now final.", date: "Apr 25", author: "Dean Office" },
    { title: "Tech Fest Night", content: "Celebration night for CCS students at the Gym.", date: "May 5", author: "Student Council" },
    { title: "System Outage", content: "Expected downtime this coming weekend for DB sync.", date: "May 10", author: "IT Admin" }
  ];

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-[#FF7F11] animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 w-full px-2">
      {/* ── Welcome Section ─────────────────────────────────────────────── */}
      <section className="bg-gray-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#FF7F11]/10 to-transparent pointer-events-none" />
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
               <p className="text-[#FF7F11] text-xs font-black uppercase tracking-[0.4em] mb-4">Academic Portal</p>
               <h1 className="text-5xl font-black tracking-tight mb-2">Hello, {user?.name.split(' ')[0]}!</h1>
               <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">{user?.role} · College of Computing Studies</p>
            </div>
            <div className="flex gap-4">
               <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md">
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Term</p>
                  <p className="text-lg font-black text-white">2nd Sem AY 2026-27</p>
               </div>
               <div className="bg-[#FF7F11] p-5 rounded-3xl shadow-lg shadow-orange-500/20 text-center flex flex-col items-center justify-center min-w-[100px]">
                  <Clock className="w-5 h-5 text-white mb-1" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Ongoing</p>
               </div>
            </div>
         </div>
      </section>

      {/* ── User-Specific Content (Full Width) ─────────────────────────────────────── */}
      <div className="space-y-8">
        {user?.role === 'student' && (
           <div className="space-y-6">
              {/* Enrollment Call to Action */}
              <div className={cn("rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative", 
                currentStudent?.enrollmentDate ? "bg-emerald-500 text-white" : "bg-[#FF7F11] text-white shadow-2xl shadow-orange-500/30")}>
                <div className="flex items-center gap-6 relative z-10">
                   <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                      {currentStudent?.enrollmentDate ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                   </div>
                   <div>
                      <h2 className="text-2xl font-black uppercase tracking-tight leading-none">
                         {currentStudent?.enrollmentDate ? 'System Enrolled' : 'Pending Enrollment'}
                      </h2>
                      <p className="text-white/70 text-xs font-black uppercase tracking-widest mt-2">
                        {currentStudent?.section ? `${currentStudent.section} • ` : ''}{currentStudent?.program || 'CCS STUDENT'}
                      </p>
                   </div>
                </div>
                {!currentStudent?.enrollmentDate && (
                   <Button onClick={() => setIsEnrollModalOpen(true)} className="bg-gray-900 border-none hover:bg-black px-8 h-12 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl">Process Status Now</Button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Left: Action Widgets */}
                 <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                         <div className="flex items-center gap-4 mb-6">
                            <BookOpen className="w-6 h-6 text-[#FF7F11]" />
                            <h3 className="text-sm font-black uppercase tracking-widest">My Current Load</h3>
                         </div>
                         <div className="space-y-4">
                            {mySubjects.slice(0, 4).map((sub, i) => (
                               <Link key={i} to={`/subjects/${sub.courseCode}`} className="flex items-center justify-between group">
                                  <span className="text-xs font-black text-gray-500 group-hover:text-gray-900 transition-colors uppercase tracking-tight">{sub.courseCode}</span>
                                  <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[120px]">{sub.day} {sub.timeStart}</span>
                                  <ArrowRight className="w-3 h-3 text-gray-200 group-hover:text-[#FF7F11] group-hover:translate-x-1 transition-all" />
                               </Link>
                            ))}
                            {mySubjects.length === 0 && <p className="text-xs text-gray-400 italic">No active schedules found.</p>}
                         </div>
                      </Card>
                      <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                         <div className="flex items-center gap-4 mb-6">
                            <Award className="w-6 h-6 text-[#FF7F11]" />
                            <h3 className="text-sm font-black uppercase tracking-widest">Self Metric</h3>
                         </div>
                         <div className="flex flex-col items-center justify-center h-full pb-6">
                            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Standing GPA</p>
                            <p className="text-6xl font-black text-gray-900 tracking-tighter">{currentStudent?.gpa.toFixed(2) || '0.00'}</p>
                         </div>
                      </Card>
                    </div>

                    {/* New Event Banner to fill space */}
                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-gray-900 text-white p-8 overflow-hidden relative">
                       <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
                       <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div>
                             <PartyPopper className="w-8 h-8 text-[#FF7F11] mb-4" />
                             <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Tech Symposium 2026</h3>
                             <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-6">May 12, 2026 • Grand Hall, Main Campus</p>
                             <div className="flex items-center gap-4">
                                <Button className="bg-[#FF7F11] hover:bg-orange-600 rounded-xl h-10 px-6 text-[10px] font-black uppercase tracking-widest shadow-xl transition-transform active:scale-95">Secure Your Ticket</Button>
                                <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white rounded-xl h-10 px-6 text-[10px] font-black uppercase tracking-widest">Learn More</Button>
                             </div>
                          </div>
                       </div>
                    </Card>
                 </div>

                 {/* Right: Announcements */}
                 <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
                       <CardHeader className="bg-gray-50/50 p-6 border-b border-gray-100 flex flex-row items-center justify-between">
                          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                             <Megaphone className="w-4 h-4 text-[#FF7F11]" /> Announcements
                          </CardTitle>
                       </CardHeader>
                       <CardContent className="p-6 space-y-4">
                          {announcements.map((ann, i) => (
                            <div key={i} className="group cursor-pointer">
                               <p className="text-xs font-black text-gray-900 uppercase group-hover:text-[#FF7F11] transition-colors">{ann.title}</p>
                               <p className="text-[10px] text-gray-400 font-bold mb-2 uppercase">{ann.date} • {ann.author}</p>
                               <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ann.content}</p>
                               {i < announcements.length - 1 && <div className="h-px bg-gray-50 mt-4" />}
                            </div>
                          ))}
                       </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-[#FF7F11] text-white p-8">
                       <div className="flex items-center gap-3 mb-6">
                          <CheckCircle2 className="w-6 h-6 text-white/80" />
                          <h3 className="text-sm font-black uppercase tracking-widest">To-Do List</h3>
                       </div>
                       <div className="space-y-6">
                          <div className="flex items-start gap-4 opacity-80 hover:opacity-100 cursor-pointer transition-opacity">
                             <div className="w-5 h-5 rounded border-2 border-white/40 mt-0.5 flex-shrink-0" />
                             <div>
                                <p className="text-xs font-black uppercase tracking-tight leading-none mb-1">Update Student Profile</p>
                                <p className="text-[10px] font-bold uppercase text-white/70">Required for ID Registration</p>
                             </div>
                          </div>
                          <div className="flex items-start gap-4 opacity-80 hover:opacity-100 cursor-pointer transition-opacity">
                             <div className="w-5 h-5 rounded border-2 border-white/40 mt-0.5 flex-shrink-0" />
                             <div>
                                <p className="text-xs font-black uppercase tracking-tight leading-none mb-1">Clear Library Accounts</p>
                                <p className="text-[10px] font-bold uppercase text-white/70">Overdue books detected</p>
                             </div>
                          </div>
                       </div>
                    </Card>
                 </div>
              </div>
           </div>
        )}

        {user?.role === 'faculty' && (
           <div className="space-y-6">
              <div className="rounded-[2.5rem] bg-indigo-600 p-8 text-white flex flex-col md:flex-row gap-6 items-center justify-between shadow-2xl">
                 <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Faculty Instruction</h2>
                    <p className="text-indigo-100 text-xs font-black uppercase tracking-widest mt-1">Manage Class Syllabi & Student Performance</p>
                 </div>
                 <Presentation className="w-12 h-12 text-indigo-400" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8">
                       <div className="flex items-center gap-4 mb-6">
                          <Calendar className="w-6 h-6 text-[#FF7F11]" />
                          <h3 className="text-sm font-black uppercase tracking-widest">Teaching Load</h3>
                       </div>
                       <div className="space-y-4">
                          {myClasses.map((cls, i) => (
                             <Link key={i} to={`/my-classes?code=${cls.courseCode}&section=${cls.section}&tab=grades`} className="flex items-center justify-between group">
                                <span className="text-xs font-black text-gray-500 group-hover:text-gray-900 transition-colors uppercase tracking-tight">{cls.courseCode} · {cls.section}</span>
                                <ArrowRight className="w-3 h-3 text-gray-200 group-hover:text-[#FF7F11] group-hover:translate-x-1 transition-all" />
                             </Link>
                          ))}
                          {myClasses.length === 0 && <p className="text-xs text-gray-400 italic">No classes assigned yet.</p>}
                       </div>
                    </Card>

                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-gray-900 text-white p-8 overflow-hidden relative">
                       <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/20 to-transparent pointer-events-none" />
                       <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                          <div>
                             <PartyPopper className="w-8 h-8 text-[#FF7F11] mb-4" />
                             <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Faculty Mixer Event</h3>
                             <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-6">May 12, 2026 • Faculty Lounge</p>
                             <Button className="bg-[#FF7F11] hover:bg-orange-600 rounded-xl h-10 px-6 text-[10px] font-black uppercase tracking-widest shadow-xl transition-transform active:scale-95">RSVP Now</Button>
                          </div>
                       </div>
                    </Card>
                 </div>
                 
                 <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
                       <CardHeader className="bg-gray-50/50 p-6 border-b border-gray-100 flex flex-row items-center justify-between">
                          <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                             <Megaphone className="w-4 h-4 text-[#FF7F11]" /> Announcements
                          </CardTitle>
                       </CardHeader>
                       <CardContent className="p-6 space-y-4">
                          {announcements.map((ann, i) => (
                            <div key={i} className="group cursor-pointer">
                               <p className="text-xs font-black text-gray-900 uppercase group-hover:text-[#FF7F11] transition-colors">{ann.title}</p>
                               <p className="text-[10px] text-gray-400 font-bold mb-2 uppercase">{ann.date} • {ann.author}</p>
                               <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ann.content}</p>
                               {i < announcements.length - 1 && <div className="h-px bg-gray-50 mt-4" />}
                            </div>
                          ))}
                       </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-[#FF7F11] text-white p-8">
                       <div className="flex items-center gap-3 mb-6">
                          <AlertCircle className="w-6 h-6 text-white/80" />
                          <h3 className="text-sm font-black uppercase tracking-widest">Faculty Reminders</h3>
                       </div>
                       <div className="space-y-6">
                          <div className="flex items-start gap-4 opacity-80 hover:opacity-100 cursor-pointer transition-opacity">
                             <div className="w-5 h-5 rounded border-2 border-white/40 mt-0.5 flex-shrink-0" />
                             <div>
                                <p className="text-xs font-black uppercase tracking-tight leading-none mb-1">Submit Midterm Grades</p>
                                <p className="text-[10px] font-bold uppercase text-white/70">Due by end of week</p>
                             </div>
                          </div>
                          <div className="flex items-start gap-4 opacity-80 hover:opacity-100 cursor-pointer transition-opacity">
                             <div className="w-5 h-5 rounded border-2 border-white/40 mt-0.5 flex-shrink-0" />
                             <div>
                                <p className="text-xs font-black uppercase tracking-tight leading-none mb-1">Finalize Syllabus Formats</p>
                                <p className="text-[10px] font-bold uppercase text-white/70">Needs Dean Approval</p>
                             </div>
                          </div>
                       </div>
                    </Card>
                 </div>
              </div>
           </div>
        )}

        {user?.role === 'admin' && (
           <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {stats.map((stat, i) => (
                   <Card key={i} className="rounded-3xl border-none shadow-lg bg-white p-6 group hover:bg-[#FF7F11] transition-all duration-300">
                      <div className="flex items-center justify-between mb-2">
                         <stat.icon className="w-5 h-5 text-[#FF7F11] group-hover:text-white" />
                         <span className="text-[10px] font-black text-gray-400 group-hover:text-white/50 uppercase tracking-widest">{stat.title}</span>
                      </div>
                      <p className="text-3xl font-black text-gray-900 group-hover:text-white tracking-tighter transition-colors">{stat.value}</p>
                   </Card>
                 ))}
              </div>
              
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
                 <CardHeader className="bg-gray-50/50 p-6 border-b border-gray-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase tracking-widest">Active Enrollment Feed</CardTitle>
                    <Link to="/students" className="text-[10px] font-black text-[#FF7F11] uppercase tracking-widest">View Directory</Link>
                 </CardHeader>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <tbody className="divide-y divide-gray-50">
                          {students.slice(0, 5).map(s => (
                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center font-black text-[10px] uppercase">{s.firstName[0]}{s.lastName[0]}</div>
                                     <div>
                                        <p className="text-xs font-black text-gray-800 uppercase tracking-tight">{s.firstName} {s.lastName}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">{s.program}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-center">
                                  <span className="text-[10px] font-black text-gray-900 uppercase">GPA {s.gpa.toFixed(2)}</span>
                               </td>
                               <td className="px-6 py-4 text-right">
                                  {s.classification === 'Irregular' && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded border border-amber-200">IRREG</span>}
                               </td>
                            </tr>
                          ))}
                          {students.length === 0 && (
                            <tr>
                               <td colSpan={3} className="px-6 py-8 text-center text-gray-400 text-xs italic">No enrolled students found.</td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </Card>
           </div>
        )}
      </div>

      {user?.role === 'student' && (
        <EnrollmentModal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          student={currentStudent || null}
          onEnroll={async (data) => {
             toast.success('Syncing academic status...');
             try {
                const res = await fetchWithAuth(`/students/${currentStudent?.id}`, {
                   method: 'PUT',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ ...currentStudent, ...data })
                });
                if (res.ok) {
                   const result = await res.json();
                   setStudents(students.map(s => s.id === result.data.id ? result.data : s));
                   setIsEnrollModalOpen(false);
                   toast.success('Officially Enrolled!');
                }
             } catch (e) { toast.error('Check network connection.'); }
          }}
          schedules={schedules}
          faculty={faculty}
        />
      )}
    </div>
  );
}