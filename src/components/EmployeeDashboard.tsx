import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, FileText, Upload, Plus } from 'lucide-react';
import { EmployeeScheduleCalendar } from './EmployeeScheduleCalendar';
import { EmployeeAvailabilityDialog } from './EmployeeAvailabilityDialog';
import { EmployeeSickLeaveDialog } from './EmployeeSickLeaveDialog';
import { EmployeeExamPeriodDialog } from './EmployeeExamPeriodDialog';
import { supabase } from '@/integrations/supabase/client';
import type { Employee } from '@/types/scheduling';

interface EmployeeDashboardProps {
  employee: Employee | null;
}

export const EmployeeDashboard = ({ employee }: EmployeeDashboardProps) => {
  const { user } = useAuth();
  const [upcomingShifts, setUpcomingShifts] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [availabilityCount, setAvailabilityCount] = useState(0);

  useEffect(() => {
    if (employee) {
      loadEmployeeData();
    }
  }, [employee]);

  const loadEmployeeData = async () => {
    if (!employee) return;

    try {
      // Load upcoming shifts
      const { data: shifts } = await supabase
        .from('shifts')
        .select(`
          *,
          assignments!inner (
            id,
            employee_id,
            status
          ),
          sites (name)
        `)
        .eq('assignments.employee_id', employee.id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(5);

      setUpcomingShifts(shifts || []);

      // Load pending leaves
      const { data: leaves } = await supabase
        .from('employee_leaves')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('status', 'PENDING');

      setPendingLeaves(leaves || []);

      // Count availabilities for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);

      const { count } = await supabase
        .from('employee_availabilities')
        .select('*', { count: 'exact' })
        .eq('employee_id', employee.id)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);

      setAvailabilityCount(count || 0);

    } catch (error) {
      console.error('Error loading employee data:', error);
    }
  };

  if (!employee) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">Page en construction</p>
          <p className="text-muted-foreground mb-4">
            Cette fonctionnalité sera bientôt disponible.
          </p>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Revenir au menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold">
          Bonjour, {employee.firstName} {employee.lastName}
        </h1>
        <p className="text-muted-foreground mt-2">
          Bienvenue dans votre espace personnel
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Prochains shifts</p>
                <p className="text-2xl font-bold">{upcomingShifts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Disponibilités ce mois</p>
                <p className="text-2xl font-bold">{availabilityCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Congés en attente</p>
                <p className="text-2xl font-bold">{pendingLeaves.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Badge className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Statut</p>
                <p className="text-lg font-medium">{employee.status.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Actions Rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <EmployeeAvailabilityDialog 
              employee={employee}
              onAvailabilityAdded={loadEmployeeData}
            />
            <EmployeeSickLeaveDialog 
              employee={employee}
              onLeaveAdded={loadEmployeeData}
            />
            {employee.status.isStudent && (
              <EmployeeExamPeriodDialog 
                employee={employee}
                onExamPeriodAdded={loadEmployeeData}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Shifts */}
      {upcomingShifts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Prochains Shifts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingShifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {new Date(shift.date).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {shift.start_time} - {shift.end_time} • {shift.sites?.name}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {shift.assignments[0]?.status || 'ASSIGNED'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mon Planning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeScheduleCalendar employee={employee} />
        </CardContent>
      </Card>
    </div>
  );
};