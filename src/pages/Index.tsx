import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Search, Filter, Plus, Download, Users, Calendar, Clock, TrendingUp, LogOut } from "lucide-react";
import { EmployeeCard } from "@/components/EmployeeCard";
import { SiteSelector } from "@/components/SiteSelector";
import { PlanningCalendar } from "@/components/PlanningCalendar";
import { PlanningHourlyGrid } from "@/components/PlanningHourlyGrid";
import { PlanningLinearGrid } from "@/components/PlanningLinearGrid";
import { AppSidebar } from "@/components/AppSidebar";
import { AddEmployeeDialog } from "@/components/AddEmployeeDialog";
import { AuditLogDialog } from "@/components/AuditLogDialog";
import { InviteManagerDialog } from "@/components/InviteManagerDialog";
import { InviteEmployeeDialog } from "@/components/InviteEmployeeDialog";
import { EmployeeSelfInviteDialog } from "@/components/EmployeeSelfInviteDialog";
import { EmployeeProfileDialog } from "@/components/EmployeeProfileDialog";
import { LeaveStatusManager } from "@/components/LeaveStatusManager";
import { PlanningConceptsInfo } from "@/components/PlanningConceptsInfo";


import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { Employee, Shift } from "@/types/scheduling";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { signOut } = useAuth();
  const { 
    employees, 
    sites, 
    shifts, 
    employeeStatuses, 
    leaves,
    loading, 
    error, 
    addShift, 
    assignEmployeeToShift,
    removeEmployeeFromShift,
    addEmployeeToDraft,
    updateShiftTime,
    archiveEmployee,
    refreshData
  } = useSupabaseData();
  
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month' | 'hourly'>('week');
  const [showAllSites, setShowAllSites] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeProfile, setShowEmployeeProfile] = useState(false);
  const { toast } = useToast();

  const filteredEmployees = employees.filter(employee => 
    employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const employeeCounts = sites.reduce((acc, site) => {
    acc[site.id] = employees.filter(emp => emp.active).length;
    return acc;
  }, {} as { [key: string]: number });

  // Set default site when sites are loaded
  if (sites.length > 0 && !selectedSiteId) {
    setSelectedSiteId(sites[0].id);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployees(prev => 
      prev.includes(employee.id) 
        ? prev.filter(id => id !== employee.id)
        : [...prev, employee.id]
    );
  };

  const handleShiftCreate = async (date: string, startTime: string, employeeId?: string) => {
    if (employeeId) {
      // Si un employeeId est fourni, ajouter à un draft unique
      try {
        await addEmployeeToDraft(date, employeeId, startTime);
        const employee = employees.find(e => e.id === employeeId);
        toast({
          title: "Employé ajouté au planning",
          description: `${employee?.firstName} ${employee?.lastName} a été ajouté au draft du ${date}`,
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter l'employé au planning. Veuillez réessayer.",
          variant: "destructive"
        });
      }
    } else {
      // Créer un nouveau shift standard
      const newShift = {
        siteId: selectedSiteId,
        date,
        startTime,
        endTime: "17:00",
        requirements: {
          minEmployees: 1,
          maxEmployees: 3,
          requiredSkills: []
        },
        status: "OPEN" as const
      };
      
      try {
        await addShift(newShift);
        toast({
          title: "Shift créé",
          description: `Nouveau shift créé pour le ${date} à ${startTime}`,
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de créer le shift. Veuillez réessayer.",
          variant: "destructive"
        });
      }
    }
  };

  const handleShiftClick = (shift: Shift) => {
    toast({
      title: "Shift details",
      description: `Opening shift details for ${shift.date}`,
    });
  };

  const handleDropEmployee = async (shiftId: string, employee: Employee) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) return;
    
    const isAlreadyAssigned = shift.assignments.some(a => a.employeeId === employee.id);
    if (isAlreadyAssigned) {
      toast({
        title: "Déjà assigné",
        description: `${employee.firstName} ${employee.lastName} est déjà assigné à ce shift`,
      });
      return;
    }
    
    try {
      await assignEmployeeToShift(shiftId, employee.id);
      toast({
        title: "Employé assigné",
        description: `${employee.firstName} ${employee.lastName} a été assigné au shift`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'assigner l'employé. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const handleShiftTimeUpdate = async (shiftId: string, startTime: string, endTime: string) => {
    try {
      await supabase
        .from('shifts')
        .update({
          start_time: startTime,
          end_time: endTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', shiftId);

      // Rafraîchir les données pour mettre à jour l'affichage
      await refreshData();

      toast({
        title: "Shift mis à jour",
        description: `Horaires modifiés: ${startTime} - ${endTime}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les horaires. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveEmployee = async (shiftId: string, employeeId: string) => {
    try {
      await removeEmployeeFromShift(shiftId, employeeId);
      const employee = employees.find(e => e.id === employeeId);
      toast({
        title: "Employé retiré",
        description: `${employee?.firstName} ${employee?.lastName} a été retiré du shift`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de retirer l'employé. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const handleShiftExtraTimeUpdate = async (shiftId: string, extraMinutes: number) => {
    toast({
      title: "Extra time updated",
      description: `Extra time set to ${extraMinutes} minutes`,
    });
  };

  const todayStats = {
    totalShifts: shifts.filter(s => s.date === new Date().toISOString().split('T')[0]).length,
    assignedEmployees: new Set(shifts.flatMap(s => s.assignments.map(a => a.employeeId))).size,
    totalHours: shifts
      .filter(s => s.date === new Date().toISOString().split('T')[0])
      .reduce((total, shift) => {
        const start = new Date(`2000-01-01T${shift.startTime}`);
        const end = new Date(`2000-01-01T${shift.endTime}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + (hours * shift.assignments.length);
      }, 0),
    coverage: shifts.length > 0 ? Math.round((shifts.filter(s => s.assignments.length > 0).length / shifts.length) * 100) : 0
  };

  // Calculate actual monthly hours for an employee based on shifts
  const calculateMonthlyHours = (employeeId: string): number => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return shifts
      .filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate.getMonth() === currentMonth && 
               shiftDate.getFullYear() === currentYear &&
               shift.assignments.some(assignment => assignment.employeeId === employeeId);
      })
      .reduce((total, shift) => {
        const start = new Date(`2000-01-01T${shift.startTime}`);
        const end = new Date(`2000-01-01T${shift.endTime}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }, 0);
  };

  // Check if employee is available today (not on leave, not in exam period)
  const checkEmployeeAvailability = (employeeId: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if employee has approved leave today
    const hasLeaveToday = leaves.some(leave => 
      leave.employeeId === employeeId &&
      leave.status === 'APPROVED' &&
      leave.startDate <= today &&
      leave.endDate >= today
    );
    
    return !hasLeaveToday;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar
          currentSite={sites.find(s => s.id === selectedSiteId)}
          onSiteChange={setSelectedSiteId}
          sites={sites}
          selectedDate={currentDate}
          shifts={shifts.filter(s => s.siteId === selectedSiteId)}
          employees={employees}
          employeeStatuses={employeeStatuses}
          getEmployeeById={(id) => employees.find(e => e.id === id)}
          onSiteCreated={refreshData}
          userRole="ADMIN"
        />
        
        <main className="flex-1 ml-16">
          {/* Barre horizontale du site en haut */}
          <div className="sticky top-0 z-30 bg-background border-b">
            <div className="px-6 py-3">
              <SiteSelector 
                sites={sites}
                selectedSiteId={selectedSiteId}
                onSiteChange={setSelectedSiteId}
                employeeCounts={employeeCounts}
              />
            </div>
          </div>

          {/* Header avec les stats */}
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Staff Planning</h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-soft rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Shifts</p>
                    <p className="text-2xl font-bold">{todayStats.totalShifts}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-soft rounded-lg">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Staff</p>
                    <p className="text-2xl font-bold">{todayStats.assignedEmployees}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning-soft rounded-lg">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Hours</p>
                    <p className="text-2xl font-bold">{todayStats.totalHours}h</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-soft rounded-lg">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Coverage</p>
                    <p className="text-2xl font-bold">{todayStats.coverage}%</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Main Content - Planning agrandi */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              {/* Planning Calendar - Plus d'espace */}
              <div className="xl:col-span-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold">Planning</h2>
                    
                    {/* Bouton Linear et option multi-sites */}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="default"
                        size="sm"
                        disabled
                      >
                        Linear
                      </Button>
                      <Button 
                        variant={showAllSites ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowAllSites(!showAllSites)}
                      >
                        {showAllSites ? 'Site unique' : 'Tous les sites'}
                      </Button>
                    </div>

                    {/* Sélecteur de période */}
                    <div className="flex gap-1 border rounded-md">
                      <Button 
                        variant={calendarView === 'day' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCalendarView('day')}
                        className="rounded-r-none"
                      >
                        Jour
                      </Button>
                      <Button 
                        variant={calendarView === 'week' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCalendarView('week')}
                        className="rounded-none"
                      >
                        Semaine
                      </Button>
                      <Button 
                        variant={calendarView === 'month' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCalendarView('month')}
                        className="rounded-none"
                      >
                        Mois
                      </Button>
                      <Button 
                        variant={calendarView === 'hourly' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCalendarView('hourly')}
                        className="rounded-l-none"
                      >
                        Horaire
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <PlanningConceptsInfo />
                    <LeaveStatusManager 
                      employees={employees}
                      onLeaveStatusUpdate={refreshData}
                    />
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
                
                {calendarView === 'hourly' ? (
                  <PlanningHourlyGrid
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                    shifts={shifts.filter(s => s.siteId === selectedSiteId)}
                    employees={employees}
                    sites={sites}
                    onEmployeeHoursUpdate={(employeeId, date, startTime, endTime) => {
                      console.log('Employee hours update:', { employeeId, date, startTime, endTime });
                      // TODO: Implement employee hours update
                    }}
                    onEmployeeHoursRemove={(employeeId, date) => {
                      console.log('Employee hours remove:', { employeeId, date });
                      // TODO: Implement employee hours removal
                    }}
                  />
                ) : (calendarView === 'day' || calendarView === 'week') ? (
                  <PlanningLinearGrid
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                    shifts={shifts.filter(s => showAllSites ? true : s.siteId === selectedSiteId)}
                    employees={employees}
                    sites={sites}
                    selectedSiteId={selectedSiteId}
                    showAllSites={showAllSites}
                    view={calendarView as 'day' | 'week'}
                    onShiftCreate={handleShiftCreate}
                    onDropEmployee={handleDropEmployee}
                    onShiftTimeUpdate={updateShiftTime}
                    onRemoveEmployee={handleRemoveEmployee}
                  />
                ) : (
                  <PlanningCalendar
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                    shifts={shifts.filter(s => s.siteId === selectedSiteId)}
                    employees={employees}
                    sites={sites}
                    view={calendarView}
                    onViewChange={setCalendarView}
                    onShiftCreate={handleShiftCreate}
                    onShiftClick={handleShiftClick}
                    onDropEmployee={handleDropEmployee}
                    onShiftTimeUpdate={handleShiftTimeUpdate}
                    onShiftExtraTimeUpdate={handleShiftExtraTimeUpdate}
                    selectedEmployees={selectedEmployees}
                    onBulkAssign={async (shiftId, employeeIds) => {
                      for (const employeeId of employeeIds) {
                        const employee = employees.find(e => e.id === employeeId);
                        if (employee) {
                          await handleDropEmployee(shiftId, employee);
                        }
                      }
                      setSelectedEmployees([]); // Clear selection after bulk assign
                    }}
                  />
                )}
              </div>

              {/* Employee Sidebar - Plus compact */}
              <div className="xl:col-span-1">
                <div className="sticky top-32">
                  <Tabs defaultValue="employees" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="employees">Staff</TabsTrigger>
                      <TabsTrigger value="availability">Schedule</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="employees" className="space-y-4">
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input
                            placeholder="Search staff..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">All ({filteredEmployees.length})</Badge>
                          <Badge variant="outline" className="text-xs">
                            Students ({employeeStatuses.find(s => s.isStudent)?.id ? 
                              filteredEmployees.filter(e => e.status.isStudent).length : 0})
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Full-time ({filteredEmployees.filter(e => !e.status.isStudent).length})
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {filteredEmployees.map((employee) => (
                          <div key={employee.id} onClick={() => {
                            setSelectedEmployee(employee);
                            setShowEmployeeProfile(true);
                          }}>
                            <EmployeeCard
                              employee={employee}
                              isSelected={selectedEmployees.includes(employee.id)}
                              onSelect={handleEmployeeSelect}
                              monthlyHours={calculateMonthlyHours(employee.id)}
                              maxMonthlyHours={employee.status.hoursLimits.monthly}
                              isAvailableToday={checkEmployeeAvailability(employee.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="availability" className="space-y-4">
                      <Card className="p-4">
                        <h3 className="font-medium mb-3">Availability Overview</h3>
                         <div className="space-y-2 text-sm">
                           <div className="flex justify-between">
                             <span>Available Today</span>
                             <span className="text-available font-medium">{employees.filter(e => e.active).length}/{employees.length || 0}</span>
                           </div>
                           <div className="flex justify-between">
                             <span>On Leave</span>
                             <span className="text-warning font-medium">{leaves.filter(l => l.status === 'APPROVED').length}</span>
                           </div>
                           <div className="flex justify-between">
                             <span>Exam Period</span>
                             <span className="text-unavailable font-medium">{employees.filter(e => e.status.isStudent).length}</span>
                           </div>
                         </div>
                      </Card>
                      
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Manage Availability
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <EmployeeProfileDialog
        employee={selectedEmployee}
        open={showEmployeeProfile}
        onOpenChange={setShowEmployeeProfile}
        employeeStatuses={employeeStatuses}
        sites={sites}
        onEmployeeUpdated={refreshData}
      />
    </SidebarProvider>
  );
};

export default Index;