import { InviteManagerDialog } from './InviteManagerDialog';
import { InviteControlledDialog } from './InviteControlledDialog';
import { InviteQuickDialog } from './InviteQuickDialog';

import { UserCheck, Zap, Users, UserPlus } from 'lucide-react';

interface InvitationPanelProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  employeeStatuses?: any[];
}

export const InvitationPanel = ({ open, onOpenChange, employeeStatuses = [] }: InvitationPanelProps = {}) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-medium text-primary">Managers</span>
          </div>
          <InviteManagerDialog />
        </div>

        <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="h-4 w-4 text-accent" />
            <span className="font-medium text-accent">Invitation Contrôlée</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Créez les données de l'employé et envoyez un lien d'invitation
          </p>
          <InviteControlledDialog open={open} onOpenChange={onOpenChange} />
        </div>

        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-warning" />
            <span className="font-medium text-warning">Invitation Rapide</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Générez un lien pour que l'employé s'inscrive lui-même
          </p>
          <InviteQuickDialog />
        </div>
      </div>
    </div>
  );
};