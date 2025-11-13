import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { User, Clock, Calendar, GraduationCap, AlertTriangle, Phone, Mail } from "lucide-react";
import { Employee } from "@/types/scheduling";

interface EmployeeCardProps {
  employee: Employee;
  isSelected?: boolean;
  onSelect?: (employee: Employee) => void;
  monthlyHours?: number;
  maxMonthlyHours?: number;
  isAvailableToday?: boolean;
}

export const EmployeeCard = ({
  employee,
  isSelected = false,
  onSelect,
  monthlyHours = 0,
  maxMonthlyHours = 160,
  isAvailableToday = true,
}: EmployeeCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const initials = `${employee.firstName.charAt(0)}${employee.lastName.charAt(0)}`;
  const hoursProgress = (monthlyHours / maxMonthlyHours) * 100;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("employee", JSON.stringify(employee));
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleSelectChange = (checked: boolean) => {
    if (onSelect) {
      onSelect(employee);
    }
  };

  // Déterminer le statut spécial pour les étudiants
  const getStudentStatus = () => {
    if (employee.status.isStudent) {
      // Logique pour déterminer si l'étudiant est en période d'examen
      const now = new Date();
      const isExamPeriod = false; // À implémenter selon la logique métier
      return isExamPeriod ? 'BLOCUS-EXAMEN' : 'DISPONIBLE';
    }
    return null;
  };

  const studentStatus = getStudentStatus();

  return (
    <Card 
      className={`transition-all duration-200 hover:shadow-md ${
        isDragging ? 'opacity-50 rotate-2 scale-105' : ''
      } ${isSelected ? 'ring-2 ring-primary' : ''} ${
        !isAvailableToday ? 'opacity-75 border-dashed' : ''
      }`}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      draggable
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Checkbox pour sélection multiple */}
          <div className="flex items-center pt-1">
            <Checkbox 
              checked={isSelected}
              onCheckedChange={handleSelectChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Avatar */}
          <Avatar className="h-10 w-10">
            <AvatarImage src={employee.photoUrl} />
            <AvatarFallback style={{ backgroundColor: employee.color }}>
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Employee Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm truncate">
                {employee.firstName} {employee.lastName}
              </h3>
              <span className="text-xs text-muted-foreground ml-2">
                #{employee.employeeNumber}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-1">
              <Badge 
                variant={employee.status.isStudent ? "secondary" : "outline"} 
                className="text-xs"
              >
                {employee.status.isStudent ? (
                  <div className="flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {employee.status.label}
                  </div>
                ) : (
                  employee.status.label
                )}
              </Badge>
              
              {/* Statut spécial pour étudiants */}
              {studentStatus && (
                <Badge 
                  variant={studentStatus === 'BLOCUS-EXAMEN' ? "destructive" : "default"}
                  className="text-xs"
                >
                  {studentStatus}
                </Badge>
              )}
              
              {!isAvailableToday && (
                <Badge variant="outline" className="text-xs text-orange-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Non disponible
                </Badge>
              )}
            </div>

            {/* Monthly Hours Progress */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Heures ce mois</span>
                <span className="font-medium">
                  {Math.round(monthlyHours)}h / {maxMonthlyHours}h
                </span>
              </div>
              <Progress 
                value={hoursProgress} 
                className="h-1.5 mt-1"
                // Color based on progress
                color={hoursProgress > 90 ? 'red' : hoursProgress > 75 ? 'orange' : 'green'}
              />
            </div>

            {/* Contact Info */}
            {(employee.phone || employee.email) && (
              <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                {employee.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span className="truncate">{employee.phone}</span>
                  </div>
                )}
                {employee.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{employee.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};