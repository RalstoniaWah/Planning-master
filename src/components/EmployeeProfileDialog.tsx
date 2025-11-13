import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, MapPin, Clock, Phone, Mail, Calendar, Save, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Employee, EmployeeStatus, Site, ContractType, EmployeeLeave } from "@/types/scheduling";
import { LeaveManagementDialog } from "@/components/LeaveManagementDialog";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeProfileDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeStatuses: EmployeeStatus[];
  sites: Site[];
  onEmployeeUpdated: () => void;
}

export const EmployeeProfileDialog = ({ 
  employee, 
  open, 
  onOpenChange, 
  employeeStatuses, 
  sites, 
  onEmployeeUpdated 
}: EmployeeProfileDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    birthDate: employee?.birthDate || '',
    statusId: employee?.status.id || '',
    contractType: employee?.contractType || 'CDI' as ContractType,
    hourlyRate: employee?.hourlyRate.toString() || '',
    weeklyHours: employee?.weeklyHours.toString() || '',
    language: employee?.language || 'FR' as 'FR' | 'NL' | 'EN',
    assignedSites: [] as string[] // This would need to come from a junction table
  });

  // Update form when employee changes
  React.useEffect(() => {
    if (employee) {
      setFormData({
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
        assignedSites: [] // Would need to be fetched from junction table
      });
    }
  }, [employee]);

  const handleSave = async () => {
    if (!employee) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone || null,
          birth_date: formData.birthDate,
          status_id: formData.statusId,
          contract_type: formData.contractType,
          hourly_rate: parseFloat(formData.hourlyRate) || 0,
          weekly_hours: parseInt(formData.weeklyHours) || 40,
          language: formData.language,
          updated_at: new Date().toISOString()
        })
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Les informations de l'employé ont été sauvegardées",
      });

      onEmployeeUpdated();
      onOpenChange(false);

    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profil de {employee.firstName} {employee.lastName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="sites">Sites</TabsTrigger>
            <TabsTrigger value="leaves">Congés</TabsTrigger>
            <TabsTrigger value="schedule">Planning</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Employee Card */}
              <Card className="p-4">
                <div className="text-center space-y-3">
                  <div 
                    className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: employee.color }}
                  >
                    {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium">{employee.firstName} {employee.lastName}</h3>
                    <p className="text-sm text-muted-foreground">{employee.employeeNumber}</p>
                  </div>
                  <Badge 
                    variant="secondary"
                    style={{ backgroundColor: employee.status.color + '20', color: employee.status.color }}
                  >
                    {employee.status.label}
                  </Badge>
                </div>

                <div className="space-y-2 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.email}</span>
                  </div>
                  {employee.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{employee.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(employee.birthDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{employee.weeklyHours}h/semaine - {employee.annualLeaveDays} jours/an</span>
                  </div>
                </div>
              </Card>

              {/* Edit Form */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Statut</Label>
                    <Select value={formData.statusId} onValueChange={(value) => setFormData(prev => ({ ...prev, statusId: value }))}>
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
                  <div>
                    <Label htmlFor="contractType">Type de contrat</Label>
                    <Select value={formData.contractType} onValueChange={(value) => setFormData(prev => ({ ...prev, contractType: value as ContractType }))}>
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
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hourlyRate">Taux horaire (€)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weeklyHours">Heures/semaine</Label>
                    <Input
                      id="weeklyHours"
                      type="number"
                      value={formData.weeklyHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, weeklyHours: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="language">Langue</Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value as 'FR' | 'NL' | 'EN' }))}>
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
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sites" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Affectation aux sites
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                Sélectionnez les sites où cet employé peut travailler :
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sites.map((site) => (
                  <div key={site.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <Checkbox
                      id={`site-${site.id}`}
                      checked={formData.assignedSites.includes(site.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData(prev => ({
                            ...prev,
                            assignedSites: [...prev.assignedSites, site.id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            assignedSites: prev.assignedSites.filter(id => id !== site.id)
                          }));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <label htmlFor={`site-${site.id}`} className="text-sm font-medium cursor-pointer">
                        {site.name}
                      </label>
                      <p className="text-xs text-muted-foreground">{site.address}</p>
                    </div>
                    <Badge variant="outline">{site.code}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="leaves" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Gestion des congés
                </h3>
                <Button onClick={() => setShowLeaveDialog(true)}>
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Gérer les congés
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{employee.annualLeaveDays}</div>
                  <div className="text-sm text-muted-foreground">Congés annuels</div>
                </div>
                <div className="text-center p-4 bg-blue-100 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{employee.sickLeaveDays}</div>
                  <div className="text-sm text-muted-foreground">Congés maladie</div>
                </div>
                <div className="text-center p-4 bg-green-100 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{employee.currentYear}</div>
                  <div className="text-sm text-muted-foreground">Année en cours</div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                Cliquez sur "Gérer les congés" pour voir l'historique complet, créer de nouvelles demandes et suivre les congés restants.
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-medium mb-4">Horaires de travail</h3>
              <p className="text-sm text-muted-foreground">
                Fonctionnalité de gestion des horaires à venir...
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </DialogContent>

      <LeaveManagementDialog
        employee={employee}
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        onLeaveUpdated={onEmployeeUpdated}
      />
    </Dialog>
  );
};