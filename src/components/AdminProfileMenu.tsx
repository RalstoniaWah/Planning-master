import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/theme-provider';
import { InvitationPanel } from '@/components/InvitationPanel';
import { AddEmployeeDialog } from '@/components/AddEmployeeDialog';
import { AddSiteDialog } from '@/components/AddSiteDialog';
import { AuditLogDialog } from '@/components/AuditLogDialog';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { ResourceManagementPanel } from '@/components/ResourceManagementPanel';
import { EmployeeManagementPanel } from '@/components/EmployeeManagementPanel';
import { AdvancedSchedulingPanel } from '@/components/AdvancedSchedulingPanel';
import { 
  User, 
  LogOut, 
  Sun, 
  Moon, 
  Settings,
  UserPlus,
  Building,
  FileText,
  Shield,
  Users,
  Zap
} from 'lucide-react';
import type { EmployeeStatus, Site, Employee } from '@/types/scheduling';
import { useSupabaseData } from '@/hooks/useSupabaseData';

interface AdminProfileMenuProps {
  employeeStatuses: EmployeeStatus[];
  sites: Site[];
  onRefreshData: () => void;
}

export const AdminProfileMenu = ({ employeeStatuses, sites, onRefreshData }: AdminProfileMenuProps) => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { employees } = useSupabaseData();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showEmployeePanel, setShowEmployeePanel] = useState(false);
  const [showSchedulingPanel, setShowSchedulingPanel] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const userInitials = user?.user_metadata?.first_name?.[0] + user?.user_metadata?.last_name?.[0] || 'U';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-96 p-2" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Theme Toggle */}
          <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
            {theme === 'dark' ? (
              <>
                <Sun className="mr-2 h-4 w-4" />
                <span>Mode Clair</span>
              </>
            ) : (
              <>
                <Moon className="mr-2 h-4 w-4" />
                <span>Mode Sombre</span>
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Resource Management */}
          <div className="p-2">
            <ResourceManagementPanel 
              employeeStatuses={employeeStatuses}
              sites={sites}
              onRefreshData={onRefreshData}
            />
          </div>

          <DropdownMenuSeparator />

          {/* Advanced Scheduling */}
          <DropdownMenuItem onClick={() => setShowSchedulingPanel(true)} className="cursor-pointer">
            <Zap className="mr-2 h-4 w-4" />
            <span>Planning Avancé</span>
          </DropdownMenuItem>

          {/* Employee Management */}
          <DropdownMenuItem onClick={() => setShowEmployeePanel(true)} className="cursor-pointer">
            <Users className="mr-2 h-4 w-4" />
            <span>Espace Employé</span>
          </DropdownMenuItem>

          {/* Settings */}
          <DropdownMenuItem onClick={() => setShowAdminPanel(true)} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres Admin</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Profile */}
          <UserProfileDialog />

          {/* Logout */}
          <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Déconnexion</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Admin Settings Panel */}
      <Dialog open={showAdminPanel} onOpenChange={setShowAdminPanel}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Settings className="h-6 w-6 text-primary" />
              Paramètres d'Administration
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* Gestion des Invitations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary border-b pb-2">
                <UserPlus className="h-5 w-5" />
                Gestion des Invitations
              </h3>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <InvitationPanel />
              </div>
            </div>

            {/* Journal de Modification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-primary border-b pb-2">
                <FileText className="h-5 w-5" />
                Audit et Traçabilité
              </h3>
              <div className="bg-warning/5 p-4 rounded-lg border border-warning/10">
                <p className="text-sm text-muted-foreground mb-3">
                  Consultez l'historique de toutes les modifications apportées au système.
                </p>
                <AuditLogDialog />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Employee Management Panel */}
      <Dialog open={showEmployeePanel} onOpenChange={setShowEmployeePanel}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Users className="h-6 w-6 text-primary" />
              Espace Employé
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            <EmployeeManagementPanel 
              employees={employees}
              sites={sites}
              employeeStatuses={employeeStatuses}
              onRefreshData={onRefreshData}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Scheduling Panel */}
      <Dialog open={showSchedulingPanel} onOpenChange={setShowSchedulingPanel}>
        <DialogContent className="sm:max-w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Zap className="h-6 w-6 text-primary" />
              Planning Avancé
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            <AdvancedSchedulingPanel 
              sites={sites}
              employees={employees}
              employeeStatuses={employeeStatuses}
              onRefreshData={onRefreshData}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};