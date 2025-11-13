import { useState, useRef, useEffect } from "react";
import { Clock, Users, GripVertical, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Shift, Employee, Site } from "@/types/scheduling";

interface ResizableShiftProps {
  shift: Shift;
  employee: Employee;
  site?: Site;
  onTimeUpdate: (shiftId: string, startTime: string, endTime: string) => void;
  onRemoveEmployee?: (shiftId: string, employeeId: string) => void;
  style: React.CSSProperties;
  className?: string;
}

export const ResizableShift = ({
  shift,
  employee,
  site,
  onTimeUpdate,
  onRemoveEmployee,
  style,
  className = "",
}: ResizableShiftProps) => {
  const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null);
  const [tempTimes, setTempTimes] = useState({
    startTime: shift.startTime,
    endTime: shift.endTime
  });
  const shiftRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const handleMouseDown = (e: React.MouseEvent, edge: 'start' | 'end') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(edge);
    
    // Empêcher la sélection pendant le drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';
    
    const handleMouseMove = (e: MouseEvent) => {
      const parentContainer = shiftRef.current?.parentElement;
      if (!parentContainer) return;
      
      const containerRect = parentContainer.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;
      
      // Calculer la position en pourcentage
      const percentage = Math.max(0, Math.min(100, (mouseX / containerWidth) * 100));
      
      // Convertir en minutes (8h = 480min, 23h = 1380min, total = 900min)
      const totalMinutes = 15 * 60; // 15 heures de 8h à 23h
      const minutes = Math.round((percentage / 100) * totalMinutes);
      const actualMinutes = 480 + minutes; // 480 = 8h en minutes
      
      // Arrondir aux 15 minutes les plus proches
      const roundedMinutes = Math.round(actualMinutes / 15) * 15;
      const newTime = minutesToTime(roundedMinutes);
      
      if (edge === 'start') {
        const endMinutes = timeToMinutes(tempTimes.endTime);
        if (roundedMinutes < endMinutes && roundedMinutes >= 480) { // Pas avant 8h
          setTempTimes(prev => ({ ...prev, startTime: newTime }));
        }
      } else {
        const startMinutes = timeToMinutes(tempTimes.startTime);
        if (roundedMinutes > startMinutes && roundedMinutes <= 1380) { // Pas après 23h
          setTempTimes(prev => ({ ...prev, endTime: newTime }));
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      // Vérifier si les temps ont vraiment changé avant d'appeler onTimeUpdate
      if (tempTimes.startTime !== shift.startTime || tempTimes.endTime !== shift.endTime) {
        onTimeUpdate(shift.id, tempTimes.startTime, tempTimes.endTime);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Gestion du drag horizontal pour déplacer le shift
  const handleShiftMouseDown = (e: React.MouseEvent) => {
    if (isResizing) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    const startX = e.clientX;
    const startMinutes = timeToMinutes(shift.startTime);
    const duration = timeToMinutes(shift.endTime) - startMinutes;
    
    // Empêcher la sélection pendant le drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'move';
    
    const handleMouseMove = (e: MouseEvent) => {
      const parentContainer = shiftRef.current?.parentElement;
      if (!parentContainer) return;
      
      const deltaX = e.clientX - startX;
      const containerRect = parentContainer.getBoundingClientRect();
      const containerWidth = containerRect.width;
      
      // Convertir deltaX en minutes
      const totalMinutes = 15 * 60; // 15 heures
      const deltaMinutes = Math.round((deltaX / containerWidth) * totalMinutes / 15) * 15; // Snap 15min
      
      const newStartMinutes = Math.max(480, Math.min(1380 - duration, startMinutes + deltaMinutes));
      const newEndMinutes = newStartMinutes + duration;
      
      if (newEndMinutes <= 1380) { // Pas après 23h
        const newStartTime = minutesToTime(newStartMinutes);
        const newEndTime = minutesToTime(newEndMinutes);
        setTempTimes({ startTime: newStartTime, endTime: newEndTime });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      // Vérifier si les temps ont vraiment changé avant d'appeler onTimeUpdate
      if (tempTimes.startTime !== shift.startTime || tempTimes.endTime !== shift.endTime) {
        onTimeUpdate(shift.id, tempTimes.startTime, tempTimes.endTime);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Mettre à jour les temps temporaires quand le shift change
  useEffect(() => {
    setTempTimes({
      startTime: shift.startTime,
      endTime: shift.endTime
    });
  }, [shift.startTime, shift.endTime, shift.id]); // Ajouter shift.id pour forcer la mise à jour

  const displayStartTime = isResizing ? tempTimes.startTime : shift.startTime;
  const displayEndTime = isResizing ? tempTimes.endTime : shift.endTime;

  return (
    <div
      ref={shiftRef}
      className={`absolute rounded-md border-2 flex items-center justify-between px-2 transition-all no-select ${className} ${
        isResizing ? 'shadow-lg ring-2 ring-primary/50 cursor-ew-resize' : isDragging ? 'shadow-lg ring-2 ring-primary/50 cursor-move' : 'cursor-move hover:shadow-md'
      }`}
      style={style}
      onMouseDown={handleShiftMouseDown}
    >
        {/* Poignée de redimensionnement gauche */}
        <div
          className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-primary/30 flex items-center justify-center group z-10"
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        >
          <GripVertical className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex items-center gap-2 min-w-0 mx-4 flex-1">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-xs font-medium truncate">
              {employee.firstName} {employee.lastName}
            </span>
            
            {/* Bouton de suppression - à droite du nom */}
            {onRemoveEmployee && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveEmployee(shift.id, employee.id);
                }}
                className="flex-shrink-0 p-1 hover:bg-destructive/20 rounded-sm transition-colors ml-1"
                title="Retirer l'employé du shift"
              >
                <X className="h-3 w-3 text-destructive hover:text-destructive/80" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-xs font-mono opacity-75 flex-shrink-0">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span className="whitespace-nowrap">
              {displayStartTime.slice(0, 5)}-{displayEndTime.slice(0, 5)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {shift.status === 'CLOSED' && (
            <Badge variant="destructive" className="text-xs px-1 py-0">
              FERMÉ
            </Badge>
          )}
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span className="text-xs font-medium">
              {shift.assignments.length}/{shift.requirements.maxEmployees}
            </span>
          </div>
        </div>

        {/* Poignée de redimensionnement droite */}
        <div
          className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-primary/30 flex items-center justify-center group z-10"
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        >
          <GripVertical className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
        </div>
    </div>
  );
};