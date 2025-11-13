import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Copy, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PhoneInput } from '@/components/ui/phone-input';

export const EmployeeSelfInviteDialog = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const generateInvitationToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    // Validation du numéro de téléphone
    if (!formData.phone.match(/^\+[1-9]\d{10,14}$/)) {
      toast.error('Format de téléphone invalide (exemple: +33123456789)');
      return;
    }

    setLoading(true);
    try {
      const token = generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry for self-invite

      // Create invitation record for employee self-registration
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          email: `${token}@temp.invite`, // Temporary email, will be replaced during signup
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'EMPLOYEE',
          employee_data: {
            phone: formData.phone,
            contract_type: 'CDI',
            hourly_rate: 0,
            weekly_hours: 40,
            language: 'FR',
            color: '#3B82F6',
            self_invite: true
          },
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
        `Lien d'inscription employé créé ! Le lien a été copié dans le presse-papiers.`,
        {
          description: 'Partagez ce lien avec l\'employé. Il expire dans 7 jours.',
          duration: 5000
        }
      );

      setOpen(false);
      resetForm();

    } catch (error) {
      console.error('Error creating employee self-invite:', error);
      toast.error('Erreur lors de la création du lien d\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Lien Auto-Inscription
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Créer un lien d'auto-inscription employé
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleCreateInvite} className="space-y-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              L'employé remplira ses propres informations lors de l'inscription avec ce lien.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom de l'employé *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Prénom"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom de l'employé *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Nom"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Numéro de téléphone *</Label>
              <PhoneInput
                value={formData.phone}
                onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                placeholder="123456789"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Sélectionnez le pays et entrez le numéro sans le 0
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Copy className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Lien d'auto-inscription
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Un lien sera généré et copié automatiquement. L'employé pourra s'inscrire
                  avec ses propres informations. Le lien expire dans 7 jours.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le lien'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};