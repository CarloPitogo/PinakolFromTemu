import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  Users, 
  Plus,
  Briefcase,
  Trash2
} from 'lucide-react';
import { fetchWithAuth, useAuth } from '../context/AuthContext';
import { Schedule, Faculty, Course } from '../types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const START_HOUR = 6; 
const END_HOUR = 21; 
const ROW_HEIGHT = 40; 
const TOTAL_ROWS = (END_HOUR - START_HOUR) * 2;

export function Scheduling() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<{ section?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingNewSection, setIsAddingNewSection] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    courseCode: '',
    section: '',
    facultyId: '',
    room: '',
    day: 'Monday',
    timeStart: '08:00 AM',
    timeEnd: '09:00 AM',
    type: 'Lecture'
  });

  const loadData = async () => {
    try {
      const [schRes, facRes, crsRes, stuRes] = await Promise.all([
        fetchWithAuth('/schedules'),
        fetchWithAuth('/faculty'),
        fetchWithAuth('/courses'),
        fetchWithAuth('/students')
      ]);
      const schData = schRes.ok ? await schRes.json() : { data: [] };
      const facData = facRes.ok ? await facRes.json() : { data: [] };
      const crsData = crsRes.ok ? await crsRes.json() : { data: [] };
      const stuData = stuRes.ok ? await stuRes.json() : { data: [] };

      setSchedules(schData.data || []);
      setFacultyList(facData.data || []);
      setCourses(crsData.data || []);
      setStudents(stuData.data || []);
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetchWithAuth('/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        toast.success('Schedule assigned successfully!');
        setIsModalOpen(false);
        loadData();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to assign schedule');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      const response = await fetchWithAuth(`/schedules/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Schedule removed');
        loadData();
      }
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const parseTime = (timeStr: string) => {
    if (!timeStr.includes(' ')) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours + minutes / 60;
    }
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours + minutes / 60;
  };

  const calculatePosition = (startTime: string, endTime: string) => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const top = ((start - START_HOUR) / 0.5) * ROW_HEIGHT;
    const height = ((end - start) / 0.5) * ROW_HEIGHT;
    return { top, height };
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-medium tracking-widest text-xs uppercase">Synchronizing System Calendar...</div>;

  const isFaculty = user?.role === 'faculty';
  const currentFaculty = isFaculty ? facultyList.find(f => f.email === user?.email) : null;
  const filteredSchedules = isFaculty 
    ? schedules.filter(s => s.facultyId.toString() === currentFaculty?.id.toString())
    : schedules;

  if (isFaculty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-[#FF7F11] to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Teaching Schedule</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">A.Y. 2026-2027 | Sem 1</p>
          </div>
        </div>

        <Card className="shadow-2xl border-none overflow-hidden rounded-[1.5rem] bg-white">
          <CardHeader className="bg-gray-900 text-white p-4">
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em]">
              <Clock className="w-4 h-4 text-orange-400" />
              Faculty Weekly Planner
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto p-4 bg-gray-200/50 rounded-b-[1.5rem]">
              <div className="w-full min-w-[1000px] bg-white border border-gray-300 shadow-sm relative">
                <div className="grid grid-cols-[120px_repeat(7,1fr)] border-b border-gray-200 bg-white">
                  <div className="p-3 border-r border-gray-200 text-center text-[10px] font-black text-gray-800 uppercase tracking-widest flex items-center justify-center">TIME</div>
                  {DAYS.map(day => (
                    <div key={day} className="p-3 text-center text-[11px] font-bold text-gray-800 border-r border-gray-200 last:border-r-0 uppercase tracking-widest flex items-center justify-center">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="relative" style={{ height: TOTAL_ROWS * ROW_HEIGHT }}>
                  {Array.from({ length: TOTAL_ROWS }).map((_, i) => {
                    const currentTotalMinutes = START_HOUR * 60 + i * 30;
                    const nextTotalMinutes = currentTotalMinutes + 30;
                    const formatTime = (totalMins: number) => {
                        const h = Math.floor(totalMins / 60);
                        const m = totalMins % 60;
                        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2,'0')}`;
                    };
                    const timeLabel = `${formatTime(currentTotalMinutes)} - ${formatTime(nextTotalMinutes)}`;

                    return (
                      <div key={i} className="absolute w-full border-b border-gray-200 flex" style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}>
                        <div className="w-[120px] border-r border-gray-200 flex items-center justify-center text-[11px] font-medium text-gray-700 bg-white">
                          {timeLabel}
                        </div>
                        <div className="flex-1 grid grid-cols-7">
                          {Array.from({ length: 7 }).map((_, j) => (
                             <div key={j} className="border-r border-gray-200 last:border-r-0 h-full bg-white"></div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {filteredSchedules.map((sched, idx) => {
                    const dayOffset = DAYS.indexOf(sched.day);
                    if (dayOffset === -1) return null;
                    const { top, height } = calculatePosition(sched.timeStart, sched.timeEnd);
                    const colWidth = `calc((100% - 120px) / 7)`;
                    
                    return (
                      <div key={idx} className="absolute border border-white transition-transform hover:scale-[1.01] hover:z-20 hover:shadow-xl cursor-default"
                        style={{ 
                          top: top, height: height, 
                          left: `calc(120px + (${dayOffset} * ${colWidth}))`, 
                          width: colWidth,
                        }}>
                        <div className={`h-full w-full flex flex-col items-center justify-center p-2 text-center text-white ${
                          sched.type === 'Laboratory' ? 'bg-[#1a237e]' : 'bg-[#b71c1c]'
                        }`}>
                            <p className="font-bold text-[11px] leading-tight mb-1">{sched.courseCode}: {sched.section}</p>
                            <p className="font-medium text-[10px] leading-snug">{sched.type}</p>
                            <p className="font-medium text-[10px] leading-snug uppercase">{sched.room}</p>
                            {/* For faculty view, we don't need to show their own name, but for admin view we would, scheduling combines both nicely. */}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin View Summary
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#FF7F11] rounded-xl flex items-center justify-center shadow-lg">
            <CalendarIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">System Scheduling</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Administrative Resource Planner</p>
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#FF7F11] hover:bg-orange-600 gap-2 h-10 rounded-xl px-6 font-bold text-xs uppercase tracking-widest">
                <Plus className="w-4 h-4" />
                Assign Section
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-black uppercase tracking-tight">Assign Faculty to Section</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="text-[10px] uppercase font-black text-gray-400">Subject / Course</Label>
                     <select className="w-full h-10 px-3 py-2 rounded-md border text-xs" value={formData.courseCode} onChange={(e) => setFormData({...formData, courseCode: e.target.value})}>
                        <option value="">Select Course</option>
                        {courses.map(c => <option key={c.id} value={c.code}>{c.code} - {c.name}</option>)}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] uppercase font-black text-gray-400">Section Name</Label>
                     {!isAddingNewSection ? (
                       <div className="flex gap-2">
                         <select 
                           className="flex-1 h-10 px-3 py-2 rounded-md border text-xs" 
                           value={formData.section} 
                           onChange={(e) => {
                             if (e.target.value === "__NEW__") {
                               setIsAddingNewSection(true);
                               setFormData({...formData, section: ''});
                             } else {
                               setFormData({...formData, section: e.target.value});
                             }
                           }}
                         >
                           <option value="">Select Section</option>
                           {[...new Set([
                             ...schedules.map(s => s.section),
                             ...students.map(s => s.section).filter(Boolean)
                           ])].sort().map(s => (
                             <option key={s} value={s}>{s}</option>
                           ))}
                           <option value="__NEW__" className="text-[#FF7F11] font-bold">+ Create New Section</option>
                         </select>
                       </div>
                     ) : (
                       <div className="relative">
                         <Input 
                           placeholder="Enter new section..." 
                           className="text-xs" 
                           value={formData.section} 
                           onChange={(e) => setFormData({...formData, section: e.target.value})} 
                         />
                         <button 
                           type="button"
                           onClick={() => setIsAddingNewSection(false)}
                           className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-400 hover:text-gray-600"
                         >
                           Cancel
                         </button>
                       </div>
                     )}
                   </div>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] uppercase font-black text-gray-400">Assigned Faculty</Label>
                   <select className="w-full h-10 px-3 py-2 rounded-md border text-xs" value={formData.facultyId} onChange={(e) => setFormData({...formData, facultyId: e.target.value})}>
                      <option value="">Select Professor</option>
                      {facultyList.map(f => <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>)}
                   </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="text-[10px] uppercase font-black text-gray-400">Day</Label>
                     <select className="w-full h-10 px-3 py-2 rounded-md border text-xs" value={formData.day} onChange={(e) => setFormData({...formData, day: e.target.value})}>
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] uppercase font-black text-gray-400">Schedule Type</Label>
                     <select className="w-full h-10 px-3 py-2 rounded-md border text-xs" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                        <option value="Lecture">Lecture</option>
                        <option value="Laboratory">Laboratory</option>
                     </select>
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                   <div className="space-y-2">
                     <Label className="text-[10px] uppercase font-black text-gray-400">Start Time</Label>
                     <Input placeholder="08:00 AM" className="text-xs" value={formData.timeStart} onChange={(e) => setFormData({...formData, timeStart: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] uppercase font-black text-gray-400">End Time</Label>
                     <Input placeholder="10:00 AM" className="text-xs" value={formData.timeEnd} onChange={(e) => setFormData({...formData, timeEnd: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] uppercase font-black text-gray-400">Room</Label>
                     <Input placeholder="Comp Lab 1" className="text-xs" value={formData.room} onChange={(e) => setFormData({...formData, room: e.target.value})} />
                   </div>
                </div>

                <Button type="submit" className="w-full bg-[#FF7F11] hover:bg-orange-600 font-bold uppercase tracking-widest text-xs h-11 rounded-xl mt-4">Generate Schedule</Button>
              </form>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-blue-50/30 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 bg-blue-500 rounded-xl text-white">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-gray-400">Total Classes</p>
              <p className="text-lg font-black text-gray-900">{schedules.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-orange-50/30 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 bg-[#FF7F11] rounded-xl text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-gray-400">Rooms Active</p>
              <p className="text-lg font-black text-gray-900">{new Set(schedules.map(s => s.room)).size}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50/30 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 bg-purple-500 rounded-xl text-white">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-gray-400">Active Faculty</p>
              <p className="text-lg font-black text-gray-900">{new Set(schedules.map(s => s.facultyId)).size}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-gray-100 rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/50 border-b py-3 px-6"><CardTitle className="text-xs font-black uppercase tracking-widest text-gray-500">Master Weekly Schedule</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {DAYS.slice(0, 5).map(day => {
              const dayScheds = schedules.filter(s => s.day === day);
              return (
                <div key={day} className="p-6">
                  <h3 className="text-[10px] font-black text-[#FF7F11] uppercase tracking-[0.2em] mb-4 underline decoration-orange-200 underline-offset-8">{day}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {dayScheds.map(s => {
                      const faculty = facultyList.find(f => f.id.toString() === s.facultyId.toString());
                      return (
                        <div key={s.id} className="p-3 border border-gray-50 rounded-xl hover:bg-gray-50 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                             <span className="text-[9px] font-black bg-gray-100 px-2 py-0.5 rounded uppercase">{s.section}</span>
                             <div className="flex gap-1">
                                <Badge variant="outline" className="text-[8px] py-0">{s.type}</Badge>
                                <button onClick={() => deleteSchedule(s.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                   <Trash2 className="w-3 h-3" />
                                </button>
                             </div>
                          </div>
                          <h4 className="font-bold text-gray-900 text-xs mb-1">{s.courseCode}</h4>
                          <div className="space-y-1 text-[9px] text-gray-400 font-bold">
                             <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-orange-200"/> {s.timeStart} - {s.timeEnd}</div>
                             <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-orange-200"/> {s.room}</div>
                             <div className="flex items-center gap-1 text-gray-600 truncate"><UserIcon className="w-3 h-3 text-[#FF7F11]"/> {faculty ? `${faculty.firstName} ${faculty.lastName}` : 'Unassigned'}</div>
                          </div>
                        </div>
                      );
                    })}
                    {dayScheds.length === 0 && <p className="text-[9px] text-gray-300 italic font-bold">No sessions scheduled</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
