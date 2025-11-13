import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddEmployeeDialog } from '@/components/AddEmployeeDialog';
import { AddSiteDialog } from '@/components/AddSiteDialog';
import { Building, UserPlus } from 'lucide-react';
import type { EmployeeStatus, Site } from '@/types/scheduling';

interface ResourceManagementPanelProps {
  employeeStatuses: EmployeeStatus[];
  sites: Site[];
  onRefreshData: () => void;
}

export const ResourceManagementPanel = ({ employeeStatuses, sites, onRefreshData }: ResourceManagementPanelProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
        <Building className="h-5 w-5 text-primary" />
        Gestion des Ressources
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Building className="h-4 w-4" />
              Nouveau Site
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Créer un nouveau site de travail avec ses paramètres.
            </p>
            <AddSiteDialog onSiteAdded={onRefreshData} />
          </CardContent>
        </Card>

        <Card className="border-2 border-accent/20 hover:border-accent/40 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-accent">
              <UserPlus className="h-4 w-4" />
              Nouvel Employé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Ajouter un employé directement dans le système.
            </p>
            <AddEmployeeDialog 
              employeeStatuses={employeeStatuses}
              sites={sites}
              onEmployeeAdded={onRefreshData}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};