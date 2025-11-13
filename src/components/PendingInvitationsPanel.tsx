import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Clock, UserCheck, Copy, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PendingInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  company_name: string | null;
  invitation_token: string;
  invitation_expires_at: string;
  created_at: string;
  employee_data?: any;
}

interface PendingInvitationsPanelProps {
  onRefresh?: () => void;
}

export const PendingInvitationsPanel = ({ onRefresh }: PendingInvitationsPanelProps) => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPendingInvitations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('invited_by', user.id)
        .eq('is_used', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
      toast.error('Erreur lors du chargement des invitations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingInvitations();
  }, [user]);

  const copyInvitationLink = async (token: string) => {
    const inviteLink = `${window.location.origin}/auth?invite=${token}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success('Lien d\'invitation copié dans le presse-papiers');
    } catch (error) {
      toast.error('Erreur lors de la copie du lien');
    }
  };

  const deleteInvitation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Invitation supprimée');
      loadPendingInvitations();
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MANAGER': return 'bg-purple-100 text-purple-800';
      case 'EMPLOYEE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invitations en Attente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invitations en Attente ({invitations.length})
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadPendingInvitations}
            disabled={loading}
          >
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune invitation en attente</p>
            <p className="text-sm">Les invitations envoyées apparaîtront ici</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div 
                  key={invitation.id} 
                  className={`border rounded-lg p-4 transition-colors ${
                    isExpired(invitation.invitation_expires_at) 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-medium">
                          {invitation.first_name || 'Nom non renseigné'} {invitation.last_name || ''}
                        </div>
                        <Badge className={getRoleColor(invitation.role)}>
                          {invitation.role}
                        </Badge>
                        {isExpired(invitation.invitation_expires_at) && (
                          <Badge variant="destructive">Expirée</Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {invitation.email || 'Email non renseigné'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Envoyée le {formatDate(invitation.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          Expire le {formatDate(invitation.invitation_expires_at)}
                        </div>
                        {invitation.company_name && (
                          <div>Entreprise: {invitation.company_name}</div>
                        )}
                        {invitation.employee_data?.contract_type && (
                          <div>Type: {invitation.employee_data.contract_type}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInvitationLink(invitation.invitation_token)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copier lien
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteInvitation(invitation.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};