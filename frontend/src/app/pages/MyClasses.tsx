import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Users, 
  BookOpen, 
  Search, 
  ChevronDown, 
  Save, 
  Loader2, 
  MapPin, 
  Clock,
  ArrowLeft
} from 'lucide-react';
import { fetchWithAuth } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router';
import { cn } from '../components/ui/utils';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  firstName: string;
  lastName: string;
  student_number: string;
  studentNumber: string;
  classification: string;
}

interface GradeRow {
  student: Student;
  prelim: number | string;
  midterm: number | string;
  finals: number | string;
  remarks: string;
  dirty?: boolean;
}

interface ClassData {
  courseCode: string;
  courseName: string;
  section: string;
  studentCount: number;
  day: string;
  timeStart: string;
  room: string;
  term?: string;
}

export function MyClasses() {
  const navigate = useNavigate();
  const location = useLocation();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [gradeRows, setGradeRows] = useState<GradeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'roster' | 'grades'>('roster');
  
  // Terminal Guard - READ ONLY for non-current sems
  const [selectedTerm, setSelectedTerm] = useState('');
  const [activeTermString, setActiveTermString] = useState('');

  useEffect(() => {
    // Determine Current Active Term based on Date
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    let sem = '1st Sem';
    if (month >= 1 && month <= 5) sem = '2nd Sem';
    else if (month >= 6 && month <= 7) sem = 'Summer';
    
    const termStr = `${sem} AY ${year}-${year + 1}`;
    setActiveTermString(termStr);
    setSelectedTerm(termStr);
  }, []);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const res = await fetchWithAuth('/faculty/classes');
        if (res.ok) {
          const data = await res.json();
          setClasses(data.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadClasses();
  }, []);

  // Sync with URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const section = params.get('section');
    const tab = params.get('tab') as 'roster' | 'grades';
    
    if (code && section && classes.length > 0) {
      const cls = classes.find(c => c.courseCode === code && c.section === section);
      if (cls) {
        setSelectedClass(cls);
        if (tab) setActiveTab(tab);
        loadGrades(cls);
      }
    }
  }, [location.search, classes]);

  const loadGrades = async (cls: ClassData) => {
    try {
      const res = await fetchWithAuth(`/grades/class?section=${cls.section}&course_code=${cls.courseCode}&semester=${selectedTerm}`);
      if (res.ok) {
        const data = await res.json();
        // Cross-reference with class roster
        const rosterRes = await fetchWithAuth(`/faculty/classes/${cls.courseCode}/${cls.section}/students`);
        const rosterData = await rosterRes.json();
        
        const rows = (rosterData.data || []).map((s: any) => {
          const g = (data.data || []).find((gr: any) => gr.student_id === s.id);
          return {
            student: {
              ...s,
              firstName: s.first_name,
              lastName: s.last_name,
              studentNumber: s.student_number
            },
            prelim: g?.prelim ?? '',
            midterm: g?.midterm ?? '',
            finals: g?.finals ?? '',
            remarks: g?.remarks ?? '',
            dirty: false
          };
        });
        setGradeRows(rows);
      }
    } catch (err) {
       console.error(err);
    }
  };

  const isReadOnly = selectedTerm !== activeTermString;

  const handleSelectClass = (cls: ClassData) => {
    setSelectedClass(cls);
    navigate(`?code=${cls.courseCode}&section=${cls.section}&tab=${activeTab}`);
  };

  const handleGradeChange = (studentId: number, field: 'prelim' | 'midterm' | 'finals', value: string) => {
    if (isReadOnly) return;
    setGradeRows(prev => prev.map(r => {
      if (r.student.id === studentId) {
        return { ...r, [field]: value, dirty: true };
      }
      return r;
    }));
  };

  const handleSaveAll = async () => {
    if (!selectedClass || isReadOnly) return;
    setIsSaving(true);
    try {
      const payload = {
        grades: gradeRows.filter(r => r.dirty).map(r => ({
          student_id: r.student.id,
          course_code: selectedClass.courseCode,
          section: selectedClass.section,
          prelim: r.prelim,
          midterm: r.midterm,
          finals: r.finals
        })),
        semester: selectedTerm
      };
      const res = await fetchWithAuth('/grades/bulk-upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setGradeRows(prev => prev.map(r => ({ ...r, dirty: false })));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveRow = async (row: GradeRow) => {
    if (!selectedClass || !row.dirty || isReadOnly) return;
    try {
      await fetchWithAuth('/grades/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: row.student.id,
          course_code: selectedClass.courseCode,
          section: selectedClass.section,
          prelim: row.prelim,
          midterm: row.midterm,
          finals: row.finals,
          semester: selectedTerm
        })
      });
      setGradeRows(prev => prev.map(r => r.student.id === row.student.id ? { ...r, dirty: false } : r));
    } catch (err) { console.error(err); }
  };

  const computeAvg = (p: any, m: any, f: any) => {
    const nums = [parseFloat(p), parseFloat(m), parseFloat(f)].filter(n => !isNaN(n));
    if (nums.length === 0) return null;
    if (nums.length === 3) return Math.round((nums[0] * 0.3 + nums[1] * 0.3 + nums[2] * 0.4));
    return Math.round(nums.reduce((a, b) => a + b) / nums.length);
  };

  const remarksColor = (r: string) => {
    if (r === 'PASSED') return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (r === 'FAILED') return 'text-red-600 bg-red-50 border-red-100';
    return 'text-gray-400 bg-gray-50 border-gray-100';
  };

  const termsList = useMemo(() => {
    return activeTermString ? [activeTermString] : [];
  }, [activeTermString]);

  const filteredClasses = classes.filter(c => 
    c.courseName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div className="p-8 text-center text-xs font-black uppercase tracking-[0.3em] text-[#FF7F11] animate-pulse">Syncing Class Inventory...</div>;

  if (selectedClass) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setSelectedClass(null); navigate('/classes'); }}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">{selectedClass.courseName}</h1>
              <p className="text-xs font-bold text-[#FF7F11] uppercase tracking-widest leading-none mt-1">{selectedClass.courseCode} · Section {selectedClass.section}</p>
            </div>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
            <button 
              onClick={() => { setActiveTab('roster'); navigate(`?code=${selectedClass.courseCode}&section=${selectedClass.section}&tab=roster`); }}
              className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'roster' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600")}
            >ROSTER</button>
            <button 
              onClick={() => { setActiveTab('grades'); navigate(`?code=${selectedClass.courseCode}&section=${selectedClass.section}&tab=grades`); }}
              className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'grades' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600")}
            >GRADES</button>
          </div>
        </div>

        {activeTab === 'roster' && (
          <Card className="border-none shadow-xl bg-white overflow-hidden rounded-[2rem]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left py-4 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Information</th>
                    <th className="text-center py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Year</th>
                    <th className="text-center py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {gradeRows.map(row => (
                    <tr key={row.student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-8">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-xs text-gray-600">
                             {row.student.firstName[0]}{row.student.lastName[0]}
                           </div>
                           <div>
                             <div className="flex items-center gap-2">
                               <p className="text-xs font-bold leading-none">{row.student.firstName} {row.student.lastName}</p>
                               {row.student.classification === 'Irregular' && (
                                 <span className="px-1 py-0.5 bg-amber-100 text-amber-700 text-[6px] font-black uppercase rounded border border-amber-200">IRREG</span>
                               )}
                             </div>
                             <p className="text-[9px] text-gray-400 font-bold leading-none mt-1">{row.student.studentNumber}</p>
                           </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-xs font-bold">1st Year</td>
                      <td className="py-4 px-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-full border border-emerald-100">Enrolled</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── TAB: Grades distribution is handled via the gradeRows state ── */}
        {activeTab === 'grades' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <select value={selectedTerm} onChange={e => { setSelectedTerm(e.target.value); }} className="bg-white border border-gray-200 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#FF7F11]">
                  {termsList.map(t => <option key={t}>{t}</option>)}
                </select>
                {isReadOnly && <span className="text-[8px] font-black bg-gray-100 text-gray-400 px-2 py-1 rounded uppercase tracking-widest border">Read Only Mode</span>}
              </div>
              {!isReadOnly && (
                <Button onClick={handleSaveAll} disabled={isSaving || !gradeRows.some(r => r.dirty)} className="bg-[#FF7F11] hover:bg-orange-600 rounded-xl px-4 h-9 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  {isSaving ? <Loader2 className="animate-spin w-3 h-3" /> : <Save className="w-3 h-3" />} SAVE ALL
                </Button>
              )}
            </div>

            <Card className="border-none shadow-xl bg-white overflow-hidden rounded-[2rem]">
               <div className="overflow-x-auto">
                 <table className="w-full">
                   <thead>
                     <tr className="bg-gray-50 border-b">
                       <th className="text-left py-4 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                       <th className="text-center py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">Prelim</th>
                       <th className="text-center py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">Midterm</th>
                       <th className="text-center py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">Finals</th>
                       <th className="text-center py-4 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-20">Avg</th>
                       <th className="text-center py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Remarks</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y">
                     {gradeRows.map(row => {
                        const avg = computeAvg(row.prelim, row.midterm, row.finals);
                        return (
                          <tr key={row.student.id} className={cn("hover:bg-gray-50/30 transition-colors", row.dirty && "bg-amber-50/50")}>
                            <td className="py-4 px-8">
                               <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold leading-none">{row.student.firstName} {row.student.lastName}</p>
                                  {row.student.classification === 'Irregular' && (
                                     <span className="px-1 py-0.5 bg-amber-100 text-amber-700 text-[6px] font-black uppercase rounded border border-amber-200">IRREG</span>
                                  )}
                               </div>
                            </td>
                            <td className="py-4 px-4">
                               <input type="number" value={row.prelim} disabled={isReadOnly} onChange={e => handleGradeChange(row.student.id, 'prelim', e.target.value)} onBlur={() => handleSaveRow(row)} 
                               className="w-full h-8 bg-gray-50 border-transparent text-center text-xs font-bold rounded-lg focus:bg-white focus:border-[#FF7F11] outline-none transition-all disabled:opacity-50" />
                            </td>
                            <td className="py-4 px-4">
                               <input type="number" value={row.midterm} disabled={isReadOnly || !row.prelim} onChange={e => handleGradeChange(row.student.id, 'midterm', e.target.value)} onBlur={() => handleSaveRow(row)}
                               className="w-full h-8 bg-gray-50 border-transparent text-center text-xs font-bold rounded-lg focus:bg-white focus:border-[#FF7F11] outline-none transition-all disabled:opacity-50" />
                            </td>
                            <td className="py-4 px-4">
                               <input type="number" value={row.finals} disabled={isReadOnly || !row.midterm} onChange={e => handleGradeChange(row.student.id, 'finals', e.target.value)} onBlur={() => handleSaveRow(row)}
                               className="w-full h-8 bg-gray-50 border-transparent text-center text-xs font-bold rounded-lg focus:bg-white focus:border-[#FF7F11] outline-none transition-all disabled:opacity-50" />
                            </td>
                            <td className="py-4 px-4 text-center text-xs font-black">{avg || '—'}</td>
                            <td className="py-4 px-6 text-center">
                               <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase border", remarksColor(avg ? (avg >= 75 ? 'PASSED' : 'FAILED') : ''))}>
                                 {avg ? (avg >= 75 ? 'PASSED' : 'FAILED') : '—'}
                               </span>
                            </td>
                          </tr>
                        );
                     })}
                   </tbody>
                 </table>
               </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg"><Users className="w-6 h-6 text-[#FF7F11]" /></div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Academic Classes</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage sections and grading rosters</p>
        </div>
      </div>
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Filter subjects..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white border-none shadow-xl rounded-[1.5rem] outline-none focus:ring-2 focus:ring-[#FF7F11] font-medium" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls, i) => (
          <Card key={i} className="group border-none shadow-lg hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden bg-white">
            <div className="bg-gray-900 p-6 text-white group-hover:bg-[#FF7F11] transition-all duration-500">
               <div className="flex justify-between items-start mb-6">
                  <div className="bg-white/10 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{cls.courseCode}</div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black"><Users className="w-3 h-3" /> {cls.studentCount}</div>
               </div>
               <h3 className="text-xl font-black uppercase tracking-tight leading-tight mb-1">{cls.courseName}</h3>
               <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Section {cls.section}</p>
            </div>
            <CardContent className="p-6">
               <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest"><Clock className="w-3.5 h-3.5 text-[#FF7F11]" /> {cls.day} · {cls.timeStart}</div>
                  <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest"><MapPin className="w-3.5 h-3.5 text-[#FF7F11]" /> Room {cls.room}</div>
               </div>
               <div className="flex gap-2">
                  <Button onClick={() => handleSelectClass(cls)} variant="outline" className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 border-gray-200">View Roster</Button>
                  <Button onClick={() => { handleSelectClass(cls); setActiveTab('grades'); }} className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase tracking-widest bg-gray-900 hover:bg-[#FF7F11] text-white">Enter Grades</Button>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
