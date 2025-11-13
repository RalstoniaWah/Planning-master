import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Clock, User, X, Search, Filter } from "lucide-react";
import { Shift, Employee, Site } from "@/types/scheduling";

interface EmployeeShiftHours {
  employeeId: string;
  startTime: string;
  endTime: string;
  shiftId?: string;
}

interface PlanningHourlyGridProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  shifts: Shift[];
  employees: Employee[];
  sites: Site[];
  onEmployeeHoursUpdate: (employeeId: string, date: string, startTime: string, endTime: string) => void;
  onEmployeeHoursRemove: (employeeId: string, date: string) => void;
}

const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const hour = 8 + i;
  return `${hour.toString().padStart(2, '0')}:00`;
});

export const PlanningHourlyGrid = ({
  currentDate,
  onDateChange,
  shifts,
  employees,
  sites,
  onEmployeeHoursUpdate,
  onEmployeeHoursRemove
}: PlanningHourlyGridProps) => {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [employeeHours, setEmployeeHours] = useState<Map<string, EmployeeShiftHours>>(new Map());
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>(employees);
  const [filterCriteria, setFilterCriteria] = useState({
    status: '',
    startTime: '',
    endTime: '',
    experienceLevel: '',
    search: ''
  });

  useEffect(() => {
    // Initialize employee hours from existing shifts
    const hours = new Map<string, EmployeeShiftHours>();
    const dateStr = currentDate.toISOString().split('T')[0];
    
    shifts
      .filter(shift => shift.date === dateStr)
      .forEach(shift => {
        shift.assignments.forEach(assignment => {
          const key = `${assignment.employeeId}-${dateStr}`;
          hours.set(key, {
            employeeId: assignment.employeeId,
            startTime: shift.startTime,
            endTime: shift.endTime,
            shiftId: shift.id
          });
        });
      });
    
    setEmployeeHours(hours);
  }, [shifts, currentDate]);

  useEffect(() => {
    // Filter employees based on criteria
    let filtered = employees;

    // Search filter
    if (filterCriteria.search) {
      const searchLower = filterCriteria.search.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.firstName.toLowerCase().includes(searchLower) ||
        emp.lastName.toLowerCase().includes(searchLower) ||
        emp.email.toLowerCase().includes(searchLower) ||
        emp.employeeNumber.toLowerCase().includes(searchLower)
      );
    }

    if (filterCriteria.status) {
      filtered = filtered.filter(emp => emp.status.id === filterCriteria.status);
    }

    if (filterCriteria.experienceLevel) {
      filtered = filtered.filter(emp => emp.experience_level === filterCriteria.experienceLevel);
    }

    if (filterCriteria.startTime && filterCriteria.endTime) {
      const dateStr = currentDate.toISOString().split('T')[0];
      filtered = filtered.filter(emp => {
        const key = `${emp.id}-${dateStr}`;
        const hours = employeeHours.get(key);
        if (!hours) return false;
        
        return hours.startTime >= filterCriteria.startTime && 
               hours.endTime <= filterCriteria.endTime;
      });
    }

    setFilteredEmployees(filtered);
  }, [employees, filterCriteria, employeeHours, currentDate]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const previousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const updateEmployeeHours = (employeeId: string, startTime: string, endTime: string) => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const key = `${employeeId}-${dateStr}`;
    
    setEmployeeHours(prev => {
      const newHours = new Map(prev);
      newHours.set(key, {
        employeeId,
        startTime,
        endTime
      });
      return newHours;
    });

    onEmployeeHoursUpdate(employeeId, dateStr, startTime, endTime);
  };

  const removeEmployeeHours = (employeeId: string) => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const key = `${employeeId}-${dateStr}`;
    
    setEmployeeHours(prev => {
      const newHours = new Map(prev);
      newHours.delete(key);
      return newHours;
    });

    onEmployeeHoursRemove(employeeId, dateStr);
  };

  const getEmployeeHours = (employeeId: string) => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const key = `${employeeId}-${dateStr}`;
    return employeeHours.get(key);
  };

  const renderTimeSlot = (time: string, employee: Employee) => {
    const hours = getEmployeeHours(employee.id);
    const isInShift = hours && time >= hours.startTime && time < hours.endTime;
    const isStartTime = hours && time === hours.startTime;
    const isEndTime = hours && hours.endTime && time === hours.endTime.split(':')[0] + ':00';

    return (
      <div
        key={`${employee.id}-${time}`}
        className={`
          h-8 border-r border-muted-foreground/20 relative
          ${isInShift ? 'bg-gradient-to-b from-transparent to-transparent' : ''}
          ${isStartTime ? 'border-l-2 border-l-primary' : ''}
          ${isEndTime ? 'border-r-2 border-r-primary' : ''}
        `}
        style={{
          backgroundColor: isInShift ? `${employee.color}40` : 'transparent'
        }}
      >
        {isStartTime && (
          <div className="absolute -top-1 -left-1 text-xs bg-primary text-primary-foreground px-1 rounded">
            {hours.startTime}
          </div>
        )}
        {isEndTime && (
          <div className="absolute -top-1 -right-1 text-xs bg-primary text-primary-foreground px-1 rounded">
            {hours.endTime}
          </div>
        )}
        {/* Grid vertical line */}
        <div className="absolute top-0 bottom-0 right-0 w-px bg-muted-foreground/10" />
      </div>
    );
  };

  const renderEmployee = (employee: Employee) => {
    const hours = getEmployeeHours(employee.id);
    const isSelected = selectedEmployees.includes(employee.id);

    return (
      <div key={employee.id} className="border-b border-muted-foreground/20">
        {/* Employee info row */}
        <div className="flex items-center h-12 border-r border-muted-foreground/20 bg-muted/50">
          <div className="flex items-center gap-2 px-3 min-w-[200px]">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleEmployeeSelection(employee.id)}
            />
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: employee.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {employee.firstName} {employee.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                {employee.status.label}
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {employee.experience_level}
            </Badge>
          </div>
          
          {/* Hours controls */}
          <div className="flex items-center gap-2 px-3 border-r border-muted-foreground/20">
            {hours ? (
              <div className="flex items-center gap-2">
                <div className="text-xs">
                  <Select 
                    value={hours.startTime} 
                    onValueChange={(time) => updateEmployeeHours(employee.id, time, hours.endTime)}
                  >
                    <SelectTrigger className="h-6 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-xs">-</span>
                <div className="text-xs">
                  <Select 
                    value={hours.endTime} 
                    onValueChange={(time) => updateEmployeeHours(employee.id, hours.startTime, time)}
                  >
                    <SelectTrigger className="h-6 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => removeEmployeeHours(employee.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Select onValueChange={(time) => updateEmployeeHours(employee.id, time, '17:00')}>
                  <SelectTrigger className="h-6 text-xs">
                    <SelectValue placeholder="Début" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Time grid row */}
        <div className="grid grid-cols-16 h-8">
          {TIME_SLOTS.map(time => renderTimeSlot(time, employee))}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={previousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {formatDate(currentDate)}
          </h2>
          <Button variant="ghost" size="sm" onClick={nextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={goToToday}
          className="absolute left-1/2 transform -translate-x-1/2"
        >
          Aujourd'hui
        </Button>
        
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-sm">Vue Horaire</span>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="mb-4 p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtres</span>
        </div>
        
        <div className="grid grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher employé..."
              value={filterCriteria.search}
              onChange={(e) => setFilterCriteria(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>

          <Select value={filterCriteria.status} onValueChange={(value) => setFilterCriteria(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les statuts</SelectItem>
              {Array.from(new Set(employees.map(emp => emp.status))).map(status => (
                <SelectItem key={status.id} value={status.id}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCriteria.experienceLevel} onValueChange={(value) => setFilterCriteria(prev => ({ ...prev, experienceLevel: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Niveau d'expérience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Tous les niveaux</SelectItem>
              <SelectItem value="NOUVEAU">Nouveau</SelectItem>
              <SelectItem value="VETERANE">Vétéran</SelectItem>
              <SelectItem value="MANAGER">Manager</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCriteria.startTime} onValueChange={(value) => setFilterCriteria(prev => ({ ...prev, startTime: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Heure de début" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les heures</SelectItem>
              {TIME_SLOTS.map(time => (
                <SelectItem key={time} value={time}>{time}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCriteria.endTime} onValueChange={(value) => setFilterCriteria(prev => ({ ...prev, endTime: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Heure de fin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Toutes les heures</SelectItem>
              {TIME_SLOTS.map(time => (
                <SelectItem key={time} value={time}>{time}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEmployees.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <Badge variant="secondary">
              <User className="h-3 w-3 mr-1" />
              {selectedEmployees.length} employé(s) sélectionné(s)
            </Badge>
          </div>
        )}
      </div>

      {/* Time header with horizontal grid lines */}
      <div className="border-b border-muted-foreground/20 mb-2 relative">
        <div className="flex">
          <div className="min-w-[200px] px-3 py-2 font-medium border-r border-muted-foreground/20">
            Employé
          </div>
          <div className="px-3 py-2 font-medium border-r border-muted-foreground/20">
            Heures
          </div>
          <div className="grid grid-cols-16 flex-1 relative">
            {TIME_SLOTS.map((time, index) => {
              const currentTime = new Date();
              const currentHour = currentTime.getHours();
              const timeHour = parseInt(time.split(':')[0]);
              const isCurrentHour = timeHour === currentHour && 
                currentTime.getDate() === currentDate.getDate() &&
                currentTime.getMonth() === currentDate.getMonth() &&
                currentTime.getFullYear() === currentDate.getFullYear();
              
              return (
                <div key={time} className={`text-center text-xs py-2 border-r border-muted-foreground/20 relative ${isCurrentHour ? 'bg-blue-50' : ''}`}>
                  <div className={`${isCurrentHour ? 'font-bold text-blue-600' : ''}`}>
                    {time}
                  </div>
                  {/* Horizontal grid line for each hour */}
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-muted-foreground/10" />
                  {/* Current time indicator */}
                  {isCurrentHour && (
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-500 z-10 transform -translate-x-1/2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Employee rows */}
      <div className="border border-muted-foreground/20 rounded-lg overflow-hidden">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map(renderEmployee)
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Aucun employé ne correspond aux critères de filtrage
          </div>
        )}
      </div>
    </Card>
  );
};