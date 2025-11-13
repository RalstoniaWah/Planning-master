import { useState } from "react";
import { Calendar, Building2, User, Plus, Settings, LogOut, Users, UserPlus, Shield, FileText, UserCheck, ArchiveRestore } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DayHoursSummaryCard } from "./DayHoursSummaryCard";
import { SiteSelector } from "./SiteSelector";
import { AddSiteDialog } from "./AddSiteDialog";
import { AddEmployeeDialog } from "./AddEmployeeDialog";
import { UserProfileDialog } from "./UserProfileDialog";
import { AuditLogDialog } from "./AuditLogDialog";
import { InvitationPanel } from "./InvitationPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AppSidebarProps {
  currentSite: any;
  onSiteChange: (siteId: string) => void;
  sites: any[];
  selectedDate: Date;
  shifts: any[];
  employees: any[];
  employeeStatuses: any[];
  getEmployeeById: (id: string) => any;
  onSiteCreated: () => void;
  userRole?: string;
}

export function AppSidebar({ 
  currentSite, 
  onSiteChange, 
  sites, 
  selectedDate, 
  shifts, 
  employees, 
  employeeStatuses,
  getEmployeeById,
  onSiteCreated,
  userRole = 'ADMIN'
}: AppSidebarProps) {
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [showAddSiteDialog, setShowAddSiteDialog] = useState(false);
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [showInvitationPanel, setShowInvitationPanel] = useState(false);
  const [showStaffPage, setShowStaffPage] = useState(false);

  const userInitials = user?.user_metadata?.first_name && user?.user_metadata?.last_name
    ? `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <>
      <Sidebar 
        className="fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-in-out w-16 hover:w-80 group bg-background border-r"
        collapsible="none"
      >
        <SidebarHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="font-medium text-sm truncate">
                {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-4">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Navigation
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => window.location.href = '/staff'}>
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span className="ml-2">Staff</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="ml-2">Schedule</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Actions */}
          <SidebarGroup>
            <SidebarGroupLabel className="px-4">
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Actions
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setShowAddSiteDialog(true)}>
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span className="ml-2">Nouvel implémentation</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
            {(userRole === 'ADMIN' || userRole === 'SUPER_MANAGER') && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setShowAddEmployeeDialog(true)}>
                    <UserPlus className="h-4 w-4 flex-shrink-0" />
                    <span className="ml-2">Nouvel Employé</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setShowInvitationPanel(true)}>
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span className="ml-2">Inviter Employés</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => window.location.href = '/employee-archives'}>
                    <ArchiveRestore className="h-4 w-4 flex-shrink-0" />
                    <span className="ml-2">Archives Employés</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setShowStaffPage(true)}>
                    <UserCheck className="h-4 w-4 flex-shrink-0" />
                    <span className="ml-2">Personnel</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => window.location.href = '/schedule'}>
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="ml-2">Planning</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
                {userRole === 'ADMIN' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => setShowAuditDialog(true)}>
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      <span className="ml-2">Paramètres Admin</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4 border-t">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setShowProfileDialog(true)}>
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Mon profil
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={signOut} className="text-red-600 hover:text-red-700">
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Déconnexion
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <AddSiteDialog
        open={showAddSiteDialog}
        onOpenChange={setShowAddSiteDialog}
        onSiteAdded={() => {
          onSiteCreated();
          setShowAddSiteDialog(false);
        }}
      />

      <AddEmployeeDialog
        open={showAddEmployeeDialog}
        onOpenChange={setShowAddEmployeeDialog}
        employeeStatuses={employeeStatuses}
        sites={sites}
        onEmployeeAdded={() => {
          onSiteCreated();
          setShowAddEmployeeDialog(false);
        }}
      />

      <AuditLogDialog 
        open={showAuditDialog}
        onOpenChange={setShowAuditDialog}
      />

      <UserProfileDialog 
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
      />

      <Dialog open={showInvitationPanel} onOpenChange={setShowInvitationPanel}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Inviter des employés</DialogTitle>
          </DialogHeader>
          <InvitationPanel />
        </DialogContent>
      </Dialog>

      <Dialog open={showStaffPage} onOpenChange={setShowStaffPage}>
        <DialogContent className="sm:max-w-[95vw] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Personnel
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[80vh]">
            <div className="p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Consultez et gérez tous vos employés organisés par statut.
              </p>
              <Button 
                onClick={() => {
                  setShowStaffPage(false);
                  window.open('/staff', '_blank');
                }}
                className="w-full"
              >
                Ouvrir la page Personnel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}