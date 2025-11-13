import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Calendar, Clock, CheckCircle, XCircle, AlertCircle, FileText, Download } from 'lucide-react';
import { format, differenceInDays, isAfter, isBefore, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Employee } from '@/types/scheduling';

interface LeaveRequest {
  id: string;
  employeeId: string;
  employee: Employee;
  type: 'VACATION' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY';
  startDate: string;
  endDate: string;
  daysCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason?: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

interface SickLeaveRequest {
  id: string;
  employeeId: string;
  employee: Employee;
  startDate: string;
  endDate: string;
  reason?: string;
  medicalCertificate?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  severity: 'LIGHT' | 'MODERATE' | 'SEVERE' | 'EMERGENCY';
  doctorContact?: string;
  returnToWorkDate?: string;
  createdAt: string;
}

interface LeaveStatusManagerProps {
  employees: Employee[];
  onLeaveStatusUpdate: () => void;
}

export const LeaveStatusManager = ({ employees, onLeaveStatusUpdate }: LeaveStatusManagerProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [sickLeaves, setSickLeaves] = useState<SickLeaveRequest[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (open) {
      fetchLeaveRequests();
      fetchSickLeaves();
    }
  }, [open]);

  const fetchLeaveRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_leaves')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch employee details separately
      const employeeIds = [...new Set(data?.map(leave => leave.employee_id) || [])];
      const { data: employeesData } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, phone, employee_number')
        .in('id', employeeIds);

      const employeesMap = new Map(employeesData?.map(emp => [emp.id, emp]) || []);

      const transformedData: LeaveRequest[] = data?.map(item => {
        const employeeData = employeesMap.get(item.employee_id);
        return {
          id: item.id,
          employeeId: item.employee_id,
          employee: {
            id: employeeData?.id || '',
            firstName: employeeData?.first_name || '',
            lastName: employeeData?.last_name || '',
            email: employeeData?.email || '',
            phone: employeeData?.phone || '',
            employeeNumber: employeeData?.employee_number || ''
          } as Employee,
          type: item.leave_type as LeaveRequest['type'],
          startDate: item.start_date,
          endDate: item.end_date,
          daysCount: item.days_count,
          status: item.status as LeaveRequest['status'],
          reason: item.reason,
          urgency: calculateUrgency(item.start_date, item.leave_type),
          createdAt: item.created_at,
          approvedBy: item.approved_by,
          approvedAt: item.approved_at
        };
      }) || [];

      setLeaveRequests(transformedData);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast.error('Erreur lors du chargement des demandes de congé');
    }
  };

  const fetchSickLeaves = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_sick_leaves')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch employee details separately
      const employeeIds = [...new Set(data?.map(leave => leave.employee_id) || [])];
      const { data: employeesData } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, phone, employee_number')
        .in('id', employeeIds);

      const employeesMap = new Map(employeesData?.map(emp => [emp.id, emp]) || []);

      const transformedData: SickLeaveRequest[] = data?.map(item => {
        const employeeData = employeesMap.get(item.employee_id);
        return {
          id: item.id,
          employeeId: item.employee_id,
          employee: {
            id: employeeData?.id || '',
            firstName: employeeData?.first_name || '',
            lastName: employeeData?.last_name || '',
            email: employeeData?.email || '',
            phone: employeeData?.phone || '',
            employeeNumber: employeeData?.employee_number || ''
          } as Employee,
          startDate: item.start_date,
          endDate: item.end_date,
          reason: item.reason,
          medicalCertificate: item.medical_certificate_url,
          status: item.status as SickLeaveRequest['status'],
          severity: calculateSeverity(item.reason),
          createdAt: item.created_at
        };
      }) || [];

      setSickLeaves(transformedData);
    } catch (error) {
      console.error('Error fetching sick leaves:', error);
      toast.error('Erreur lors du chargement des arrêts maladie');
    }
  };

  const calculateUrgency = (startDate: string, type: string): LeaveRequest['urgency'] => {
    const start = new Date(startDate);
    const today = new Date();
    const daysUntilStart = differenceInDays(start, today);

    if (type === 'SICK' || type === 'MATERNITY' || type === 'PATERNITY') return 'HIGH';
    if (daysUntilStart <= 2) return 'URGENT';
    if (daysUntilStart <= 7) return 'HIGH';
    if (daysUntilStart <= 14) return 'MEDIUM';
    return 'LOW';
  };

  const calculateSeverity = (reason?: string): SickLeaveRequest['severity'] => {
    if (!reason) return 'LIGHT';
    const lowerReason = reason.toLowerCase();
    
    if (lowerReason.includes('urgence') || lowerReason.includes('hospitalisation') || lowerReason.includes('chirurgie')) {
      return 'EMERGENCY';
    }
    if (lowerReason.includes('fracture') || lowerReason.includes('accident') || lowerReason.includes('infection')) {
      return 'SEVERE';
    }
    if (lowerReason.includes('grippe') || lowerReason.includes('gastro') || lowerReason.includes('migraine')) {
      return 'MODERATE';
    }
    return 'LIGHT';
  };

  const updateLeaveStatus = async (leaveId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    setLoading(true);
    try {
      const updateData: any = { 
        status,
        approved_at: status === 'APPROVED' ? new Date().toISOString() : null
      };
      
      if (status === 'REJECTED' && reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from('employee_leaves')
        .update(updateData)
        .eq('id', leaveId);

      if (error) throw error;

      toast.success(`Demande ${status === 'APPROVED' ? 'approuvée' : 'rejetée'}`);
      fetchLeaveRequests();
      onLeaveStatusUpdate();
      
      if (selectedRequest) {
        setSelectedRequest(null);
        setRejectionReason('');
      }
    } catch (error) {
      console.error('Error updating leave status:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const updateSickLeaveStatus = async (sickLeaveId: string, status: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('employee_sick_leaves')
        .update({ 
          status,
          approved_at: status === 'APPROVED' ? new Date().toISOString() : null
        })
        .eq('id', sickLeaveId);

      if (error) throw error;

      toast.success(`Arrêt maladie ${status === 'APPROVED' ? 'approuvé' : 'rejeté'}`);
      fetchSickLeaves();
      onLeaveStatusUpdate();
    } catch (error) {
      console.error('Error updating sick leave status:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: LeaveRequest['urgency']) => {
    switch (urgency) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: SickLeaveRequest['severity']) => {
    switch (severity) {
      case 'EMERGENCY': return 'bg-red-100 text-red-800';
      case 'SEVERE': return 'bg-orange-100 text-orange-800';
      case 'MODERATE': return 'bg-yellow-100 text-yellow-800';
      case 'LIGHT': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PENDING': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredLeaveRequests = leaveRequests.filter(request => {
    if (filterStatus !== 'ALL' && request.status !== filterStatus) return false;
    if (filterUrgency !== 'ALL' && request.urgency !== filterUrgency) return false;
    return true;
  });

  const pendingCount = leaveRequests.filter(r => r.status === 'PENDING').length;
  const sickPendingCount = sickLeaves.filter(s => s.status === 'PENDING').length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative">
          <Heart className="h-4 w-4 mr-2" />
          Gestion Congés/Maladie
          {(pendingCount + sickPendingCount) > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
              {pendingCount + sickPendingCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Centre de gestion des congés et maladies
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="leaves" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="leaves" className="relative">
              Demandes de congé
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sick" className="relative">
              Arrêts maladie
              {sickPendingCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {sickPendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">Statistiques</TabsTrigger>
          </TabsList>

          <TabsContent value="leaves" className="space-y-4">
            {/* Filtres */}
            <div className="flex gap-4 items-center">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="APPROVED">Approuvé</SelectItem>
                  <SelectItem value="REJECTED">Rejeté</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterUrgency} onValueChange={setFilterUrgency}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer par urgence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Toutes urgences</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">Élevée</SelectItem>
                  <SelectItem value="MEDIUM">Moyenne</SelectItem>
                  <SelectItem value="LOW">Faible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table des demandes */}
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Jours</TableHead>
                    <TableHead>Urgence</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaveRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {request.employee.firstName} {request.employee.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.employee.employeeNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(request.startDate), 'dd/MM/yyyy', { locale: fr })}
                          <br />
                          {format(new Date(request.endDate), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell>{request.daysCount}</TableCell>
                      <TableCell>
                        <Badge className={getUrgencyColor(request.urgency)}>
                          {request.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.status)}
                          <span className="text-sm">{request.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateLeaveStatus(request.id, 'APPROVED')}
                              disabled={loading}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedRequest(request)}
                              disabled={loading}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejeter
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="sick" className="space-y-4">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Sévérité</TableHead>
                    <TableHead>Certificat</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sickLeaves.map((sickLeave) => (
                    <TableRow key={sickLeave.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {sickLeave.employee.firstName} {sickLeave.employee.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {sickLeave.employee.employeeNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(sickLeave.startDate), 'dd/MM/yyyy', { locale: fr })}
                          <br />
                          {format(new Date(sickLeave.endDate), 'dd/MM/yyyy', { locale: fr })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-48 truncate">
                          {sickLeave.reason || 'Non spécifié'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(sickLeave.severity)}>
                          {sickLeave.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sickLeave.medicalCertificate ? (
                          <Button size="sm" variant="outline">
                            <FileText className="h-3 w-3 mr-1" />
                            Voir
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Aucun</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(sickLeave.status)}
                          <span className="text-sm">{sickLeave.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sickLeave.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => updateSickLeaveStatus(sickLeave.id, 'APPROVED')}
                              disabled={loading}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateSickLeaveStatus(sickLeave.id, 'REJECTED')}
                              disabled={loading}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Rejeter
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Demandes en attente</span>
                </div>
                <div className="text-2xl font-bold">{pendingCount + sickPendingCount}</div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Approuvées ce mois</span>
                </div>
                <div className="text-2xl font-bold">
                  {leaveRequests.filter(r => r.status === 'APPROVED').length}
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Arrêts maladie actifs</span>
                </div>
                <div className="text-2xl font-bold">
                  {sickLeaves.filter(s => {
                    const today = new Date();
                    const start = new Date(s.startDate);
                    const end = new Date(s.endDate);
                    return s.status === 'APPROVED' && isBefore(start, today) && isAfter(end, today);
                  }).length}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog de rejet */}
        {selectedRequest && (
          <Dialog open={true} onOpenChange={() => setSelectedRequest(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rejeter la demande de congé</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm">
                    Demande de <strong>{selectedRequest.employee.firstName} {selectedRequest.employee.lastName}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(selectedRequest.startDate), 'dd/MM/yyyy', { locale: fr })} - {format(new Date(selectedRequest.endDate), 'dd/MM/yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Raison du rejet</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Expliquez pourquoi cette demande est rejetée..."
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => updateLeaveStatus(selectedRequest.id, 'REJECTED', rejectionReason)}
                    disabled={loading || !rejectionReason.trim()}
                  >
                    Rejeter la demande
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};