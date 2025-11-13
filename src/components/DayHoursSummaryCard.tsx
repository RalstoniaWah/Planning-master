import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, AlertTriangle } from 'lucide-react';
import { Shift, Employee } from '@/types/scheduling';

interface DayHoursSummaryCardProps {
  selectedDate: Date;
  shifts: Shift[];
  employees: Employee[];
  getEmployeeById: (id: string) => Employee | undefined;
}

export const DayHoursSummaryCard = ({
  selectedDate,
  shifts,
  employees,
  getEmployeeById,
}: DayHoursSummaryCardProps) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const calculateShiftHours = (shift: Shift) => {
    const start = new Date(`2000-01-01T${shift.startTime}`);
    const end = new Date(`2000-01-01T${shift.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return hours;
  };

  const calculateEmployeeHours = () => {
    const employeeHours: Record<string, number> = {};
    
    shifts.forEach(shift => {
      const shiftHours = calculateShiftHours(shift);
      shift.assignments.forEach(assignment => {
        if (!employeeHours[assignment.employeeId]) {
          employeeHours[assignment.employeeId] = 0;
        }
        employeeHours[assignment.employeeId] += shiftHours;
      });
    });

    return employeeHours;
  };

  const employeeHours = calculateEmployeeHours();
  const totalHours = Object.values(employeeHours).reduce((sum, hours) => sum + hours, 0);
  const totalEmployeesScheduled = Object.keys(employeeHours).length;

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Résumé du jour
        </CardTitle>
        <p className="text-sm text-muted-foreground">{formatDate(selectedDate)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overview stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-primary/5 rounded-lg">
            <div className="text-2xl font-bold text-primary">{totalHours.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Heures totales</div>
          </div>
          <div className="text-center p-3 bg-secondary/5 rounded-lg">
            <div className="text-2xl font-bold text-secondary-foreground">{totalEmployeesScheduled}</div>
            <div className="text-xs text-muted-foreground">Employés planifiés</div>
          </div>
        </div>

        {/* Shifts summary */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Shifts du jour ({shifts.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {shifts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun shift planifié
              </p>
            ) : (
              shifts.map(shift => (
                <div key={shift.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{shift.startTime} - {shift.endTime}</div>
                    <div className="text-xs text-muted-foreground">
                      {shift.assignments.length} employé(s)
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {calculateShiftHours(shift).toFixed(1)}h
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Employee hours breakdown */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Heures par employé
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Object.entries(employeeHours).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun employé planifié
              </p>
            ) : (
              Object.entries(employeeHours).map(([employeeId, hours]) => {
                const employee = getEmployeeById(employeeId);
                const isOvertime = hours > 8;
                
                return (
                  <div key={employeeId} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: employee?.color }}
                      />
                      <span className="text-sm font-medium">
                        {employee?.firstName} {employee?.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant={isOvertime ? "destructive" : "outline"} 
                        className="text-xs"
                      >
                        {hours.toFixed(1)}h
                      </Badge>
                      {isOvertime && (
                        <AlertTriangle className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Overtime warning */}
        {Object.entries(employeeHours).some(([_, hours]) => hours > 8) && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Attention</span>
            </div>
            <p className="text-xs text-destructive/80 mt-1">
              Certains employés dépassent 8h de travail
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};