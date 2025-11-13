import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Copy, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PhoneInput } from '@/components/ui/phone-input';
import type { EmployeeStatus, ContractType } from '@/types/scheduling';

interface InviteEmployeeDialogProps {
  employeeStatuses: EmployeeStatus[];
}

export const InviteEmployeeDialog = ({ employeeStatuses }: InviteEmployeeDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Personal info
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    
    // Employee info
    employeeNumber: '',
    statusId: '', // Will be auto-generated based on contract type
    contractType: 'CDI' as ContractType,
    hourlyRate: '',
    weeklyHours: '40',
    language: 'FR' as 'FR' | 'NL' | 'EN'
  });

  const generateInvitationToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const token = generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry for employees

      // Prepare employee data - create status based on contract type
      const statusCode = formData.contractType;
      
      // Create a new status for this contract type
      const { data: newStatus, error: statusError } = await supabase
        .from('employee_statuses')
        .insert({
          code: `${statusCode}_${Date.now()}`,
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

      const employeeData = {
        employee_number: formData.employeeNumber || `EMP${Date.now()}`,
        phone: formData.phone,
        birth_date: formData.birthDate || null,
        status_id: newStatus.id,
        contract_type: formData.contractType,
        hourly_rate: parseFloat(formData.hourlyRate) || 0,
        weekly_hours: parseInt(formData.weeklyHours) || 40,
        language: formData.language,
        color: '#3B82F6'
      };

      // Create invitation record
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'EMPLOYEE',
          employee_data: employeeData,
          invited_by: user.id,
          invitation_token: token,
          invitation_expires_at: expiresAt.toISOString()
        });

      if (inviteError) throw inviteError;

      // Generate invitation link
      const inviteLink = `${window.location.origin}/auth?invite=${token}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(inviteLink);

      toast.success(
        `Invitation employé créée ! Le lien a été copié dans le presse-papiers.`,
        {
          description: 'Envoyez ce lien à l\'employé. Il expire dans 30 jours.',
          duration: 5000
        }
      );

      setOpen(false);
      resetForm();

    } catch (error) {
      console.error('Error creating employee invitation:', error);
      toast.error('Erreur lors de la création de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      birthDate: '',
      employeeNumber: '',
      statusId: '', // Will be auto-generated
      contractType: 'CDI',
      hourlyRate: '',
      weeklyHours: '40',
      language: 'FR'
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Link className="h-4 w-4 mr-2" />
          Inviter Employé
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Inviter un Employé
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleInvite} className="space-y-4">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informations personnelles</h3>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="employe@email.com"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Prénom"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Nom"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                  placeholder="123456789"
                />
              </div>
              <div>
                <Label htmlFor="birthDate">Date de naissance (optionnel)</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Employee Information */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium">Informations employé</h3>
            
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label htmlFor="employeeNumber">Numéro d'employé</Label>
                <Input
                  id="employeeNumber"
                  value={formData.employeeNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeNumber: e.target.value }))}
                  placeholder="Auto-généré si vide"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label htmlFor="hourlyRate">Taux horaire (€)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="weeklyHours">Heures/semaine</Label>
              <Input
                id="weeklyHours"
                type="number"
                value={formData.weeklyHours}
                onChange={(e) => setFormData(prev => ({ ...prev, weeklyHours: e.target.value }))}
                placeholder="40"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Copy className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Lien d'invitation employé
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Un lien sera généré et copié automatiquement. L'employé pourra créer son compte 
                  et accéder directement à son planning. Le lien expire dans 30 jours.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer l\'invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};