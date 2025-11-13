import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar, User, Clock, FileText, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  user_email: string | null;
  user_role: 'ADMIN' | 'SUPER_MANAGER' | 'EMPLOYEE' | 'MANAGER' | null; // Added MANAGER temporarily
  table_name: string;
  action: string;
  action_description: string | null;
  created_at: string;
  old_data?: any;
  new_data?: any;
}

interface AuditLogDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AuditLogDialog = ({ open: externalOpen, onOpenChange }: AuditLogDialogProps = {}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (searchTerm) {
        query = query.or(`user_email.ilike.%${searchTerm}%,action_description.ilike.%${searchTerm}%,table_name.ilike.%${searchTerm}%`);
      }

      if (dateFilter) {
        const startDate = new Date(dateFilter);
        const endDate = new Date(dateFilter);
        endDate.setDate(endDate.getDate() + 1);
        query = query.gte('created_at', startDate.toISOString())
                   .lt('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      toast.error('Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'SUPER_MANAGER': return 'bg-blue-100 text-blue-800';
      case 'MANAGER': return 'bg-purple-100 text-purple-800';
      case 'EMPLOYEE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-green-100 text-green-800';
      case 'UPDATE': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) loadAuditLogs();
    }}>
      {/* Pas de DialogTrigger par défaut - contrôlé depuis la sidebar */}
      <DialogContent className="max-w-6xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Journal des Modifications (Audit Trail)
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par utilisateur, action ou table..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filtrer par date"
              />
            </div>
            <Button onClick={loadAuditLogs} disabled={loading}>
              {loading ? 'Chargement...' : 'Actualiser'}
            </Button>
          </div>

          {/* Logs List */}
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {logs.map((log) => (
                <Card key={log.id} className="transition-colors hover:bg-muted/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{log.user_email}</span>
                        <Badge className={getRoleColor(log.user_role)}>
                          {log.user_role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDate(log.created_at)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                      <span className="text-sm">
                        {log.action_description} sur <strong>{log.table_name}</strong>
                      </span>
                    </div>
                    
                    {/* Show changes for UPDATE actions */}
                    {log.action === 'UPDATE' && log.old_data && log.new_data && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">Changements détectés:</p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="font-medium text-red-600">Avant:</p>
                            <pre className="mt-1 bg-red-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.old_data, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <p className="font-medium text-green-600">Après:</p>
                            <pre className="mt-1 bg-green-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.new_data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Show data for INSERT/DELETE actions */}
                    {(log.action === 'INSERT' || log.action === 'DELETE') && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">
                          Données {log.action === 'INSERT' ? 'ajoutées' : 'supprimées'}:
                        </p>
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.action === 'INSERT' ? log.new_data : log.old_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {logs.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune modification trouvée</p>
                  <p className="text-sm">Les modifications apparaîtront ici une fois que des actions seront effectuées</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};