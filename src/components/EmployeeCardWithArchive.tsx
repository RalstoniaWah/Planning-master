import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Phone, 
  Mail, 
  Calendar, 
  Users, 
  Archive,
  AlertTriangle
} from "lucide-react";
import { Employee } from "@/types/scheduling";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EmployeeCardWithArchiveProps {
  employee: Employee;
  onArchive: (employeeId: string) => Promise<void>;
  className?: string;
}

export const EmployeeCardWithArchive = ({ 
  employee, 
  onArchive, 
  className = "" 
}: EmployeeCardWithArchiveProps) => {
  const { toast } = useToast();
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchiveEmployee = async () => {
    try {
      setIsArchiving(true);
      await onArchive(employee.id);
      toast({
        title: "Employé archivé",
        description: `${employee.firstName} ${employee.lastName} a été archivé avec succès.`,
      });
    } catch (error) {
      console.error('Error archiving employee:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'archiver l'employé. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={employee.photoUrl} />
              <AvatarFallback 
                style={{ backgroundColor: employee.color }}
                className="text-white"
              >
                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {employee.firstName} {employee.lastName}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                {employee.employeeNumber}
              </div>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={isArchiving}
              >
                <Archive className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Archiver l'employé
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir archiver <strong>{employee.firstName} {employee.lastName}</strong> ?
                  <br /><br />
                  L'employé sera retiré de la liste active et ne pourra plus être assigné aux plannings. 
                  Vous pourrez le restaurer depuis les archives si nécessaire.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleArchiveEmployee}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isArchiving}
                >
                  {isArchiving ? 'Archivage...' : 'Archiver'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Badge 
            variant="outline" 
            style={{ 
              backgroundColor: `${employee.status?.color}20`,
              borderColor: employee.status?.color,
              color: employee.status?.color 
            }}
          >
            {employee.status?.label || 'Non défini'}
          </Badge>
          
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span>{employee.email}</span>
          </div>
          
          {employee.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span>{employee.phone}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span>Embauché le {new Date(employee.hire_date || '').toLocaleDateString('fr-FR')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Contrat:</span>
            <div className="font-medium">{employee.contractType}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Heures/semaine:</span>
            <div className="font-medium">{employee.weeklyHours}h</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};