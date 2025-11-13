import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Eye, EyeOff, Lock, Unlock, Users, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { Shift, Employee, Site } from "@/types/scheduling";
import { ResizableShiftCard } from "./ResizableShiftCard";
import { DayHoursSummaryCard } from "./DayHoursSummaryCard";
import { supabase } from "@/integrations/supabase/client";

interface PlanningCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  shifts: Shift[];
  employees: Employee[];
  sites: Site[];
  view: 'day' | 'week' | 'month';
  onViewChange: (view: 'day' | 'week' | 'month') => void;
  onShiftCreate: (date: string, startTime: string) => void;
  onShiftClick: (shift: Shift) => void;
  onDropEmployee: (shiftId: string, employee: Employee) => void;
  onShiftTimeUpdate: (shiftId: string, startTime: string, endTime: string) => void;
  onShiftExtraTimeUpdate: (shiftId: string, extraMinutes: number) => void;
  selectedEmployees?: string[];
  onBulkAssign?: (shiftId: string, employeeIds: string[]) => void;
}

export const PlanningCalendar = ({
  currentDate,
  onDateChange,
  shifts,
  employees,
  sites,
  view,
  onViewChange,
  onShiftCreate,
  onShiftClick,
  onDropEmployee,
  onShiftTimeUpdate,
  onShiftExtraTimeUpdate,
  selectedEmployees = [],
  onBulkAssign,
}: PlanningCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null);
  const [viewOptions, setViewOptions] = useState({
    showEmployeeNames: true,
    showShiftRequirements: true,
    compactView: false
  });
  const [lockedShifts, setLockedShifts] = useState<Set<string>>(new Set());
  const [showViewOptions, setShowViewOptions] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const existingShifts = shifts.filter(shift => shift.date === dateStr);
    
    // S'il n'y a pas de shifts, créer un seul shift par défaut ouvert
    if (existingShifts.length === 0) {
      const defaultShift: Shift = {
        id: `default-${dateStr}`,
        siteId: '', // Will be set by parent component
        date: dateStr,
        startTime: '09:00',
        endTime: '17:00',
        requirements: { minEmployees: 1, maxEmployees: 5 },
        status: 'OPEN',
        assignments: []
      };
      return [defaultShift];
    }
    
    // Retourner seulement les shifts existants
    return existingShifts;
  };

  const getSiteById = (siteId: string) => {
    return sites.find(site => site.id === siteId);
  };

  const getEmployeeById = (employeeId: string) => {
    return employees.find(emp => emp.id === employeeId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, shiftId: string) => {
    e.preventDefault();
    
    if (lockedShifts.has(shiftId)) {
      return; // Ne pas permettre le drop sur un shift verrouillé
    }

    // Si c'est un shift par défaut, créer un vrai shift d'abord
    if (shiftId.startsWith('default-')) {
      const dateStr = shiftId.replace('default-', '');
      onShiftCreate(dateStr, '09:00');
      return;
    }

    const employeeData = e.dataTransfer.getData("employee");
    if (employeeData) {
      const employee = JSON.parse(employeeData);
      onDropEmployee(shiftId, employee);
    }

    // Gestion du drop multiple pour les employés sélectionnés
    if (selectedEmployees.length > 0 && onBulkAssign) {
      onBulkAssign(shiftId, selectedEmployees);
    }
  };

  const toggleShiftLock = (shiftId: string) => {
    setLockedShifts(prev => {
      const newLocked = new Set(prev);
      if (newLocked.has(shiftId)) {
        newLocked.delete(shiftId);
      } else {
        newLocked.add(shiftId);
      }
      return newLocked;
    });
  };

  const previousPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    onDateChange(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    onDateChange(newDate);
  };

  const renderShift = (shift: Shift) => {
    const site = getSiteById(shift.siteId);
    const assignedEmployees = shift.assignments.map(a => getEmployeeById(a.employeeId)).filter(Boolean) as Employee[];
    const isLocked = lockedShifts.has(shift.id);
    const isDefaultShift = shift.id.startsWith('default-');
    
    // Si le shift est fermé, afficher simplement "magasin fermé"
    if (shift.status === 'CLOSED') {
      return (
        <div key={shift.id} className="relative group">
          <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-center">
            <div className="text-sm font-medium text-red-700">
              Magasin Fermé
            </div>
            <div className="text-xs text-red-600 mt-1">
              {shift.date}
            </div>
            {!isLocked && (
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 h-6 text-xs text-red-600 hover:bg-red-100"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement reopening shift
                  console.log('Reopening shift:', shift.id);
                }}
              >
                Rouvrir
              </Button>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div key={shift.id} className="relative group">
        <ResizableShiftCard
          shift={shift}
          site={site}
          assignedEmployees={assignedEmployees}
          onClick={() => {
            if (isDefaultShift) {
              // Créer un vrai shift en cliquant sur un shift par défaut
              const dateStr = shift.id.replace('default-', '');
              onShiftCreate(dateStr, shift.startTime);
            } else {
              // Ne plus ouvrir de popup pour les détails
              console.log('Shift clicked:', shift.id);
            }
          }}
          onTimeUpdate={onShiftTimeUpdate}
          onExtraTimeUpdate={onShiftExtraTimeUpdate}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, shift.id)}
          isLocked={isLocked}
          viewOptions={viewOptions}
          onShiftStatusToggle={async (shiftId, status) => {
            try {
              const { error } = await supabase
                .from('shifts')
                .update({ status: status })
                .eq('id', shiftId);
              
              if (error) throw error;
              
              // Rafraîchir les données
              window.location.reload();
            } catch (error) {
              console.error('Error updating shift status:', error);
            }
          }}
          isDefaultShift={isDefaultShift}
        />
        
        {/* Bouton de verrouillage - masqué pour les shifts par défaut */}
        {!isDefaultShift && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
            onClick={() => toggleShiftLock(shift.id)}
          >
            {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          </Button>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    
    return (
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day, index) => {
          const dayShifts = getShiftsForDate(day);
          const isToday = day.toDateString() === new Date().toDateString();
          const isSelected = day.toDateString() === selectedDate.toDateString();
          
          return (
            <div key={index} className="min-h-[500px]">{/* Augmenter la hauteur */}
              <div 
                className={`text-center p-2 mb-2 rounded-lg cursor-pointer transition-colors ${
                  isToday ? 'bg-primary text-primary-foreground' : 
                  isSelected ? 'bg-secondary text-secondary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={() => setSelectedDate(day)}
              >
                <div className="text-xs opacity-75">
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className="font-medium">
                  {day.getDate()}
                </div>
              </div>
              
              <div className="space-y-3">
                {dayShifts.map(renderShift)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const ViewOptionsPanel = () => (
    <Card className="p-3 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Options d'affichage
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="showNames"
            checked={viewOptions.showEmployeeNames}
            onCheckedChange={(checked) => 
              setViewOptions(prev => ({ ...prev, showEmployeeNames: !!checked }))
            }
          />
          <label htmlFor="showNames" className="text-xs">Noms employés</label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="showRequirements"
            checked={viewOptions.showShiftRequirements}
            onCheckedChange={(checked) => 
              setViewOptions(prev => ({ ...prev, showShiftRequirements: !!checked }))
            }
          />
          <label htmlFor="showRequirements" className="text-xs">Exigences</label>
        </div>
        
        <div className="flex items-center space-x-2 col-span-2">
          <Checkbox 
            id="compactView"
            checked={viewOptions.compactView}
            onCheckedChange={(checked) => 
              setViewOptions(prev => ({ ...prev, compactView: !!checked }))
            }
          />
          <label htmlFor="compactView" className="text-xs">Vue compacte</label>
        </div>
      </div>
      
      {selectedEmployees.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <Badge variant="secondary" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            {selectedEmployees.length} employé(s) sélectionné(s)
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">
            Glissez sur un shift pour assigner en masse
          </p>
        </div>
      )}
    </Card>
  );

  const goToToday = () => {
    onDateChange(new Date());
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={previousPeriod}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold">
            {formatDate(currentDate)}
          </h2>
          <Button variant="ghost" size="sm" onClick={nextPeriod}>
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
        
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as const).map((v) => (
            <Button
              key={v}
              variant={view === v ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      
      {view === 'week' && renderWeekView()}
      
      {view === 'day' && (
        <div className="space-y-4">
          {getShiftsForDate(currentDate).map(renderShift)}
        </div>
      )}

      {/* Options d'affichage masquées en bas */}
      <div className="mt-6 pt-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowViewOptions(!showViewOptions)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Options d'affichage
          {showViewOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {showViewOptions && (
          <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="showNames"
                checked={viewOptions.showEmployeeNames}
                onCheckedChange={(checked) => 
                  setViewOptions(prev => ({ ...prev, showEmployeeNames: !!checked }))
                }
              />
              <label htmlFor="showNames" className="text-xs">Noms employés</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="showRequirements"
                checked={viewOptions.showShiftRequirements}
                onCheckedChange={(checked) => 
                  setViewOptions(prev => ({ ...prev, showShiftRequirements: !!checked }))
                }
              />
              <label htmlFor="showRequirements" className="text-xs">Exigences</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="compactView"
                checked={viewOptions.compactView}
                onCheckedChange={(checked) => 
                  setViewOptions(prev => ({ ...prev, compactView: !!checked }))
                }
              />
              <label htmlFor="compactView" className="text-xs">Vue compacte</label>
            </div>

            {selectedEmployees.length > 0 && (
              <div className="col-span-3 mt-2 pt-2 border-t">
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {selectedEmployees.length} employé(s) sélectionné(s)
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Glissez sur un shift pour assigner en masse
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};