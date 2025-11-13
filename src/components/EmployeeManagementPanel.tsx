import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Users, Edit, MapPin, Phone, Mail, Calendar, Building } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Employee, Site, EmployeeStatus, ContractType } from '@/types/scheduling';

interface EmployeeManagementPanelProps {
  employees: Employee[];
  sites: Site[];
  employeeStatuses: EmployeeStatus[];
  onRefreshData: () => void;
}

interface EmployeeSiteAssignment {
  id: string;
  employee_id: string;
  site_id: string;
  assigned_at: string;
  is_active: boolean;
}

export const EmployeeManagementPanel = ({ 
  employees, 
  sites, 
  employeeStatuses, 
  onRefreshData 
}: EmployeeManagementPanelProps) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [employeeSiteAssignments, setEmployeeSiteAssignments] = useState<EmployeeSiteAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state for editing employee
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    statusId: '',
    contractType: 'CDI' as ContractType,
    hourlyRate: '',
    weeklyHours: '',
    language: 'FR' as 'FR' | 'NL' | 'EN',
    assignedSites: [] as string[]
  });

  // Fetch employee site assignments
  useEffect(() => {
    const fetchEmployeeSiteAssignments = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('employee_sites')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;
        setEmployeeSiteAssignments(data || []);
      } catch (error) {
        console.error('Error fetching employee site assignments:', error);
      }
    };

    fetchEmployeeSiteAssignments();
  }, [user]);

  const filteredEmployees = employees.filter(employee =>
    employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAssignedSites = (employeeId: string): Site[] => {
    const assignedSiteIds = employeeSiteAssignments
      .filter(assignment => assignment.employee_id === employeeId && assignment.is_active)
      .map(assignment => assignment.site_id);
    
    return sites.filter(site => assignedSiteIds.includes(site.id));
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditForm({
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || '',
      birthDate: employee.birthDate,
      statusId: employee.status.id,
      contractType: employee.contractType,
      hourlyRate: employee.hourlyRate.toString(),
      weeklyHours: employee.weeklyHours.toString(),
      language: employee.language,
      assignedSites: getAssignedSites(employee.id).map(site => site.id)
    });
    setShowEditDialog(true);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !user) return;

    setLoading(true);
    try {
      // Update employee data
      const { error: employeeError } = await supabase
        .from('employees')
        .update({
          first_name: editForm.firstName,
          last_name: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone || null,
          birth_date: editForm.birthDate,
          status_id: editForm.statusId,
          contract_type: editForm.contractType,
          hourly_rate: parseFloat(editForm.hourlyRate) || 0,
          weekly_hours: parseInt(editForm.weeklyHours) || 40,
          language: editForm.language,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEmployee.id);

      if (employeeError) throw employeeError;

      // Update site assignments
      // First, deactivate all current assignments
      await supabase
        .from('employee_sites')
        .update({ is_active: false })
        .eq('employee_id', selectedEmployee.id);

      // Then create new assignments
      if (editForm.assignedSites.length > 0) {
        const newAssignments = editForm.assignedSites.map(siteId => ({
          employee_id: selectedEmployee.id,
          site_id: siteId,
          assigned_by: user.id,
          is_active: true
        }));

        const { error: assignmentError } = await supabase
          .from('employee_sites')
          .upsert(newAssignments, { 
            onConflict: 'employee_id,site_id',
            ignoreDuplicates: false 
          });

        if (assignmentError) throw assignmentError;
      }

      toast.success('Employé mis à jour avec succès');
      setShowEditDialog(false);
      onRefreshData();
      
      // Refresh assignments
      const { data } = await supabase
        .from('employee_sites')
        .select('*')
        .eq('is_active', true);
      setEmployeeSiteAssignments(data || []);

    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Erreur lors de la mise à jour de l\'employé');
    } finally {
      setLoading(false);
    }
  };

  const handleSiteAssignmentChange = (siteId: string, checked: boolean) => {
    setEditForm(prev => ({
      ...prev,
      assignedSites: checked 
        ? [...prev.assignedSites, siteId]
        : prev.assignedSites.filter(id => id !== siteId)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Espace Employé</h2>
          <p className="text-muted-foreground">Gérez vos employés et leurs assignations aux sites</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredEmployees.length} employé{filteredEmployees.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Rechercher un employé..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => {
          const assignedSites = getAssignedSites(employee.id);
          
          return (
            <Card key={employee.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback style={{ backgroundColor: employee.color }}>
                        {employee.firstName[0]}{employee.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {employee.firstName} {employee.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        #{employee.employeeNumber}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditEmployee(employee)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{employee.email}</span>
                </div>
                
                {employee.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.contractType}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Sites assignés:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {assignedSites.length > 0 ? (
                      assignedSites.map(site => (
                        <Badge key={site.id} variant="secondary" className="text-xs">
                          {site.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">Aucun site assigné</span>
                    )}
                  </div>
                </div>
                
                <Badge 
                  variant="outline" 
                  style={{ backgroundColor: `${employee.status.color}20`, borderColor: employee.status.color }}
                  className="text-xs"
                >
                  {employee.status.label}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Employee Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Modifier l'employé: {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdateEmployee} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birthDate">Date de naissance</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={editForm.birthDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, birthDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="status">Statut</Label>
                <Select value={editForm.statusId} onValueChange={(value) => setEditForm(prev => ({ ...prev, statusId: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeStatuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="contractType">Type de contrat</Label>
                <Select value={editForm.contractType} onValueChange={(value) => setEditForm(prev => ({ ...prev, contractType: value as ContractType }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDI">CDI</SelectItem>
                    <SelectItem value="CDD">CDD</SelectItem>
                    <SelectItem value="STUDENT">Étudiant</SelectItem>
                    <SelectItem value="INTERN">Stagiaire</SelectItem>
                    <SelectItem value="FREELANCE">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hourlyRate">Taux horaire (€)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={editForm.hourlyRate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, hourlyRate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="weeklyHours">Heures/semaine</Label>
                <Input
                  id="weeklyHours"
                  type="number"
                  value={editForm.weeklyHours}
                  onChange={(e) => setEditForm(prev => ({ ...prev, weeklyHours: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="language">Langue</Label>
              <Select value={editForm.language} onValueChange={(value) => setEditForm(prev => ({ ...prev, language: value as 'FR' | 'NL' | 'EN' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FR">Français</SelectItem>
                  <SelectItem value="NL">Néerlandais</SelectItem>
                  <SelectItem value="EN">Anglais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Site Assignments */}
            <div className="space-y-3">
              <Label>Sites assignés</Label>
              <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto border rounded p-3">
                {sites.map((site) => (
                  <div key={site.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`site-${site.id}`}
                      checked={editForm.assignedSites.includes(site.id)}
                      onCheckedChange={(checked) => handleSiteAssignmentChange(site.id, checked as boolean)}
                    />
                    <label
                      htmlFor={`site-${site.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {site.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Mise à jour..." : "Mettre à jour"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};