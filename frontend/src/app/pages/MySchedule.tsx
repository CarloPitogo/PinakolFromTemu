import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { fetchWithAuth } from '../context/AuthContext';
import { Student, Schedule, Faculty } from '../types';
import { useAuth } from '../context/AuthContext';
import { Clock, Calendar as CalendarIcon, AlertCircle, MapPin, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const START_HOUR = 6;  // 6:00 AM
const END_HOUR = 21;   // 9:00 PM
const ROW_HEIGHT = 40; // 30 mins interval
const TOTAL_ROWS = (END_HOUR - START_HOUR) * 2;

export function MySchedule() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsRes, schedulesRes, facultyRes] = await Promise.all([
          fetchWithAuth('/students'),
          fetchWithAuth('/schedules'),
          fetchWithAuth('/faculty')
        ]);

        if (studentsRes.ok && schedulesRes.ok && facultyRes.ok) {
          const studentsData = await studentsRes.json();
          const schedulesData = await schedulesRes.json();
          const facultyData = await facultyRes.json();

          const currentStudentProfile = studentsData.data.find((s: Student) => s.email === user?.email);
          setStudent(currentStudentProfile || null);
          setSchedules(schedulesData.data || []);
          setFaculty(facultyData.data || []);
        } else {
          toast.error("Failed to fetch schedule data");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const parseTime = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours + minutes / 60;
  };

  const calculatePosition = (startTime: string, endTime: string) => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    // Since each ROW_HEIGHT represents 0.5 hours (30 mins)
    const top = ((start - START_HOUR) / 0.5) * ROW_HEIGHT;
    const height = ((end - start) / 0.5) * ROW_HEIGHT;
    return { top, height };
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading your schedule...</div>;
  }

  if (!student) {
    return <div className="p-8 text-center text-gray-500">Student profile not found. Please contact administration.</div>;
  }

  const isEnrolled = !!student.enrollmentDate;

  if (!isEnrolled || !student.section) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF7F11] to-orange-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <CalendarIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#FF7F11] tracking-tight">
              My Schedule
            </h1>
            <p className="text-sm text-gray-500 font-medium font-sans mt-0.5">
              View your enrolled block section and subjects
            </p>
          </div>
        </div>

        <Card className="shadow-lg border-l-4 border-l-orange-500">
          <CardContent className="p-12 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-16 h-16 text-orange-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Not Yet Enrolled</h2>
            <p className="text-gray-600 max-w-md">
              You are currently not enrolled in any block section for the active semester. Please head over to your Dashboard to process your enrollment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mySchedules = schedules.filter(s => s.section === student.section);

  const getProfessorName = (facultyId: string) => {
    const prof = faculty.find(f => f.id === facultyId || f.id.toString() === facultyId);
    return prof ? `${prof.firstName} ${prof.lastName}` : 'TBA';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF7F11] to-orange-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <CalendarIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#FF7F11] tracking-tight">
              My Schedule
            </h1>
            <p className="text-sm text-gray-500 font-medium font-sans mt-0.5">
              A.Y. 2026-2027 | Block Section: <span className="font-bold text-gray-800">{student.section}</span>
            </p>
          </div>
        </div>
      </div>

      <Card className="shadow-2xl overflow-hidden border-none rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-[#FF7F11] to-orange-600 text-white p-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Clock className="w-5 h-5" />
            Weekly Academic Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          <div className="overflow-x-auto p-4 bg-gray-200/50 rounded-b-2xl">
            <div className="w-full min-w-[1000px] bg-white border border-gray-300 shadow-sm">
              {/* Header: Days */}
              <div className="grid grid-cols-[120px_repeat(7,1fr)] border-b border-gray-200">
                <div className="p-3 border-r border-gray-200 text-center text-[10px] font-black text-gray-800 uppercase tracking-widest flex items-center justify-center">TIME</div>
                {DAYS.map(day => (
                  <div key={day} className="p-3 text-center text-xs font-bold text-gray-800 uppercase border-r border-gray-200 last:border-r-0 flex items-center justify-center">
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid Body */}
              <div className="relative" style={{ height: TOTAL_ROWS * ROW_HEIGHT }}>
                {/* Time Labels & Horizontal Lines */}
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

                {/* Schedule Blocks */}
                {mySchedules.map((sched, idx) => {
                  const dayOffset = DAYS.indexOf(sched.day);
                  if (dayOffset === -1) return null;

                  const { top, height } = calculatePosition(sched.timeStart, sched.timeEnd);
                  const columnWidth = `calc((100% - 120px) / 7)`;
                  const left = `calc(120px + (${dayOffset} * ${columnWidth}))`;

                  return (
                    <div
                      key={idx}
                      className="absolute border border-white cursor-pointer transition-transform hover:scale-[1.01] hover:z-20 hover:shadow-xl"
                      style={{
                        top: top,
                        height: height,
                        left: left,
                        width: columnWidth,
                      }}
                      onClick={() => navigate(`/dashboard/subjects/${sched.courseCode}`)}
                    >
                      <div className={`h-full w-full flex flex-col items-center justify-center p-2 text-center text-white ${
                          sched.type === 'Laboratory'
                            ? 'bg-[#1a237e]' // Deep Navy
                            : 'bg-[#b71c1c]' // Deep Red
                        }`}>
                          <p className="font-bold text-[11px] leading-tight mb-1">{sched.courseCode}: {sched.section}</p>
                          <p className="font-medium text-[10px] leading-snug">{sched.type}</p>
                          <p className="font-medium text-[10px] leading-snug uppercase">{sched.room}</p>
                          <p className="font-bold text-[10px] leading-snug mt-1">{getProfessorName(sched.facultyId)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-blue-700 text-xs font-bold">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          Lecture Classes
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-100 rounded-full text-purple-700 text-xs font-bold">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
          Laboratory Classes
        </div>
      </div>
    </div>
  );
}
