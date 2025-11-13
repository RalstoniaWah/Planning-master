import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AddSiteDialogProps {
  onSiteAdded: () => void;
  triggerText?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AddSiteDialog = ({ onSiteAdded, triggerText, open: externalOpen, onOpenChange }: AddSiteDialogProps) => {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    email: '',
    capacity: 10
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('sites')
        .insert({
          user_id: user.id,
          code: formData.code,
          name: formData.name,
          address: formData.address,
          contact_info: {
            phone: formData.phone,
            email: formData.email
          },
          capacity: formData.capacity,
          opening_hours: {},
          active: true
        });

      if (error) throw error;

      toast.success('Site créé avec succès');
      setOpen(false);
      setFormData({
        code: '',
        name: '',
        address: '',
        phone: '',
        email: '',
        capacity: 10
      });
      onSiteAdded();
    } catch (error) {
      console.error('Error creating site:', error);
      toast.error('Erreur lors de la création du site');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerText ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {triggerText}
          </Button>
        </DialogTrigger>
      ) : (
        <span>{/* Pas de bouton par défaut - contrôlé depuis la sidebar */}</span>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau site</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code Site*</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="ex: MAG001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nom du Site*</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ex: Magasin Centre-ville"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Adresse*</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Adresse complète du site"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="ex: +32 2 123 45 67"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="ex: site@entreprise.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacité maximale</Label>
            <Input
              id="capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 10 }))}
              min="1"
              placeholder="Nombre max d'employés"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le Site'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};