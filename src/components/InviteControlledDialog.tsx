import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCheck, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PhoneInput } from '@/components/ui/phone-input';
import type { ContractType } from '@/types/scheduling';

interface InviteControlledDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const InviteControlledDialog = ({ open: externalOpen, onOpenChange }: InviteControlledDialogProps = {}) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    contractType: 'CDI' as ContractType,
    hourlyRate: '',
    weeklyHours: '40',
    language: 'FR' as 'FR' | 'NL' | 'EN',
    role: 'EMPLOYEE' as 'EMPLOYEE' | 'SUPER_MANAGER'
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
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // Prepare employee data if role is employee
      const employeeData = formData.role === 'EMPLOYEE' ? {
        employee_number: `EMP${Date.now()}`,
        phone: formData.phone,
        contract_type: formData.contractType,
        hourly_rate: parseFloat(formData.hourlyRate) || 0,
        weekly_hours: formData.contractType === 'STUDENT' ? null : parseInt(formData.weeklyHours) || 40,
        language: formData.language,
        color: '#3B82F6'
      } : null;

      // Create invitation record
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          employee_data: employeeData,
          invited_by: user.id,
          invitation_token: token,
          invitation_expires_at: expiresAt.toISOString()
        });

      if (inviteError) throw inviteError;

      // Generate invitation link
      const inviteLink = `${window.location.origin}/register?invite=${token}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(inviteLink);

      toast.success(
        `Invitation créée ! Le lien a été copié dans le presse-papiers.`,
        {
          description: `Envoyez ce lien à ${formData.firstName}. Il expire dans 7 jours.`,
          duration: 5000
        }
      );

      setOpen(false);
      resetForm();

    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error('Erreur lors de la création de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      contractType: 'CDI',
      hourlyRate: '',
      weeklyHours: '40',
      language: 'FR',
      role: 'EMPLOYEE'
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!externalOpen && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <UserCheck className="h-4 w-4 mr-2" />
            Invitation Contrôlée
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Invitation Contrôlée
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleInvite} className="space-y-4">
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

          <div>
            <Label htmlFor="phone">Téléphone *</Label>
            <PhoneInput
              value={formData.phone}
              onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="role">Rôle *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'EMPLOYEE' | 'SUPER_MANAGER' }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLOYEE">Employé</SelectItem>
                <SelectItem value="SUPER_MANAGER">Super Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === 'EMPLOYEE' && (
            <>
              <div>
                <Label htmlFor="contractType">Type de contrat *</Label>
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
                    {formData.contractType === 'STUDENT' ? 'Heures/sem. (fixe)' : 'Heures/semaine'}
                  </Label>
                  <Input
                    id="weeklyHours"
                    type="number"
                    value={formData.weeklyHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, weeklyHours: e.target.value }))}
                    placeholder={formData.contractType === 'STUDENT' ? 'Optionnel' : '40'}
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
            </>
          )}

          <div>
            <Label htmlFor="email">Email pour l'invitation *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemple.com"
              required
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Invitation avec données pré-remplies
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  La personne recevra un lien pour créer son compte avec ses informations déjà renseignées. 
                  Elle devra juste définir son mot de passe.
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