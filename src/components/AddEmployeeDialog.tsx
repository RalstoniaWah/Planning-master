import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmployeeStatus, Site, ContractType } from "@/types/scheduling";
import { LanguageSelector } from "@/components/LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface AddEmployeeDialogProps {
  employeeStatuses: EmployeeStatus[];
  sites: Site[];
  onEmployeeAdded: () => void;
  triggerText?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AddEmployeeDialog = ({ employeeStatuses, sites, onEmployeeAdded, triggerText, open: externalOpen, onOpenChange }: AddEmployeeDialogProps) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    employeeNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    statusId: '',
    contractType: 'CDI' as ContractType,
    hourlyRate: '',
    weeklyHours: '40',
    languages: ['FR'] as string[],
    assignedSites: [] as string[]
  });

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const resetForm = () => {
    setFormData({
      employeeNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: '',
      statusId: '',
      contractType: 'CDI',
      hourlyRate: '',
      weeklyHours: '40',
      languages: ['FR'],
      assignedSites: []
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);

    try {
        // Validation
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.contractType) {
          throw new Error('Veuillez remplir tous les champs obligatoires');
        }

        // Find or create status based on contract type
        let statusId = formData.statusId;
        if (!statusId) {
          // Map contract type to status
          const statusCode = formData.contractType;
          let status = employeeStatuses.find(s => s.code === statusCode);
          
          if (!status) {
            // Create a new status for this contract type with unique identifier
            const uniqueCode = `${statusCode}_${Date.now()}`;
            const { data: newStatus, error: statusError } = await supabase
              .from('employee_statuses')
              .insert({
                user_id: user.id,
                code: uniqueCode,
                label: formData.contractType === 'STUDENT' ? 'Étudiant' :
                       formData.contractType === 'INTERN' ? 'Stagiaire' :
                       formData.contractType === 'FREELANCE' ? 'Freelance' :
                       formData.contractType,
                is_student: formData.contractType === 'STUDENT',
                hours_limits: formData.contractType === 'STUDENT' ? 
                  { weekly: null, monthly: null, yearly: null } : 
                  { weekly: 40, monthly: 160, yearly: 1920 }
              })
              .select()
              .single();
            
            if (statusError) throw statusError;
            statusId = newStatus.id;
          } else {
            statusId = status.id;
          }
        }

        // Validation additionnelle pour birth_date
        let birthDate = null;
        if (formData.birthDate) {
          birthDate = formData.birthDate;
        }

        // Create employee
        const { data: employee, error: employeeError } = await supabase
          .from('employees')
          .insert({
            user_id: user.id,
            employee_number: formData.employeeNumber || `EMP${Date.now()}`,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone || null,
            birth_date: birthDate,
            status_id: statusId,
            contract_type: formData.contractType,
            hourly_rate: parseFloat(formData.hourlyRate) || 0,
            weekly_hours: parseInt(formData.weeklyHours) || 40,
            language: formData.languages[0] || 'FR',
            color: colors[Math.floor(Math.random() * colors.length)],
            active: true
          })
        .select()
        .single();

      if (employeeError) {
        console.error('Employee creation error:', employeeError);
        throw employeeError;
      }

      toast({
        title: "Employé ajouté",
        description: `${formData.firstName} ${formData.lastName} a été ajouté avec succès`,
      });

      resetForm();
      setOpen(false);
      onEmployeeAdded();

    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'ajouter l'employé",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerText ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {triggerText}
          </Button>
        </DialogTrigger>
      ) : (
        <span>{/* Pas de bouton par défaut - contrôlé depuis la sidebar */}</span>
      )}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel employé</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employeeNumber">Numéro d'employé</Label>
              <Input
                id="employeeNumber"
                value={formData.employeeNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeNumber: e.target.value }))}
                placeholder="Auto-généré si vide"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="birthDate">Date de naissance</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="contractType">Type de contrat *</Label>
            <Select value={formData.contractType} onValueChange={(value) => setFormData(prev => ({ ...prev, contractType: value as ContractType }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type de contrat" />
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
              <Label htmlFor="weeklyHours">
                {formData.contractType === 'STUDENT' ? 'Heures/semaine (fixe)' : 'Heures/semaine'}
              </Label>
              <Input
                id="weeklyHours"
                type="number"
                value={formData.weeklyHours}
                onChange={(e) => setFormData(prev => ({ ...prev, weeklyHours: e.target.value }))}
                placeholder={formData.contractType === 'STUDENT' ? 'Heures de base (optionnel)' : '40'}
              />
              {formData.contractType === 'STUDENT' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Pour les étudiants, les heures sont variables. Indiquez ici les heures de base.
                </p>
              )}
            </div>
            <div>
              <LanguageSelector
                value={formData.languages}
                onChange={(languages) => setFormData(prev => ({ ...prev, languages }))}
                label="Langues parlées"
                placeholder="Ajouter une langue"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Ajout..." : "Ajouter l'employé"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};