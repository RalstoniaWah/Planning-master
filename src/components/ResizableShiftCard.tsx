import { useState, useRef, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, MapPin, Users, Plus, Minus, Lock, Edit2, Check, X, GraduationCap, AlertTriangle, XCircle } from 'lucide-react';
import { Shift, Employee, Site } from '@/types/scheduling';

interface ResizableShiftCardProps {
  shift: Shift;
  site?: Site;
  assignedEmployees: Employee[];
  onClick: () => void;
  onTimeUpdate: (shiftId: string, startTime: string, endTime: string) => void;
  onExtraTimeUpdate: (shiftId: string, extraMinutes: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onShiftStatusToggle: (shiftId: string, status: 'OPEN' | 'CLOSED') => void;
  isLocked?: boolean;
  isDefaultShift?: boolean;
  viewOptions?: {
    showEmployeeNames: boolean;
    showShiftRequirements: boolean;
    compactView: boolean;
  };
}

export const ResizableShiftCard = ({
  shift,
  site,
  assignedEmployees,
  onClick,
  onTimeUpdate,
  onShiftStatusToggle,
  onExtraTimeUpdate,
  onDragOver,
  onDrop,
  isLocked = false,
  isDefaultShift = false,
  viewOptions = {
    showEmployeeNames: true,
    showShiftRequirements: true,
    compactView: false
  }
}: ResizableShiftCardProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [extraMinutes, setExtraMinutes] = useState(0);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editTime, setEditTime] = useState({
    start: shift.startTime,
    end: shift.endTime
  });
  const cardRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditTime({
      start: shift.startTime,
      end: shift.endTime
    });
  }, [shift.startTime, shift.endTime]);

  const handleTimeSave = () => {
    onTimeUpdate(shift.id, editTime.start, editTime.end);
    setIsEditingTime(false);
  };

  const handleTimeCancel = () => {
    setEditTime({
      start: shift.startTime,
      end: shift.endTime
    });
    setIsEditingTime(false);
  };

  const handleExtraTimeChange = (minutes: number) => {
    const newMinutes = Math.max(0, Math.min(120, extraMinutes + minutes));
    setExtraMinutes(newMinutes);
    onExtraTimeUpdate(shift.id, newMinutes);
    
    // Calculer la nouvelle heure de fin
    const endTime = new Date(`2000-01-01T${shift.endTime}`);
    endTime.setMinutes(endTime.getMinutes() + minutes);
    const newEndTime = endTime.toTimeString().slice(0, 5);
    
    // Mettre à jour l'heure de fin du shift
    onTimeUpdate(shift.id, shift.startTime, newEndTime);
  };

  const calculateShiftDuration = () => {
    const start = new Date(`2000-01-01T${shift.startTime}`);
    const end = new Date(`2000-01-01T${shift.endTime}`);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60);
    return Math.max(60, duration + extraMinutes);
  };

  const cardHeight = Math.max(120, (calculateShiftDuration() / 60) * 80);
  
  const cardClassName = `cursor-pointer transition-all duration-200 hover:shadow-md relative group ${
    isLocked ? 'border-red-200 bg-red-50/50' : 
    isDefaultShift ? 'border-dashed border-muted-foreground/30 bg-muted/20' : 
    'hover:shadow-lg'
  } ${viewOptions.compactView ? 'min-h-[80px]' : 'min-h-[120px]'}`;

  return (
    <div ref={cardRef} className="relative">
      <div 
        className={cardClassName}
        style={{ height: `${cardHeight}px` }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onClick}
      >
        <div className={`p-3 h-full flex flex-col justify-between ${viewOptions.compactView ? 'space-y-1' : 'space-y-2'}`}>
          {/* En-tête avec site et statut */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isLocked && <Lock className="h-3 w-3 text-red-500" />}
              {isDefaultShift ? (
                <div className="flex items-center gap-1">
                  <Plus className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Shift ouvert</span>
                </div>
              ) : site ? (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium">{site.code}</span>
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <Badge 
                variant={isDefaultShift ? "outline" : shift.status === 'PUBLISHED' ? 'default' : shift.status === 'CLOSED' ? 'destructive' : 'outline'}
                className="text-xs"
              >
                {isDefaultShift ? 'OUVERT' : shift.status === 'CLOSED' ? 'FERMÉ' : 'OUVERT'}
              </Badge>
              {!isDefaultShift && !isLocked && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShiftStatusToggle(shift.id, shift.status === 'CLOSED' ? 'OPEN' : 'CLOSED');
                  }}
                  title={shift.status === 'CLOSED' ? 'Ouvrir le magasin' : 'Fermer le magasin'}
                >
                  <XCircle className={`h-3 w-3 ${shift.status === 'CLOSED' ? 'text-green-500' : 'text-red-500'}`} />
                </Button>
              )}
            </div>
          </div>

          {/* Heures du shift - toujours affichées */}
          <div className="flex items-center justify-between">
            {isEditingTime ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={editTime.start}
                  onChange={(e) => setEditTime(prev => ({ ...prev, start: e.target.value }))}
                  className="h-6 text-xs"
                  disabled={isLocked}
                />
                <span className="text-xs">-</span>
                <Input
                  type="time"
                  value={editTime.end}
                  onChange={(e) => setEditTime(prev => ({ ...prev, end: e.target.value }))}
                  className="h-6 text-xs"
                  disabled={isLocked}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={handleTimeSave}
                  disabled={isLocked}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={handleTimeCancel}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-mono">
                  {shift.startTime} - {shift.endTime}
                </span>
                {!isLocked && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTime(true);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Employés assignés */}
          {viewOptions.showEmployeeNames && !isDefaultShift && assignedEmployees.length > 0 && (
            <div className="space-y-1 flex-1">
              {assignedEmployees.slice(0, viewOptions.compactView ? 2 : 3).map((employee) => (
                <div key={employee.id} className="flex items-center gap-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: employee.color }}
                  />
                  <span className="text-xs truncate">
                    {employee.firstName} {employee.lastName}
                  </span>
                  {employee.status.isStudent && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      Étudiant
                    </Badge>
                  )}
                </div>
              ))}
              {assignedEmployees.length > (viewOptions.compactView ? 2 : 3) && (
                <span className="text-xs text-muted-foreground">
                  +{assignedEmployees.length - (viewOptions.compactView ? 2 : 3)} autres...
                </span>
              )}
            </div>
          )}
          
          {/* Message pour shift par défaut */}
          {isDefaultShift && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-sm font-medium mb-1">Magasin Ouvert</div>
                <span className="text-xs">Cliquez pour planifier ou glissez un employé</span>
              </div>
            </div>
          )}

          {/* Exigences du shift */}
          {viewOptions.showShiftRequirements && !isDefaultShift && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span>
                  {assignedEmployees.length}/{shift.requirements.maxEmployees}
                </span>
              </div>
              <div className="flex gap-1">
                {shift.requirements.minEmployees > assignedEmployees.length && (
                  <Badge variant="outline" className="text-xs px-1 py-0 text-orange-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Manque {shift.requirements.minEmployees - assignedEmployees.length}
                  </Badge>
                )}
                {isLocked && (
                  <Badge variant="outline" className="text-xs px-1 py-0 text-red-600">
                    <Lock className="h-3 w-3 mr-1" />
                    Verrouillé
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Zone de redimensionnement */}
        {!isLocked && !viewOptions.compactView && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-b from-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div 
              ref={resizeRef}
              className="absolute bottom-0 left-0 right-0 h-1 bg-primary cursor-row-resize flex items-center justify-center"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsResizing(true);
              }}
            >
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExtraTimeChange(-15);
                  }}
                >
                  <Minus className="h-2 w-2" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 text-white hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExtraTimeChange(15);
                  }}
                >
                  <Plus className="h-2 w-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};