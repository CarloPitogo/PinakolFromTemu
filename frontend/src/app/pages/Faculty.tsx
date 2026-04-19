import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { 
  Search, 
  Mail, 
  Phone, 
  BookOpen, 
  UserCog, 
  Plus, 
  Edit, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { fetchWithAuth } from '../context/AuthContext';
import { Faculty as FacultyType } from '../types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";

export function Faculty() {
  const [searchTerm, setSearchTerm] = useState('');
  const [facultyData, setFacultyData] = useState<FacultyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyType | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    employeeNumber: '',
    department: 'College of Computer Studies',
    position: '',
    phone: '',
    status: 'Active',
    skills: '' // Temporary string for input
  });

  const fetchFaculty = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth('/faculty');
      if (response.ok) {
        const data = await response.json();
        setFacultyData(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to load faculty directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleOpenModal = (faculty: FacultyType | null = null) => {
    if (faculty) {
      setEditingFaculty(faculty);
      setFormData({
        firstName: faculty.firstName,
        lastName: faculty.lastName,
        email: faculty.email,
        employeeNumber: faculty.employeeNumber,
        department: 'College of Computer Studies',
        position: faculty.position,
        phone: faculty.phone,
        status: faculty.status,
        skills: faculty.specialization ? faculty.specialization.join(', ') : ''
      });
    } else {
      setEditingFaculty(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        employeeNumber: '',
        department: 'College of Computer Studies',
        position: '',
        phone: '',
        status: 'Active',
        skills: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingFaculty ? `/faculty/${editingFaculty.id}` : '/faculty';
    const method = editingFaculty ? 'PUT' : 'POST';

    // Prepare data: convert skills string to array for backend 'specialization' field
    const submitData = {
      ...formData,
      department: 'College of Computer Studies',
      specialization: formData.skills.split(',').map(s => s.trim()).filter(s => s.length > 0)
    };

    try {
      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        toast.success(editingFaculty ? 'Faculty updated successfully' : 'Faculty added successfully');
        setIsModalOpen(false);
        fetchFaculty();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this faculty member? This will also delete their login account.')) return;

    try {
      const response = await fetchWithAuth(`/faculty/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Faculty removed successfully');
        fetchFaculty();
      } else {
        toast.error('Failed to delete faculty');
      }
    } catch (error) {
      toast.error('An error occurred during deletion');
    }
  };

  const filteredFaculty = facultyData.filter(faculty =>
    faculty.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && facultyData.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#FF7F11] border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium tracking-widest text-xs uppercase italic">Synchronizing Faculty Directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF7F11] to-orange-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <UserCog className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-[#FF7F11] tracking-tight decoration-[#FF7F11]/20 underline underline-offset-8">
              Faculty Management
            </h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">
              Academic Personnel Resource Controller
            </p>
          </div>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenModal()} className="bg-[#FF7F11] hover:bg-orange-600 h-12 px-8 rounded-2xl shadow-lg hover:shadow-orange-200/50 transition-all group overflow-hidden relative">
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              <span className="font-bold uppercase tracking-widest text-xs">Add Faculty</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] rounded-[2rem] border-none shadow-2xl">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-gray-900 italic">
                {editingFaculty ? 'Modify Faculty Record' : 'Register New Faculty'}
              </DialogTitle>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Personnel Data Entry Terminal
              </p>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black text-gray-400 ml-1">First Name</Label>
                  <Input 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Enter first name" 
                    className="h-12 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF7F11]/20" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black text-gray-400 ml-1">Last Name</Label>
                  <Input 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Enter last name" 
                    className="h-12 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF7F11]/20" 
                    required 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black text-gray-400 ml-1">Email Address</Label>
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="faculty@college.edu" 
                    className="h-12 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF7F11]/20" 
                    required 
                  />
                </div>
                {editingFaculty ? (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-gray-400 ml-1">Faculty Skills (Comma-separated)</Label>
                    <Input 
                      value={formData.skills}
                      onChange={(e) => setFormData({...formData, skills: e.target.value})}
                      placeholder="React, PHP, UI/UX" 
                      className="h-12 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF7F11]/20" 
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-gray-400 ml-1">Employee Number</Label>
                    <Input 
                      value={formData.employeeNumber}
                      onChange={(e) => setFormData({...formData, employeeNumber: e.target.value})}
                      placeholder="FAC-2026-XXXX" 
                      className="h-12 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF7F11]/20" 
                      required 
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black text-gray-400 ml-1">Position / Title</Label>
                  <Input 
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    placeholder="e.g. Associate Professor" 
                    className="h-12 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF7F11]/20" 
                    required 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-black text-gray-400 ml-1">Status</Label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full h-12 bg-gray-50 border-none rounded-xl text-sm px-4 focus:ring-2 focus:ring-[#FF7F11]/20"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-1">
                  <Label className="text-[10px] uppercase font-black text-gray-400 ml-1">Phone</Label>
                  <Input 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+63 XXX XXX XXXX" 
                    className="h-12 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF7F11]/20" 
                  />
                </div>
                <div className="space-y-1.5 col-span-1 flex items-end">
                   <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl w-full flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#FF7F11]" />
                      <span className="text-[9px] font-black uppercase text-gray-500">Dept: CCS</span>
                   </div>
                </div>
              </div>

              {!editingFaculty && (
                <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-gray-400 ml-1">Faculty Skills (Comma-separated)</Label>
                    <Input 
                      value={formData.skills}
                      onChange={(e) => setFormData({...formData, skills: e.target.value})}
                      placeholder="React, PHP, Machine Learning, UI/UX" 
                      className="h-12 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#FF7F11]/20" 
                    />
                </div>
              )}

              <DialogFooter className="pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  <AlertCircle className="w-3 h-3 text-[#FF7F11]" />
                  Default Password: password123
                </div>
                <Button type="submit" className="bg-[#FF7F11] hover:bg-orange-600 h-12 px-10 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-orange-100">
                  {editingFaculty ? 'Update Record' : 'Save Faculty'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden group">
        <CardContent className="p-0">
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-[#FF7F11] transition-colors" />
            <Input
              placeholder="Search faculty by name, employee number, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-16 pl-14 border-none text-base focus:ring-0 bg-transparent placeholder:text-gray-300 font-medium"
            />
          </div>
        </CardContent>
      </Card>

      {/* Faculty Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredFaculty.map((faculty) => (
          <Card key={faculty.id} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[2rem] bg-white group overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${faculty.status === 'Active' ? 'bg-[#FF7F11]' : 'bg-gray-300'}`}></div>
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-[1.5rem] flex items-center justify-center text-[#FF7F11] font-black text-2xl shadow-inner border border-gray-100">
                    {faculty.firstName[0]}{faculty.lastName[0]}
                  </div>
                  <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-lg border-4 border-white flex items-center justify-center ${
                    faculty.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 group-hover:text-[#FF7F11] transition-colors">
                        {faculty.firstName} {faculty.lastName}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleOpenModal(faculty)}
                        className="h-9 w-9 border-gray-100 rounded-xl hover:bg-orange-50 hover:text-[#FF7F11] hover:border-orange-100 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => handleDelete(faculty.id)}
                        className="h-9 w-9 border-gray-100 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-6">
                     <Badge className="bg-gray-900/5 text-gray-600 border-none font-bold uppercase tracking-widest text-[8px] py-1 px-3">
                       {faculty.position}
                     </Badge>
                     <Badge className="bg-[#FF7F11]/10 text-[#FF7F11] border-none font-bold uppercase tracking-widest text-[8px] py-1 px-3">
                       {faculty.department}
                     </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <span className="truncate">{faculty.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <span>{faculty.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <span>{faculty.department}</span>
                    </div>
                  </div>

                  {/* Skills */}
                  {faculty.specialization && faculty.specialization.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-1.5">
                      <div className="w-full text-[9px] font-black uppercase text-orange-400 tracking-widest mb-1.5">Skills</div>
                      {faculty.specialization.map((spec) => (
                        <div key={spec} className="bg-gray-50 px-2.5 py-1 rounded-md text-[8px] font-black uppercase text-gray-400 tracking-tighter border border-gray-100/50">
                          {spec}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
