import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import {
  GraduationCap,
  BookOpen,
  TrendingUp,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
  Calculator,
} from 'lucide-react';
import { fetchWithAuth, useAuth } from '../context/AuthContext';
import { Student, Course, Schedule } from '../types';
import { cn } from '../components/ui/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface GradeRecord {
  id: number;
  course_code: string;
  section: string;
  prelim: number | null;
  midterm: number | null;
  finals: number | null;
  final_grade: number | null;
  remarks: string | null;
  semester: string;
  school_year: string;
}

interface SubjectRow {
  code: string;
  name: string;
  units: number;
  prelim: number | null;
  midterm: number | null;
  finals: number | null;
  finalGrade: number | null;
  remarks: string | null;
  semester?: string;
  school_year?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function gradeColor(v: number | null) {
  if (v === null) return 'text-gray-300';
  if (v >= 90) return 'text-emerald-600 font-black';
  if (v >= 80) return 'text-blue-600 font-black';
  if (v >= 75) return 'text-amber-600 font-black';
  return 'text-red-600 font-black';
}

function remarksStyle(r: string | null) {
  if (!r || r === 'PENDING') return 'text-gray-300 font-black text-[10px] uppercase';
  if (r === 'PASSED') return 'text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider';
  if (r === 'FAILED') return 'text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider';
  return 'text-gray-500 text-[10px] font-bold uppercase';
}

function getEquivalent(grade: number | null): string {
  if (grade === null) return '—';
  if (grade >= 96) return '1.00';
  if (grade >= 92) return '1.25';
  if (grade >= 88) return '1.50';
  if (grade >= 84) return '1.75';
  if (grade >= 80) return '2.00';
  if (grade >= 75) return '2.25';
  if (grade >= 70) return '2.50';
  if (grade >= 65) return '2.75';
  if (grade >= 60) return '3.00';
  return '5.00';
}

function equivalentColor(eq: string) {
  const v = parseFloat(eq);
  if (isNaN(v)) return 'text-gray-300';
  if (v <= 1.50) return 'text-emerald-600 font-black';
  if (v <= 2.00) return 'text-blue-600 font-black';
  if (v <= 3.00) return 'text-amber-600 font-black';
  return 'text-red-600 font-black';
}

function computeGWA(rows: SubjectRow[]) {
  const complete = rows.filter(r => r.finalGrade !== null);
  if (complete.length === 0) return null;
  const totalUnits = complete.reduce((s, r) => s + r.units, 0);
  const weighted = complete.reduce((s, r) => s + parseFloat(getEquivalent(r.finalGrade)) * r.units, 0);
  return totalUnits > 0 ? (weighted / totalUnits).toFixed(2) : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
export function MyGrades() {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [showGradingSystem, setShowGradingSystem] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [stuRes, gradeRes, crsRes, schRes] = await Promise.all([
          fetchWithAuth('/students'),
          fetchWithAuth('/grades'),
          fetchWithAuth('/courses'),
          fetchWithAuth('/schedules'),
        ]);

        const stuData = stuRes.ok ? await stuRes.json() : { data: [] };
        const gradeData = gradeRes.ok ? await gradeRes.json() : { data: [] };
        const crsData = crsRes.ok ? await crsRes.json() : { data: [] };
        const schData = schRes.ok ? await schRes.json() : { data: [] };

        const currentStudent = (stuData.data || []).find(
          (s: Student) => s.email === user?.email
        );

        setStudent(currentStudent || null);
        setGrades(gradeData.data || []);
        setCourses(crsData.data || []);
        setSchedules(schData.data || []);
      } catch (err) {
        console.error('Error loading grades:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  // ── Unified Rows Computation ───────────────────────────────────────────────
  const { allRows, totalUnits, gwa, semesters, schoolYears } = useMemo(() => {
    // 1. Filtered Grades
    const filtered = grades.filter(g => {
      if (selectedSemester !== 'All' && g.semester !== selectedSemester) return false;
      if (selectedYear !== 'All' && g.school_year !== selectedYear) return false;
      return true;
    });

    // 2. Map to Rows
    const gradedRows: SubjectRow[] = filtered.map(g => {
      const course = courses.find(c => c.code.toLowerCase() === g.course_code.toLowerCase());
      return {
        code: g.course_code,
        name: course?.name || g.course_code,
        units: course?.units ?? 3,
        prelim: g.prelim,
        midterm: g.midterm,
        finals: g.finals,
        finalGrade: g.final_grade,
        remarks: g.remarks,
        semester: g.semester,
        school_year: g.school_year
      };
    });

    // 3. Pending Rows (Only if no semester filter or matching current)
    const mySchedules = schedules.filter(s => s.section === student?.section);
    const gradedCodes = new Set(gradedRows.map(r => r.code.toLowerCase()));
    
    const pendingRows: SubjectRow[] = mySchedules
      .filter(s => !gradedCodes.has(s.courseCode.toLowerCase()))
      .map(s => {
        const course = courses.find(c => c.code === s.courseCode);
        return {
          code: s.courseCode,
          name: course?.name || s.courseCode,
          units: course?.units ?? 3,
          prelim: null, midterm: null, finals: null, finalGrade: null, remarks: null,
          semester: 'Ongoing', school_year: ''
        };
      });

    const rows = [...gradedRows, ...pendingRows];
    
    return {
      allRows: rows,
      totalUnits: gradedRows.reduce((sum, r) => sum + (r.finalGrade !== null ? r.units : 0), 0),
      gwa: computeGWA(gradedRows),
      semesters: ['All', ...new Set(grades.map(g => g.semester))],
      schoolYears: ['All', ...new Set(grades.map(g => g.school_year))]
    };
  }, [grades, courses, schedules, student, selectedSemester, selectedYear]);

  if (isLoading) return <div className="p-8 text-center text-xs font-black uppercase tracking-[0.4em] text-[#FF7F11] animate-pulse">Syncing Academic Records...</div>;
  if (!student) return <div className="p-8 text-center text-gray-500 font-bold">Profile linking required.</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 px-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Academic Transcript</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Official performance record for CCS students</p>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
           <div className="px-4 py-2 bg-gray-900 rounded-2xl text-white">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">Overall GWA</p>
              <p className="text-2xl font-black text-[#FF7F11] leading-none mt-1">{gwa || '0.00'}</p>
           </div>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
        {[
          { label: 'Units Earned', value: totalUnits, icon: BookOpen, color: 'bg-blue-600' },
          { label: 'Term Rating', value: gwa || '—', icon: TrendingUp, color: 'bg-[#FF7F11]' },
          { label: 'Scholar Status', value: (parseFloat(gwa || '5') <= 1.5) ? 'Dean List' : 'Regular', icon: Award, color: 'bg-emerald-600' },
          { label: 'Current Load', value: schedules.filter(s => s.section === student.section).length, icon: GraduationCap, color: 'bg-indigo-600' }
        ].map((chip, i) => (
          <div key={i} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:border-[#FF7F11] transition-all">
             <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg", chip.color)}>
                <chip.icon className="w-5 h-5" />
             </div>
             <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{chip.label}</p>
                <p className="text-lg font-black text-gray-900">{chip.value}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 px-4 pb-4">
        <select value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-700 outline-none focus:ring-2 focus:ring-[#FF7F11]">
          {semesters.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-700 outline-none focus:ring-2 focus:ring-[#FF7F11]">
          {schoolYears.map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {/* Grouped Tables */}
      <div className="space-y-12 px-4">
        {(() => {
          const groups: Record<string, SubjectRow[]> = {};
          allRows.forEach(row => {
            const key = row.semester === 'Ongoing' ? 'Current Enrollment' : `${row.semester} | ${row.school_year}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(row);
          });

          return Object.entries(groups).map(([key, rows]) => {
            const termGwa = computeGWA(rows);
            return (
              <div key={key} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="bg-gray-900 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-[#FF7F11] rounded-full" />
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">{key}</h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1.5">Academic Progress Summary</p>
                    </div>
                  </div>
                  {termGwa && (
                    <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-right mb-1">Term GWA</p>
                      <p className="text-2xl font-black text-[#FF7F11] leading-none text-right tracking-tighter">{termGwa}</p>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="text-left py-4 px-8 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Course Description</th>
                        <th className="text-center py-4 px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Units</th>
                        <th className="text-center py-4 px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Prelim</th>
                        <th className="text-center py-4 px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Midterm</th>
                        <th className="text-center py-4 px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Finals</th>
                        <th className="text-center py-4 px-6 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Final Rating</th>
                        <th className="text-center py-4 px-8 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.map((row, idx) => {
                        const isPending = row.finalGrade === null && row.prelim === null;
                        return (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-6 px-8">
                              <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{row.code}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{row.name}</p>
                            </td>
                            <td className="py-6 px-4 text-center text-sm font-black text-gray-700">{row.units}</td>
                            <td className={cn("py-6 px-4 text-center text-sm font-black", gradeColor(row.prelim))}>{row.prelim?.toFixed(1) || '—'}</td>
                            <td className={cn("py-6 px-4 text-center text-sm font-black", gradeColor(row.midterm))}>{row.midterm?.toFixed(1) || '—'}</td>
                            <td className={cn("py-6 px-4 text-center text-sm font-black", gradeColor(row.finals))}>{row.finals?.toFixed(1) || '—'}</td>
                            <td className={cn("py-6 px-6 text-center text-xl font-black tracking-tighter", equivalentColor(getEquivalent(row.finalGrade)))}>
                              {isPending ? '—' : getEquivalent(row.finalGrade)}
                            </td>
                            <td className="py-6 px-8 text-center text-[10px] font-black uppercase tracking-widest">
                               <span className={remarksStyle(row.remarks)}>{row.remarks || (isPending ? 'PENDING' : '—')}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* Info Footnote */}
      <div className="mx-4 mt-8 p-6 bg-[#1a1a1a] rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 border-l-8 border-[#FF7F11]">
         <div className="flex items-center gap-4">
            <Info className="w-8 h-8 text-[#FF7F11]" />
            <div>
               <h4 className="text-sm font-black uppercase tracking-widest">Grading Policy Insight</h4>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Computations follow the standard CCS weighting: 30% Prelim, 30% Midterm, 40% Finals.</p>
            </div>
         </div>
         <button className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">Download PDF Record</button>
      </div>
    </div>
  );
}
