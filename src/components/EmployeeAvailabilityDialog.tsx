import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Employee } from '@/types/scheduling';

interface EmployeeAvailabilityDialogProps {
  employee: Employee;
  onAvailabilityAdded: () => void;
}

export const EmployeeAvailabilityDialog = ({ employee, onAvailabilityAdded }: EmployeeAvailabilityDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    availabilityType: 'AVAILABLE' as 'AVAILABLE' | 'UNAVAILABLE' | 'PREFERRED',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('employee_availabilities')
        .upsert({
          employee_id: employee.id,
          date: formData.date,
          start_time: formData.startTime || null,
          end_time: formData.endTime || null,
          availability_type: formData.availabilityType,
          notes: formData.notes || null
        });

      if (error) throw error;

      toast.success('Disponibilité mise à jour');
      setOpen(false);
      setFormData({
        date: '',
        startTime: '',
        endTime: '',
        availabilityType: 'AVAILABLE',
        notes: ''
      });
      onAvailabilityAdded();
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Erreur lors de la mise à jour de la disponibilité');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="h-4 w-4 mr-2" />
          Disponibilité
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Indiquer ma disponibilité
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="availability">Type de disponibilité *</Label>
            <Select 
              value={formData.availabilityType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, availabilityType: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Disponible</SelectItem>
                <SelectItem value="PREFERRED">Préféré</SelectItem>
                <SelectItem value="UNAVAILABLE">Indisponible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.availabilityType !== 'UNAVAILABLE' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Heure de début</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endTime">Heure de fin</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Commentaires sur votre disponibilité..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};