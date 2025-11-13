import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Upload, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Employee } from '@/types/scheduling';

interface EmployeeSickLeaveDialogProps {
  employee: Employee;
  onLeaveAdded: () => void;
}

export const EmployeeSickLeaveDialog = ({ employee, onLeaveAdded }: EmployeeSickLeaveDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    medicalCertificate: null as File | null
  });

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${employee.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('medical-certificates')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      return fileName;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erreur lors du téléchargement du fichier');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let certificateUrl = null;
      
      if (formData.medicalCertificate) {
        certificateUrl = await handleFileUpload(formData.medicalCertificate);
        if (!certificateUrl) {
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('employee_sick_leaves')
        .insert({
          employee_id: employee.id,
          start_date: formData.startDate,
          end_date: formData.endDate,
          reason: formData.reason || null,
          medical_certificate_url: certificateUrl,
          status: 'PENDING'
        });

      if (error) throw error;

      toast.success('Déclaration de maladie enregistrée');
      setOpen(false);
      setFormData({
        startDate: '',
        endDate: '',
        reason: '',
        medicalCertificate: null
      });
      onLeaveAdded();
    } catch (error) {
      console.error('Error creating sick leave:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Heart className="h-4 w-4 mr-2" />
          Déclarer Maladie
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Déclaration de maladie
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Date de début *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">Date de fin *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Motif (optionnel)</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Description de la maladie..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="certificate">Certificat médical (optionnel)</Label>
            <div className="mt-2">
              <Input
                id="certificate"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setFormData(prev => ({ ...prev, medicalCertificate: file }));
                }}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formats acceptés: PDF, JPG, PNG (max 5MB)
              </p>
            </div>
          </div>

          {formData.medicalCertificate && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">
                {formData.medicalCertificate.name}
              </span>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Information:</strong> Votre déclaration sera transmise à votre manager pour validation. 
              Le certificat médical, s'il est fourni, restera confidentiel.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || uploading}>
              {loading ? 'Enregistrement...' : uploading ? 'Upload...' : 'Déclarer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};