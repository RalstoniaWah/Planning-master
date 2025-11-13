import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, CalendarDays, Settings, Users, Zap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Site, Employee, EmployeeStatus } from '@/types/scheduling';

interface SiteOpeningHours {
  id: string;
  site_id: string;
  day_of_week: number;
  opening_time: string;
  closing_time: string;
  is_closed: boolean;
}

interface EmployeeWorkPreference {
  id: string;
  employee_id: string;
  day_of_week: number;
  preference: 'AVAILABLE' | 'PREFERRED' | 'UNAVAILABLE';
  preferred_start_time?: string;
  preferred_end_time?: string;
  max_hours_per_day: number;
}

interface EmployeeRelationship {
  id: string;
  employee_1_id: string;
  employee_2_id: string;
  relationship_type: 'CONFLICT' | 'PREFERENCE' | 'MENTOR_MENTEE';
  notes?: string;
}

interface AdvancedSchedulingPanelProps {
  sites: Site[];
  employees: Employee[];
  employeeStatuses: EmployeeStatus[];
  onRefreshData: () => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
  { value: 5, label: 'Vendredi' },
  { value: 6, label: 'Samedi' },
  { value: 0, label: 'Dimanche' }
];

export const AdvancedSchedulingPanel = ({ 
  sites, 
  employees, 
  employeeStatuses, 
  onRefreshData 
}: AdvancedSchedulingPanelProps) => {
  const { user } = useAuth();
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [openingHours, setOpeningHours] = useState<SiteOpeningHours[]>([]);
  const [workPreferences, setWorkPreferences] = useState<EmployeeWorkPreference[]>([]);
  const [relationships, setRelationships] = useState<EmployeeRelationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOpeningHoursDialog, setShowOpeningHoursDialog] = useState(false);
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false);
  const [showRelationshipsDialog, setShowRelationshipsDialog] = useState(false);
  const [showGenerationDialog, setShowGenerationDialog] = useState(false);

  // Generation parameters
  const [generationParams, setGenerationParams] = useState({
    startDate: '',
    endDate: '',
    period: 'day' as 'day' | 'week' | 'biweek' | 'month',
    prioritizeVeterans: true,
    respectConflicts: true,
    maxHoursPerDay: 8,
    minRestBetweenShifts: 12
  });

  useEffect(() => {
    if (selectedSite) {
      fetchSiteData();
    }
  }, [selectedSite]);

  const fetchSiteData = async () => {
    if (!user || !selectedSite) return;

    try {
      // Fetch opening hours
      const { data: hoursData } = await supabase
        .from('site_opening_hours')
        .select('*')
        .eq('site_id', selectedSite);

      // Fetch work preferences
      const { data: prefsData } = await supabase
        .from('employee_work_preferences')
        .select('*');

      // Fetch relationships
      const { data: relationshipsData } = await supabase
        .from('employee_relationships')
        .select('*');

      setOpeningHours(hoursData || []);
      setWorkPreferences(prefsData || []);
      setRelationships(relationshipsData || []);
    } catch (error) {
      console.error('Error fetching site data:', error);
    }
  };

  const updateOpeningHours = async (dayOfWeek: number, data: Partial<SiteOpeningHours>) => {
    if (!selectedSite || !user) return;

    try {
      const existing = openingHours.find(h => h.day_of_week === dayOfWeek);
      
      if (existing) {
        const { error } = await supabase
          .from('site_opening_hours')
          .update(data)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_opening_hours')
          .insert({
            site_id: selectedSite,
            day_of_week: dayOfWeek,
            opening_time: data.opening_time || '09:00',
            closing_time: data.closing_time || '18:00',
            is_closed: data.is_closed || false,
            ...data
          });

        if (error) throw error;
      }

      await fetchSiteData();
      toast.success('Heures d\'ouverture mises à jour');
    } catch (error) {
      console.error('Error updating opening hours:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const updateEmployeeExperience = async (employeeId: string, experienceLevel: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ experience_level: experienceLevel as 'NOUVEAU' | 'VETERANE' | 'MANAGER' })
        .eq('id', employeeId);

      if (error) throw error;

      toast.success('Niveau d\'expérience mis à jour');
      onRefreshData();
    } catch (error) {
      console.error('Error updating experience level:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const generateSchedule = async () => {
    if (!selectedSite || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-schedule', {
        body: {
          siteId: selectedSite,
          ...generationParams
        }
      });

      if (error) throw error;

      toast.success('Planning généré avec succès');
      setShowGenerationDialog(false);
      onRefreshData();
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast.error('Erreur lors de la génération du planning');
    } finally {
      setLoading(false);
    }
  };

  const copyOpeningHoursToOtherDays = async (fromDay: number) => {
    if (!selectedSite) return;

    const sourceHours = openingHours.find(h => h.day_of_week === fromDay);
    if (!sourceHours) return;

    try {
      const promises = DAYS_OF_WEEK
        .filter(day => day.value !== fromDay)
        .map(day => updateOpeningHours(day.value, {
          opening_time: sourceHours.opening_time,
          closing_time: sourceHours.closing_time,
          is_closed: sourceHours.is_closed
        }));

      await Promise.all(promises);
      toast.success('Heures copiées sur tous les jours');
    } catch (error) {
      console.error('Error copying hours:', error);
      toast.error('Erreur lors de la copie');
    }
  };

  const getOpeningHoursForDay = (dayOfWeek: number) => {
    return openingHours.find(h => h.day_of_week === dayOfWeek) || {
      opening_time: '09:00',
      closing_time: '18:00',
      is_closed: false
    };
  };

  const getEmployeesByExperienceLevel = (level: string) => {
    return employees.filter(emp => emp.experience_level === level).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Planning Avancé</h2>
          <p className="text-muted-foreground">Gestion avancée des plannings avec optimisation automatique</p>
        </div>
        <Button 
          onClick={() => setShowGenerationDialog(true)}
          disabled={!selectedSite}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          Générer Planning
        </Button>
      </div>

      {/* Site Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sélection du Site
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSite} onValueChange={setSelectedSite}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner un site" />
            </SelectTrigger>
            <SelectContent>
              {sites.map(site => (
                <SelectItem key={site.id} value={site.id}>
                  {site.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedSite && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nouveaux</p>
                    <p className="text-xl font-bold">{getEmployeesByExperienceLevel('NOUVEAU')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Vétérans</p>
                    <p className="text-xl font-bold">{getEmployeesByExperienceLevel('VETERANE')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Managers</p>
                    <p className="text-xl font-bold">{getEmployeesByExperienceLevel('MANAGER')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Conflits</p>
                    <p className="text-xl font-bold">{relationships.filter(r => r.relationship_type === 'CONFLICT').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowOpeningHoursDialog(true)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Heures d'Ouverture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Définir les heures d'ouverture par jour de la semaine
                </p>
                <div className="flex flex-wrap gap-1">
                  {DAYS_OF_WEEK.map(day => {
                    const hours = getOpeningHoursForDay(day.value);
                    return (
                      <Badge key={day.value} variant={hours.is_closed ? "secondary" : "default"} className="text-xs">
                        {day.label.slice(0, 3)}
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowPreferencesDialog(true)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-4 w-4" />
                  Préférences Employés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Gérer les préférences de jours et horaires des employés
                </p>
                <Badge variant="outline" className="text-xs">
                  {employees.length} employés
                </Badge>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowRelationshipsDialog(true)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Relations Employés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Configurer les relations entre employés (conflits, préférences)
                </p>
                <div className="flex gap-1">
                  <Badge variant="destructive" className="text-xs">
                    {relationships.filter(r => r.relationship_type === 'CONFLICT').length} conflits
                  </Badge>
                  <Badge variant="default" className="text-xs">
                    {relationships.filter(r => r.relationship_type === 'MENTOR_MENTEE').length} mentors
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Opening Hours Dialog */}
      <Dialog open={showOpeningHoursDialog} onOpenChange={setShowOpeningHoursDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Heures d'Ouverture - {sites.find(s => s.id === selectedSite)?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {DAYS_OF_WEEK.map(day => {
              const hours = getOpeningHoursForDay(day.value);
              return (
                <div key={day.value} className="flex items-center gap-4 p-3 border rounded">
                  <div className="w-20">
                    <Label className="font-medium">{day.label}</Label>
                  </div>
                  <Checkbox
                    checked={!hours.is_closed}
                    onCheckedChange={(checked) => 
                      updateOpeningHours(day.value, { is_closed: !checked })
                    }
                  />
                  <Label className="text-sm">Ouvert</Label>
                  {!hours.is_closed && (
                    <>
                      <Input
                        type="time"
                        value={hours.opening_time || '09:00'}
                        onChange={(e) => updateOpeningHours(day.value, { opening_time: e.target.value })}
                        className="w-32"
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={hours.closing_time || '18:00'}
                        onChange={(e) => updateOpeningHours(day.value, { closing_time: e.target.value })}
                        className="w-32"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyOpeningHoursToOtherDays(day.value)}
                      >
                        Copier
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Generation Dialog */}
      <Dialog open={showGenerationDialog} onOpenChange={setShowGenerationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Génération Automatique de Planning</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={generationParams.startDate}
                  onChange={(e) => setGenerationParams(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={generationParams.endDate}
                  onChange={(e) => setGenerationParams(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Période</Label>
              <Select value={generationParams.period} onValueChange={(value: any) => setGenerationParams(prev => ({ ...prev, period: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Jour</SelectItem>
                  <SelectItem value="week">Semaine</SelectItem>
                  <SelectItem value="biweek">2 Semaines</SelectItem>
                  <SelectItem value="month">Mois</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="prioritizeVeterans"
                  checked={generationParams.prioritizeVeterans}
                  onCheckedChange={(checked) => setGenerationParams(prev => ({ ...prev, prioritizeVeterans: checked as boolean }))}
                />
                <Label htmlFor="prioritizeVeterans">Prioriser vétérans avec nouveaux</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="respectConflicts"
                  checked={generationParams.respectConflicts}
                  onCheckedChange={(checked) => setGenerationParams(prev => ({ ...prev, respectConflicts: checked as boolean }))}
                />
                <Label htmlFor="respectConflicts">Respecter les conflits</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={generateSchedule} disabled={loading} className="flex-1">
                {loading ? 'Génération...' : 'Générer Planning'}
              </Button>
              <Button variant="outline" onClick={() => setShowGenerationDialog(false)}>
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};