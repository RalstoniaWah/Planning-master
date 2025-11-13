import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Copy, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

type UserRole = 'MANAGER';

export const InviteManagerDialog = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'MANAGER' as UserRole,
    companyName: ''
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
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry for managers

      // Create invitation record
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          company_name: formData.companyName,
          role: formData.role as any, // Temporary fix until types are regenerated
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
        `Invitation ${formData.role.toLowerCase()} créée ! Le lien a été copié dans le presse-papiers.`,
        {
          description: 'Envoyez ce lien au manager. Il expire dans 7 jours.',
          duration: 5000
        }
      );

      setOpen(false);
      resetForm();

    } catch (error) {
      console.error('Error creating manager invitation:', error);
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
      role: 'MANAGER',
      companyName: ''
    });
  };

  const roleLabels = {
    MANAGER: 'Manager'
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="h-4 w-4 mr-2" />
          Inviter Manager
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Inviter un Manager
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="manager@email.com"
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

          <div>
            <Label htmlFor="companyName">Nom de l'entreprise</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="Nom de l'entreprise"
            />
          </div>

          <div>
            <Label htmlFor="role">Rôle *</Label>
            <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as UserRole }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANAGER">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Copy className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Lien d'invitation {roleLabels[formData.role]}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Un lien sera généré et copié automatiquement. Le manager pourra créer son compte 
                  avec les permissions appropriées. Le lien expire dans 7 jours.
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