import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Filter, Eye, Edit, Calendar, Phone, Mail, MapPin, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InvitationPanel } from '@/components/InvitationPanel';
import { PendingInvitationsPanel } from '@/components/PendingInvitationsPanel';
import type { Employee, EmployeeStatus, Site, ContractType } from '@/types/scheduling';

interface StaffMember extends Omit<Employee, 'status'> {
  statusId: string;
  status?: EmployeeStatus;
  assignedSites?: Site[];
}

export const Staff = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<StaffMember[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedContractType, setSelectedContractType] = useState<string>('all');

  useEffect(() => {
    fetchStaffData();
  }, [user]);

  const fetchStaffData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch employees with transformations
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('first_name');

      if (employeesError) throw employeesError;

      // Fetch employee statuses with transformations
      const { data: statusesData, error: statusesError } = await supabase
        .from('employee_statuses')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('label');

      if (statusesError) throw statusesError;

      // Transform statuses
      const transformedStatuses: EmployeeStatus[] = statusesData.map(status => ({
        id: status.id,
        code: status.code,
        label: status.label,
        color: status.color,
        hoursLimits: typeof status.hours_limits === 'object' && status.hours_limits ?
          status.hours_limits as { weekly: number; monthly: number; yearly: number } :
          { weekly: 40, monthly: 160, yearly: 1920 },
        isStudent: status.is_student,
        createdAt: status.created_at,
        updatedAt: status.updated_at
      }));

      // Fetch sites with transformations
      const { data: sitesData, error: sitesError } = await supabase
        .from('sites')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('name');

      if (sitesError) throw sitesError;

      // Transform sites
      const transformedSites: Site[] = sitesData.map(site => ({
        id: site.id,
        name: site.name,
        code: site.code,
        address: site.address,
        capacity: site.capacity,
        active: site.active,
        managerId: site.manager_id,
        userId: site.user_id,
        contactInfo: typeof site.contact_info === 'object' && site.contact_info ?
          site.contact_info as Record<string, any> : {},
        openingHours: typeof site.opening_hours === 'object' && site.opening_hours ?
          site.opening_hours as Record<string, any> : {},
        createdAt: site.created_at,
        updatedAt: site.updated_at
      }));

      // Transform employees
      const transformedEmployees: StaffMember[] = employeesData.map(employee => {
        const status = transformedStatuses.find(s => s.id === employee.status_id);
        
        return {
          id: employee.id,
          employeeNumber: employee.employee_number,
          firstName: employee.first_name,
          lastName: employee.last_name,
          email: employee.email,
          phone: employee.phone,
          birthDate: employee.birth_date,
          contractType: employee.contract_type as ContractType,
          hourlyRate: employee.hourly_rate,
          weeklyHours: employee.weekly_hours,
          language: employee.language as 'FR' | 'NL' | 'EN',
          color: employee.color,
          active: employee.active,
          hireDate: employee.hire_date,
          experienceLevel: employee.experience_level,
          userId: employee.user_id,
          currentYear: employee.current_year,
          sickLeaveDays: employee.sick_leave_days,
          annualLeaveDays: employee.annual_leave_days,
          createdAt: employee.created_at,
          updatedAt: employee.updated_at,
          statusId: employee.status_id,
          photoUrl: employee.photo_url,
          status,
          assignedSites: [] // Will be populated separately if needed
        };
      });

      setEmployees(transformedEmployees);
      setEmployeeStatuses(transformedStatuses);
      setSites(transformedSites);

    } catch (error) {
      console.error('Error fetching staff data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du personnel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = searchTerm === '' || 
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || employee.statusId === selectedStatus;
    const matchesContractType = selectedContractType === 'all' || employee.contractType === selectedContractType;

    return matchesSearch && matchesStatus && matchesContractType;
  });

  // Group employees by status
  const employeesByStatus = employeeStatuses.reduce((acc, status) => {
    acc[status.id] = filteredEmployees.filter(emp => emp.statusId === status.id);
    return acc;
  }, {} as Record<string, StaffMember[]>);

  const getContractTypeColor = (contractType: string) => {
    switch (contractType) {
      case 'CDI': return 'bg-green-100 text-green-800';
      case 'CDD': return 'bg-blue-100 text-blue-800';
      case 'STUDENT': return 'bg-purple-100 text-purple-800';
      case 'INTERN': return 'bg-orange-100 text-orange-800';
      case 'FREELANCE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const EmployeeCard = ({ employee }: { employee: StaffMember }) => (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12" style={{ backgroundColor: employee.color || '#3B82F6' }}>
              <AvatarFallback className="text-white font-medium">
                {employee.firstName[0]}{employee.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {employee.firstName} {employee.lastName}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>#{employee.employeeNumber}</span>
                <Badge variant="outline" className={getContractTypeColor(employee.contractType)}>
                  {employee.contractType}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{employee.email}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{employee.phone}</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <span className="font-medium">Taux:</span>
            <span>{employee.hourlyRate}€/h</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Heures/sem:</span>
            <span>{employee.contractType === 'STUDENT' ? 'Variables' : `${employee.weeklyHours}h`}</span>
          </div>
          {employee.assignedSites && employee.assignedSites.length > 0 && (
            <div className="col-span-full">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Sites assignés:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {employee.assignedSites.map(site => (
                  <Badge key={site.id} variant="secondary" className="text-xs">
                    {site.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement du personnel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Personnel
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestion et vue d'ensemble de votre équipe
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {filteredEmployees.length} employé{filteredEmployees.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom, email, numéro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {employeeStatuses.map(status => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Type de contrat</label>
              <Select value={selectedContractType} onValueChange={setSelectedContractType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="CDI">CDI</SelectItem>
                  <SelectItem value="CDD">CDD</SelectItem>
                  <SelectItem value="STUDENT">Étudiant</SelectItem>
                  <SelectItem value="INTERN">Stagiaire</SelectItem>
                  <SelectItem value="FREELANCE">Freelance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="by-status">Par statut</TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Inviter
          </TabsTrigger>
          <TabsTrigger value="pending">En Attente</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredEmployees.map(employee => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>
          {filteredEmployees.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun employé trouvé</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="by-status" className="space-y-6">
          {employeeStatuses.map(status => {
            const statusEmployees = employeesByStatus[status.id] || [];
            if (statusEmployees.length === 0) return null;

            return (
              <Card key={status.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: status.color }}
                      />
                      {status.label}
                    </div>
                    <Badge variant="secondary">
                      {statusEmployees.length} employé{statusEmployees.length > 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                  {status.isStudent && (
                    <CardDescription>
                      Heures variables - Gestion flexible des plannings
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {statusEmployees.map(employee => (
                      <EmployeeCard key={employee.id} employee={employee} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <InvitationPanel />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <PendingInvitationsPanel onRefresh={fetchStaffData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};