import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArchiveRestore, Calendar, User, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Employee, EmployeeStatus } from "@/types/scheduling";

const EmployeeArchives = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [archivedEmployees, setArchivedEmployees] = useState<Employee[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchArchivedEmployees();
    fetchEmployeeStatuses();
  }, [user]);

  const fetchEmployeeStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_statuses')
        .select('*');

      if (error) throw error;

      const transformedStatuses: EmployeeStatus[] = data?.map(status => ({
        id: status.id,
        code: status.code,
        label: status.label,
        hoursLimits: status.hours_limits as { weekly: number; monthly: number; yearly: number; },
        isStudent: status.is_student,
        color: status.color
      })) || [];

      setEmployeeStatuses(transformedStatuses);
    } catch (error) {
      console.error('Error fetching employee statuses:', error);
    }
  };

  const fetchArchivedEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          employee_statuses (*)
        `)
        .eq('archived', true)
        .order('archived_at', { ascending: false });

      if (error) throw error;

      const transformedEmployees: Employee[] = data?.map(emp => ({
        id: emp.id,
        employeeNumber: emp.employee_number,
        firstName: emp.first_name,
        lastName: emp.last_name,
        email: emp.email,
        phone: emp.phone || '',
        birthDate: emp.birth_date,
        status: employeeStatuses.find(s => s.id === emp.status_id) || employeeStatuses[0],
        contractType: emp.contract_type as Employee['contractType'],
        hourlyRate: parseFloat(emp.hourly_rate?.toString() || '0') || 0,
        weeklyHours: emp.weekly_hours || 0,
        photoUrl: emp.photo_url,
        color: emp.color || '#3B82F6',
        active: emp.active,
        language: emp.language as 'FR' | 'NL' | 'EN',
        experience_level: emp.experience_level as 'NOUVEAU' | 'VETERANE' | 'MANAGER' || 'NOUVEAU',
        hire_date: emp.hire_date,
        annualLeaveDays: emp.annual_leave_days || 25,
        sickLeaveDays: emp.sick_leave_days || 10,
        currentYear: emp.current_year || new Date().getFullYear()
      })) || [];

      setArchivedEmployees(transformedEmployees);
    } catch (error) {
      console.error('Error fetching archived employees:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les employés archivés",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreEmployee = async (employeeId: string) => {
    try {
      const { error } = await supabase.rpc('restore_employee', {
        employee_id: employeeId
      });

      if (error) throw error;

      toast({
        title: "Employé restauré",
        description: "L'employé a été restauré avec succès",
      });

      // Retirer l'employé de la liste des archivés
      setArchivedEmployees(prev => prev.filter(emp => emp.id !== employeeId));
    } catch (error) {
      console.error('Error restoring employee:', error);
      toast({
        title: "Erreur",
        description: "Impossible de restaurer l'employé",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement des employés archivés...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ArchiveRestore className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Archives Employés</h1>
        </div>
        <Badge variant="outline" className="bg-muted">
          {archivedEmployees.length} employé{archivedEmployees.length > 1 ? 's' : ''} archivé{archivedEmployees.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {archivedEmployees.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <ArchiveRestore className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Aucun employé archivé
              </h3>
              <p className="text-sm text-muted-foreground">
                Les employés archivés apparaîtront ici
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {archivedEmployees.map((employee) => (
            <Card key={employee.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback 
                        style={{ backgroundColor: employee.color }}
                        className="text-white"
                      >
                        {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {employee.firstName} {employee.lastName}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        {employee.employeeNumber}
                      </div>
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    Archivé
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span>{employee.status?.label || 'Non défini'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span>Embauché le {new Date(employee.hire_date || '').toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Button 
                    onClick={() => handleRestoreEmployee(employee.id)}
                    className="w-full"
                    variant="outline"
                  >
                    <ArchiveRestore className="h-4 w-4 mr-2" />
                    Restaurer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeArchives;