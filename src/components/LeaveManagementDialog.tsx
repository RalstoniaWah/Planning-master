import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, Calendar as CalendarLucide, Clock, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Employee, EmployeeLeave, EmployeeLeaveSummary } from "@/types/scheduling";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LeaveManagementDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeaveUpdated: () => void;
}

export const LeaveManagementDialog = ({ 
  employee, 
  open, 
  onOpenChange, 
  onLeaveUpdated 
}: LeaveManagementDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [leaves, setLeaves] = useState<EmployeeLeave[]>([]);
  const [leaveSummary, setLeaveSummary] = useState<EmployeeLeaveSummary | null>(null);
  const { toast } = useToast();
  
  const [newLeave, setNewLeave] = useState({
    leaveType: 'VACATION' as EmployeeLeave['leaveType'],
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    reason: ''
  });

  // Fetch leaves when employee changes
  useEffect(() => {
    if (employee && open) {
      fetchEmployeeLeaves();
    }
  }, [employee, open]);

  const fetchEmployeeLeaves = async () => {
    if (!employee) return;
    
    setLoading(true);
    try {
      // Fetch employee leaves
      const { data: leavesData, error: leavesError } = await supabase
        .from('employee_leaves')
        .select('*')
        .eq('employee_id', employee.id)
        .order('start_date', { ascending: false });

      if (leavesError) throw leavesError;

      const transformedLeaves: EmployeeLeave[] = leavesData?.map(leave => ({
        id: leave.id,
        employeeId: leave.employee_id,
        leaveType: leave.leave_type as EmployeeLeave['leaveType'],
        startDate: leave.start_date,
        endDate: leave.end_date,
        daysCount: leave.days_count,
        status: leave.status as EmployeeLeave['status'],
        reason: leave.reason,
        approvedBy: leave.approved_by,
        approvedAt: leave.approved_at,
        createdAt: leave.created_at,
        updatedAt: leave.updated_at
      })) || [];

      setLeaves(transformedLeaves);

      // Calculate leave summary
      const currentYear = new Date().getFullYear();
      const approvedLeaves = transformedLeaves.filter(l => 
        l.status === 'APPROVED' && 
        new Date(l.startDate).getFullYear() === currentYear
      );

      const usedAnnualLeave = approvedLeaves
        .filter(l => l.leaveType === 'VACATION')
        .reduce((sum, l) => sum + l.daysCount, 0);

      const usedSickLeave = approvedLeaves
        .filter(l => l.leaveType === 'SICK')
        .reduce((sum, l) => sum + l.daysCount, 0);

      const pendingLeaves = transformedLeaves.filter(l => l.status === 'PENDING').length;

      setLeaveSummary({
        employeeId: employee.id,
        annualLeaveDays: employee.annualLeaveDays,
        sickLeaveDays: employee.sickLeaveDays,
        usedAnnualLeave,
        usedSickLeave,
        pendingLeaves,
        remainingAnnualLeave: employee.annualLeaveDays - usedAnnualLeave,
        remainingSickLeave: employee.sickLeaveDays - usedSickLeave
      });

    } catch (error) {
      console.error('Error fetching leaves:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les congés",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = () => {
    if (newLeave.startDate && newLeave.endDate) {
      return differenceInDays(newLeave.endDate, newLeave.startDate) + 1;
    }
    return 0;
  };

  const handleSubmitLeave = async () => {
    if (!employee || !newLeave.startDate || !newLeave.endDate) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const daysCount = calculateDays();
    if (daysCount <= 0) {
      toast({
        title: "Erreur",
        description: "La date de fin doit être après la date de début",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('employee_leaves')
        .insert({
          employee_id: employee.id,
          leave_type: newLeave.leaveType,
          start_date: format(newLeave.startDate, 'yyyy-MM-dd'),
          end_date: format(newLeave.endDate, 'yyyy-MM-dd'),
          days_count: daysCount,
          reason: newLeave.reason || null,
          status: 'PENDING'
        });

      if (error) throw error;

      toast({
        title: "Congé demandé",
        description: `Demande de congé de ${daysCount} jour(s) créée`,
      });

      // Reset form
      setNewLeave({
        leaveType: 'VACATION',
        startDate: undefined,
        endDate: undefined,
        reason: ''
      });

      // Refresh data
      fetchEmployeeLeaves();
      onLeaveUpdated();

    } catch (error) {
      console.error('Error creating leave:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la demande de congé",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLeaveStatus = async (leaveId: string, status: EmployeeLeave['status']) => {
    setLoading(true);
    try {
      const updateData: any = { status };
      if (status === 'APPROVED') {
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('employee_leaves')
        .update(updateData)
        .eq('id', leaveId);

      if (error) throw error;

      toast({
        title: "Statut mis à jour",
        description: `Congé ${status === 'APPROVED' ? 'approuvé' : status === 'REJECTED' ? 'rejeté' : 'annulé'}`,
      });

      fetchEmployeeLeaves();
      onLeaveUpdated();

    } catch (error) {
      console.error('Error updating leave status:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: EmployeeLeave['status']) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeLabel = (type: EmployeeLeave['leaveType']) => {
    switch (type) {
      case 'VACATION': return 'Vacances';
      case 'SICK': return 'Maladie';
      case 'PERSONAL': return 'Personnel';
      case 'MATERNITY': return 'Maternité';
      case 'PATERNITY': return 'Paternité';
      default: return type;
    }
  };

  if (!employee) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Page en construction</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <CalendarLucide className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Cette fonctionnalité sera bientôt disponible.
            </p>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Revenir au menu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarLucide className="h-5 w-5" />
            Gestion des congés - {employee.firstName} {employee.lastName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Résumé</TabsTrigger>
            <TabsTrigger value="request">Nouvelle demande</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            {leaveSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarLucide className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Congés annuels</span>
                  </div>
                  <div className="text-2xl font-bold">{leaveSummary.remainingAnnualLeave}</div>
                  <div className="text-xs text-muted-foreground">
                    sur {leaveSummary.annualLeaveDays} jours
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Congés maladie</span>
                  </div>
                  <div className="text-2xl font-bold">{leaveSummary.remainingSickLeave}</div>
                  <div className="text-xs text-muted-foreground">
                    sur {leaveSummary.sickLeaveDays} jours
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">En attente</span>
                  </div>
                  <div className="text-2xl font-bold">{leaveSummary.pendingLeaves}</div>
                  <div className="text-xs text-muted-foreground">demandes</div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarLucide className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Pris cette année</span>
                  </div>
                  <div className="text-2xl font-bold">{leaveSummary.usedAnnualLeave + leaveSummary.usedSickLeave}</div>
                  <div className="text-xs text-muted-foreground">jours</div>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="request" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-medium mb-4">Nouvelle demande de congé</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="leaveType">Type de congé</Label>
                  <Select value={newLeave.leaveType} onValueChange={(value) => setNewLeave(prev => ({ ...prev, leaveType: value as EmployeeLeave['leaveType'] }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VACATION">Vacances</SelectItem>
                      <SelectItem value="SICK">Maladie</SelectItem>
                      <SelectItem value="PERSONAL">Personnel</SelectItem>
                      <SelectItem value="MATERNITY">Maternité</SelectItem>
                      <SelectItem value="PATERNITY">Paternité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Nombre de jours</Label>
                  <Input 
                    value={calculateDays()} 
                    disabled 
                    placeholder="Calculé automatiquement"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label>Date de début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newLeave.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newLeave.startDate ? format(newLeave.startDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newLeave.startDate}
                        onSelect={(date) => setNewLeave(prev => ({ ...prev, startDate: date }))}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Date de fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newLeave.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newLeave.endDate ? format(newLeave.endDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newLeave.endDate}
                        onSelect={(date) => setNewLeave(prev => ({ ...prev, endDate: date }))}
                        disabled={(date) => !newLeave.startDate || date < newLeave.startDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="mt-4">
                <Label htmlFor="reason">Motif (optionnel)</Label>
                <Textarea
                  id="reason"
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Décrivez le motif de votre demande..."
                />
              </div>

              <Button 
                onClick={handleSubmitLeave} 
                disabled={loading || !newLeave.startDate || !newLeave.endDate}
                className="w-full mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? "Création..." : "Créer la demande"}
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-3">
              {leaves.map((leave) => (
                <Card key={leave.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(leave.status)}>
                        {leave.status}
                      </Badge>
                      <div>
                        <div className="font-medium">{getLeaveTypeLabel(leave.leaveType)}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(leave.startDate), "dd/MM/yyyy", { locale: fr })} - {format(new Date(leave.endDate), "dd/MM/yyyy", { locale: fr })} ({leave.daysCount} jour{leave.daysCount > 1 ? 's' : ''})
                        </div>
                        {leave.reason && (
                          <div className="text-sm text-muted-foreground mt-1">{leave.reason}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {leave.status === 'PENDING' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateLeaveStatus(leave.id, 'APPROVED')}
                            disabled={loading}
                          >
                            Approuver
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUpdateLeaveStatus(leave.id, 'REJECTED')}
                            disabled={loading}
                          >
                            Rejeter
                          </Button>
                        </>
                      )}
                      {leave.status !== 'CANCELLED' && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleUpdateLeaveStatus(leave.id, 'CANCELLED')}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              
              {leaves.length === 0 && !loading && (
                <Card className="p-8 text-center">
                  <CalendarLucide className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Aucun congé enregistré</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};