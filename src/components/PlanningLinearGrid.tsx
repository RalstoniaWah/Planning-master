import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { Shift, Employee, Site } from "@/types/scheduling";
import { ResizableShift } from "./ResizableShift";

interface PlanningLinearGridProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  shifts: Shift[];
  employees: Employee[];
  sites: Site[];
  selectedSiteId?: string;
  showAllSites?: boolean;
  view: 'day' | 'week';
  onShiftCreate: (date: string, startTime: string, employeeId?: string) => void;
  onDropEmployee: (shiftId: string, employee: Employee) => void;
  onShiftTimeUpdate?: (shiftId: string, startTime: string, endTime: string) => void;
  onRemoveEmployee?: (shiftId: string, employeeId: string) => void;
}

export const PlanningLinearGrid = ({
  currentDate,
  onDateChange,
  shifts,
  employees,
  sites,
  selectedSiteId,
  showAllSites = false,
  view,
  onShiftCreate,
  onDropEmployee,
  onShiftTimeUpdate = () => {},
  onRemoveEmployee = () => {},
}: PlanningLinearGridProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mettre à jour l'heure actuelle toutes les minutes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1);
    
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
    return shifts.filter(shift => shift.date === dateStr);
  };

  const getCurrentTimePosition = () => {
    const now = currentTime;
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    if (hours < 8 || hours >= 23) return null;
    
    const totalMinutes = (hours - 8) * 60 + minutes;
    const percentage = (totalMinutes / (15 * 60)) * 100; // 15 heures de 8h à 23h
    return Math.min(percentage, 100);
  };

  const handleDrop = (e: React.DragEvent, dateStr: string, timeSlot: string) => {
    e.preventDefault();
    const employeeData = e.dataTransfer.getData("employee");
    if (employeeData) {
      const employee = JSON.parse(employeeData);
      // Créer un nouveau shift ou trouver un shift existant
      const existingShift = shifts.find(s => s.date === dateStr && s.startTime === timeSlot);
      if (existingShift) {
        onDropEmployee(existingShift.id, employee);
      } else {
        // Créer un shift avec employeeId pour l'auto-assignment
        onShiftCreate(dateStr, timeSlot, employee.id);
      }
    }
  };

  const handleTimeSlotDrop = (e: React.DragEvent, dateStr: string, timeSlot: string) => {
    e.preventDefault();
    e.stopPropagation();
    const employeeData = e.dataTransfer.getData("employee");
    if (employeeData) {
      const employee = JSON.parse(employeeData);
      // Utiliser la nouvelle fonction pour ajouter à un draft unique
      if (onDropEmployee) {
        // Chercher un shift DRAFT existant pour cette date
        const draftShift = shifts.find(s => s.date === dateStr && s.status === 'DRAFT');
        if (draftShift) {
          onDropEmployee(draftShift.id, employee);
        } else {
          onShiftCreate(dateStr, timeSlot, employee.id);
        }
      }
    }
  };

  const getSiteById = (siteId: string) => sites.find(site => site.id === siteId);
  const getEmployeeById = (employeeId: string) => employees.find(emp => emp.id === employeeId);

  const previousPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    onDateChange(newDate);
  };

  const nextPeriod = () => {
    const newDate = new Date(currentDate);
    if (view === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    onDateChange(newDate);
  };

  const renderDayView = () => {
    const dayShifts = getShiftsForDate(currentDate);
    const currentTimePos = getCurrentTimePosition();
    const isToday = currentDate.toDateString() === new Date().toDateString();

    // Filtrer les sites selon la sélection
    const sitesToShow = showAllSites 
      ? sites 
      : selectedSiteId 
        ? sites.filter(site => site.id === selectedSiteId)
        : sites.slice(0, 1); // Par défaut, montrer seulement le premier site

    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const minutesToPosition = (minutes: number) => {
      const startMinutes = 8 * 60; // 8h00
      const endMinutes = 23 * 60; // 23h00
      const totalMinutes = endMinutes - startMinutes;
      return ((minutes - startMinutes) / totalMinutes) * 100;
    };

    return (
      <div className="relative bg-background shadow-soft rounded-lg overflow-hidden">
        {/* En-tête avec date */}
        <div className="bg-gradient-soft border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-foreground">
                {currentDate.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h3>
              <Badge variant="secondary" className="bg-primary-soft text-primary">
                <Users className="w-3 h-3 mr-1" />
                {sitesToShow.reduce((total, site) => {
                  const siteShifts = dayShifts.filter(shift => shift.siteId === site.id);
                  return total + siteShifts.reduce((acc, shift) => acc + shift.assignments.length, 0);
                }, 0)} employé{sitesToShow.reduce((total, site) => {
                  const siteShifts = dayShifts.filter(shift => shift.siteId === site.id);
                  return total + siteShifts.reduce((acc, shift) => acc + shift.assignments.length, 0);
                }, 0) > 1 ? 's' : ''} planifié{sitesToShow.reduce((total, site) => {
                  const siteShifts = dayShifts.filter(shift => shift.siteId === site.id);
                  return total + siteShifts.reduce((acc, shift) => acc + shift.assignments.length, 0);
                }, 0) > 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              8h00 - 23h00
            </div>
          </div>
        </div>

        {/* Grille des heures */}
        <div className="sticky top-0 bg-muted/50 border-b px-6 py-2 z-10">
          <div className="grid grid-cols-[240px_1fr] gap-4">
            <div className="text-sm font-medium text-muted-foreground">
              Sites & Employés
            </div>
            <div className="relative h-8">
              {timeSlots.map((time, index) => {
                const minutes = timeToMinutes(time);
                const position = minutesToPosition(minutes);
                return (
                  <div
                    key={time}
                    className="absolute top-0 h-full flex items-center"
                    style={{ left: `${position}%` }}
                  >
                    <div className="text-xs font-mono text-muted-foreground bg-background px-1 rounded border">
                      {time}
                    </div>
                  </div>
                );
              })}
              
              {/* Ligne de l'heure actuelle */}
              {isToday && currentTimePos !== null && (
                <div 
                  className="absolute top-0 bottom-0 w-px bg-primary z-20"
                  style={{ left: `${currentTimePos}%` }}
                >
                  <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full"></div>
                  <div className="absolute -top-8 -left-8 text-xs font-mono text-primary bg-primary-soft px-2 py-1 rounded shadow-soft">
                    {currentTime.toTimeString().slice(0, 5)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Zones de drop pour chaque heure */}
          <div className="absolute inset-0 ml-[256px] z-5">
            {timeSlots.map((time, index) => {
              const minutes = timeToMinutes(time);
              const nextMinutes = index < timeSlots.length - 1 ? timeToMinutes(timeSlots[index + 1]) : 23 * 60;
              const leftPosition = minutesToPosition(minutes);
              const rightPosition = minutesToPosition(nextMinutes);
              const width = rightPosition - leftPosition;
              
              return (
                <div
                  key={`drop-${time}`}
                  className="absolute top-0 bottom-0 hover:bg-primary/5 transition-colors border-l border-border/30 hover:border-primary/30"
                  style={{
                    left: `${leftPosition}%`,
                    width: `${width}%`,
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleTimeSlotDrop(e, currentDate.toISOString().split('T')[0], time)}
                  title={`Créer un shift à ${time}`}
                />
              );
            })}
          </div>

                  {/* Contenu principal */}
                  <div className="space-y-6 p-6">
                    {sitesToShow.map((site, siteIndex) => {
                      const siteShifts = dayShifts.filter(shift => shift.siteId === site.id && shift.status !== 'DRAFT');
                      
                      // Créer un mapping de tous les employés avec leurs shifts pour ce site
                      const employeeShiftMap = new Map<string, Shift[]>();
                      
                      siteShifts.forEach(shift => {
                        shift.assignments.forEach(assignment => {
                          const employeeId = assignment.employeeId;
                          if (!employeeShiftMap.has(employeeId)) {
                            employeeShiftMap.set(employeeId, []);
                          }
                          employeeShiftMap.get(employeeId)!.push(shift);
                        });
                      });

                      return (
                        <div key={site.id} className={`bg-card rounded-lg border shadow-soft ${siteIndex > 0 ? 'mt-8' : ''}`}>
                          {/* En-tête du site */}
                          <div className="bg-gradient-soft border-b px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full bg-accent"></div>
                                <h4 className="text-lg font-semibold text-foreground">
                                  {site.name}
                                </h4>
                                <Badge variant="outline" className="bg-accent-soft text-accent border-accent/20">
                                  OUVERT
                                </Badge>
                              </div>
                              <div className="text-sm font-medium text-muted-foreground">
                                08:00 - 23:00
                              </div>
                            </div>
                          </div>

                          {/* Lignes des employés */}
                          <div className="divide-y divide-border/50">
                            {Array.from(employeeShiftMap.entries()).map(([employeeId, empShifts]) => {
                              const employee = getEmployeeById(employeeId);
                              if (!employee) return null;

                              return (
                                <div key={employeeId} className="grid grid-cols-[240px_1fr] gap-4 py-3 px-6 hover:bg-muted/30 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-3 h-3 rounded-full border border-white shadow-sm"
                                      style={{ backgroundColor: employee.color }}
                                    />
                                    <div>
                                      <div className="font-medium text-sm text-foreground">
                                        {employee.firstName} {employee.lastName}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {employee.employeeNumber}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Zone des shifts */}
                                  <div className="relative h-10 flex items-center">
                                    {empShifts.map(shift => {
                                      const startMinutes = timeToMinutes(shift.startTime);
                                      const endMinutes = timeToMinutes(shift.endTime);
                                      const startPos = minutesToPosition(startMinutes);
                                      const endPos = minutesToPosition(endMinutes);
                                      const width = Math.max(endPos - startPos, 8);
                                      
                                      return (
                                        <ResizableShift
                                          key={`${shift.id}-${employee.id}`}
                                          shift={shift}
                                          employee={employee}
                                          site={site}
                                          onTimeUpdate={onShiftTimeUpdate}
                                          onRemoveEmployee={onRemoveEmployee}
                                          style={{
                                            left: `${startPos}%`,
                                            width: `${width}%`,
                                            position: 'absolute',
                                            height: '32px',
                                            top: '4px',
                                            zIndex: 10
                                          }}
                                          className="bg-primary text-primary-foreground rounded-md shadow-soft border-0 text-xs font-medium hover:shadow-medium transition-all"
                                        />
                                      );
                                    })}
                                    
                                    {/* Grille de fond pour les heures */}
                                    <div className="absolute inset-0 pointer-events-none">
                                      {timeSlots.map((time) => {
                                        const minutes = timeToMinutes(time);
                                        const position = minutesToPosition(minutes);
                                        return (
                                          <div
                                            key={time}
                                            className="absolute top-0 bottom-0 w-px bg-border/20"
                                            style={{ left: `${position}%` }}
                                          />
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            
                            {/* Message si aucun employé */}
                            {employeeShiftMap.size === 0 && (
                              <div className="grid grid-cols-[240px_1fr] gap-4 py-8 px-6 text-center">
                                <div></div>
                                <div className="text-muted-foreground text-sm">
                                  Aucun employé planifié pour ce site aujourd'hui
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    const currentTimePos = getCurrentTimePosition();

    // Filtrer les sites selon la sélection
    const sitesToShow = showAllSites 
      ? sites 
      : selectedSiteId 
        ? sites.filter(site => site.id === selectedSiteId)
        : sites.slice(0, 1);

    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const minutesToPosition = (minutes: number) => {
      const startMinutes = 8 * 60; // 8h00
      const endMinutes = 23 * 60; // 23h00
      const totalMinutes = endMinutes - startMinutes;
      return ((minutes - startMinutes) / totalMinutes) * 100;
    };

    return (
      <div className="relative bg-background shadow-soft rounded-lg overflow-hidden">
        {/* En-tête avec la semaine */}
        <div className="bg-gradient-soft border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-foreground">
                Semaine du {weekDays[0].toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long' 
                })} au {weekDays[6].toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h3>
              <Badge variant="secondary" className="bg-primary-soft text-primary">
                <Users className="w-3 h-3 mr-1" />
                {sitesToShow.reduce((total, site) => {
                  return total + weekDays.reduce((dayTotal, day) => {
                    const dayShifts = getShiftsForDate(day).filter(shift => shift.siteId === site.id);
                    return dayTotal + dayShifts.reduce((acc, shift) => acc + shift.assignments.length, 0);
                  }, 0);
                }, 0)} employé{sitesToShow.reduce((total, site) => {
                  return total + weekDays.reduce((dayTotal, day) => {
                    const dayShifts = getShiftsForDate(day).filter(shift => shift.siteId === site.id);
                    return dayTotal + dayShifts.reduce((acc, shift) => acc + shift.assignments.length, 0);
                  }, 0);
                }, 0) > 1 ? 's' : ''} planifié{sitesToShow.reduce((total, site) => {
                  return total + weekDays.reduce((dayTotal, day) => {
                    const dayShifts = getShiftsForDate(day).filter(shift => shift.siteId === site.id);
                    return dayTotal + dayShifts.reduce((acc, shift) => acc + shift.assignments.length, 0);
                  }, 0);
                }, 0) > 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              8h00 - 23h00
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {sitesToShow.map((site, siteIndex) => {
            // Grouper tous les employés qui ont des shifts cette semaine pour ce site
            const weekEmployeeShifts = employees.map(employee => {
              const employeeShifts = weekDays.map(day => {
                const dayShifts = getShiftsForDate(day).filter(shift => 
                  shift.assignments.some(a => a.employeeId === employee.id) &&
                  shift.siteId === site.id
                );
                return { day, shifts: dayShifts };
              }).filter(item => item.shifts.length > 0);
              
              return { employee, weekShifts: employeeShifts };
            }).filter(item => item.weekShifts.length > 0);

            return (
              <div key={site.id} className="bg-card rounded-lg border shadow-soft overflow-hidden">
                {/* En-tête du site */}
                <div className="bg-gradient-soft border-b px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-accent"></div>
                      <h4 className="text-lg font-semibold text-foreground">
                        {site.name}
                      </h4>
                      <Badge variant="outline" className="bg-accent-soft text-accent border-accent/20">
                        OUVERT
                      </Badge>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      08:00 - 23:00
                    </div>
                  </div>
                </div>

                <div className="bg-card">
                  <div className="grid grid-cols-[200px_repeat(7,1fr)] gap-0 border-b border-border/30">
                    {/* En-tête colonne employés */}
                    <div className="bg-muted/50 border-r border-border px-4 py-3">
                      <div className="text-sm font-semibold text-foreground">Employés</div>
                    </div>
                    
                    {/* En-têtes des jours */}
                    {weekDays.map((day, dayIndex) => {
                      const isToday = day.toDateString() === new Date().toDateString();
                      
                      return (
                        <div 
                          key={dayIndex} 
                          className={`px-3 py-3 text-center border-r border-border/30 last:border-r-0 ${
                            isToday ? 'bg-primary text-primary-foreground' : 'bg-muted/30'
                          }`}
                        >
                          <div className="text-xs font-medium">
                            {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                          </div>
                          <div className="text-sm font-bold mt-1">
                            {day.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Lignes des employés */}
                  <div className="divide-y divide-border/50">
                    {weekEmployeeShifts.map((item, employeeIndex) => {
                      const { employee, weekShifts } = item;
                      
                      return (
                        <div key={employee.id}>
                          <div className="grid grid-cols-[200px_repeat(7,1fr)] gap-0 min-h-[60px]">
                            {/* Colonne employé */}
                            <div className="bg-muted/20 border-r border-border/30 px-4 py-3 flex items-center">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-3 h-3 rounded-full border border-white shadow-sm"
                                  style={{ backgroundColor: employee.color }}
                                />
                                <div>
                                  <div className="font-medium text-sm text-foreground">
                                    {employee.firstName} {employee.lastName}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {employee.employeeNumber}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Colonnes des jours */}
                            {weekDays.map((day, dayIndex) => {
                              const isToday = day.toDateString() === new Date().toDateString();
                              const dayData = weekShifts.find(ws => ws.day.toDateString() === day.toDateString());
                              
                              return (
                                <div 
                                  key={dayIndex}
                                  className={`relative border-r border-border/30 last:border-r-0 p-2 hover:bg-muted/20 transition-colors min-h-[60px] ${
                                    isToday ? 'bg-primary/5' : ''
                                  }`}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => handleDrop(e, day.toISOString().split('T')[0], '09:00')}
                                >
                                  {/* Grille des heures en arrière-plan */}
                                  <div className="absolute inset-0 pointer-events-none">
                                    {timeSlots.map((time, index) => {
                                      const minutes = timeToMinutes(time);
                                      const position = minutesToPosition(minutes);
                                      return (
                                        <div
                                          key={time}
                                          className="absolute top-0 bottom-0 w-px bg-border/10"
                                          style={{ left: `${position}%` }}
                                        />
                                      );
                                    })}
                                  </div>

                                  {/* Zones de drop pour chaque heure */}
                                  <div className="absolute inset-0">
                                    {timeSlots.map((time, index) => {
                                      const minutes = timeToMinutes(time);
                                      const nextMinutes = index < timeSlots.length - 1 ? timeToMinutes(timeSlots[index + 1]) : 23 * 60;
                                      const leftPosition = minutesToPosition(minutes);
                                      const rightPosition = minutesToPosition(nextMinutes);
                                      const width = rightPosition - leftPosition;
                                      
                                      return (
                                        <div
                                          key={`drop-${time}`}
                                          className="absolute top-0 bottom-0 hover:bg-primary/5 transition-colors"
                                          style={{
                                            left: `${leftPosition}%`,
                                            width: `${width}%`,
                                          }}
                                          onDragOver={(e) => e.preventDefault()}
                                          onDrop={(e) => handleTimeSlotDrop(e, day.toISOString().split('T')[0], time)}
                                          title={`Créer un shift à ${time}`}
                                        />
                                      );
                                    })}
                                  </div>

                                  {/* Shifts de l'employé pour ce jour */}
                                  {dayData?.shifts.map((shift) => {
                                    const startMinutes = timeToMinutes(shift.startTime);
                                    const endMinutes = timeToMinutes(shift.endTime);
                                    const leftPosition = minutesToPosition(startMinutes);
                                    const rightPosition = minutesToPosition(endMinutes);
                                    const width = rightPosition - leftPosition;
                                    
                                    return (
                                      <ResizableShift
                                        key={`${shift.id}-${employee.id}-${day.toISOString()}`}
                                        shift={shift}
                                        employee={employee}
                                        site={site}
                                        onTimeUpdate={onShiftTimeUpdate}
                                        onRemoveEmployee={onRemoveEmployee}
                                        style={{
                                          left: `${Math.max(0, leftPosition)}%`,
                                          width: `${Math.min(100 - Math.max(0, leftPosition), Math.max(width, 8))}%`,
                                          position: 'absolute',
                                          height: '40px',
                                          top: '10px',
                                          zIndex: 10
                                        }}
                                        className="bg-primary text-primary-foreground rounded-md shadow-soft border-0 text-xs font-medium hover:shadow-medium transition-all"
                                      />
                                    );
                                  })}

                                  {/* Ligne de l'heure actuelle pour ce jour */}
                                  {isToday && currentTimePos !== null && (
                                    <div 
                                      className="absolute top-0 bottom-0 w-px bg-primary z-20 shadow-lg pointer-events-none"
                                      style={{ left: `${currentTimePos}%` }}
                                    >
                                      <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full"></div>
                                      <div className="absolute -top-8 -left-8 text-xs font-mono text-primary bg-primary-soft px-2 py-1 rounded shadow-soft">
                                        {currentTime.toTimeString().slice(0, 5)}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message si aucun employé pour ce site */}
                  {weekEmployeeShifts.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground text-sm border-t border-border/30">
                      Aucun employé planifié pour ce site cette semaine
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between p-4 border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={previousPeriod}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold w-80 text-center">
            {view === 'day' 
              ? currentDate.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })
              : `Semaine du ${getWeekDays()[0].toLocaleDateString('fr-FR')} au ${getWeekDays()[6].toLocaleDateString('fr-FR')}`
            }
          </h2>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(new Date())}
          >
            Aujourd'hui
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={nextPeriod}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {view === 'day' ? renderDayView() : renderWeekView()}
    </Card>
  );
};