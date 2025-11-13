import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface InviteQuickDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const InviteQuickDialog = ({ open: externalOpen, onOpenChange }: InviteQuickDialogProps = {}) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [requireBirthDate, setRequireBirthDate] = useState(false);

  const generateInvitationToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleCreateQuickInvite = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

      // Create generic invitation record for self-registration
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          email: '', // Will be filled by the person using the link
          first_name: '',
          last_name: '',
          role: 'EMPLOYEE', // Attribuer directement le rôle employé
          employee_data: null, // Will be filled during registration
          invited_by: user.id,
          invitation_token: token,
          invitation_expires_at: expiresAt.toISOString()
        });

      if (inviteError) throw inviteError;

      // Generate invitation link  
      const link = `${window.location.origin}/register?invite=${token}&quick=true${requireBirthDate ? '&birthRequired=true' : ''}`;
      setInviteLink(link);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(link);

      toast.success(
        'Lien d\'invitation rapide créé !',
        {
          description: 'Le lien a été copié dans le presse-papiers. Il expire dans 30 jours.',
          duration: 5000
        }
      );

    } catch (error) {
      console.error('Error creating quick invitation:', error);
      toast.error('Erreur lors de la création du lien d\'invitation');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (inviteLink) {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Lien copié dans le presse-papiers !');
    }
  };

  const resetDialog = () => {
    setInviteLink('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetDialog();
    }}>
      {!externalOpen && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Invitation Rapide
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Invitation Rapide
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900">
                  Lien d'inscription simplifiée
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Créez un lien pour que de nouveaux employés s'inscrivent rapidement avec leurs informations de base.
                  Les détails du contrat seront définis par le manager après inscription.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="requireBirthDate"
              checked={requireBirthDate}
              onChange={(e) => setRequireBirthDate(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="requireBirthDate" className="text-sm">
              Date de naissance (optionnel par défaut)
            </Label>
          </div>
          {!inviteLink ? (
            <div className="text-center py-6">
              <Button 
                onClick={handleCreateQuickInvite}
                disabled={loading}
                size="lg"
              >
                {loading ? 'Création...' : 'Générer le lien d\'invitation'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="inviteLink">Lien d'invitation généré</Label>
                <div className="flex gap-2">
                  <Input
                    id="inviteLink"
                    value={inviteLink}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-900">
                  ✅ Lien créé avec succès !
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Partagez ce lien avec vos futurs employés. Ils pourront créer leur compte 
                  avec leurs informations de base. Vous définirez les détails du contrat après. Le lien expire dans 30 jours.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Fermer
            </Button>
            {inviteLink && (
              <Button onClick={() => {
                resetDialog();
                handleCreateQuickInvite();
              }}>
                Créer un nouveau lien
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};