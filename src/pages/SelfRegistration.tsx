import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PhoneInput } from '@/components/ui/phone-input';
import { LanguageSelector } from '@/components/LanguageSelector';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ContractType } from '@/types/scheduling';

export const SelfRegistration = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inviteToken = searchParams.get('invite');
  const isQuick = searchParams.get('quick') === 'true';
  const birthRequired = searchParams.get('birthRequired') === 'true';
  
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    contractType: 'CDI' as ContractType,
    hourlyRate: '',
    weeklyHours: '40',
    languages: ['FR'] as string[]
  });

  useEffect(() => {
    if (inviteToken) {
      loadInvitationData();
    }
  }, [inviteToken]);

  const loadInvitationData = async () => {
    try {
      const { data: invitation, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('invitation_token', inviteToken)
        .eq('is_used', false)
        .gt('invitation_expires_at', new Date().toISOString())
        .single();

      if (error || !invitation) {
        toast.error('Lien d\'invitation invalide ou expiré');
        navigate('/auth');
        return;
      }

      setInvitationData(invitation);
      
      // Pre-fill form with invitation data if available
      if (!isQuick) {
        const employeeData = invitation.employee_data as any;
        setFormData(prev => ({
          ...prev,
          email: invitation.email || '',
          firstName: invitation.first_name || '',
          lastName: invitation.last_name || '',
          phone: employeeData?.phone || '',
          contractType: employeeData?.contract_type || 'CDI',
          hourlyRate: employeeData?.hourly_rate?.toString() || '',
          weeklyHours: employeeData?.weekly_hours?.toString() || '40',
          languages: employeeData?.languages || ['FR']
        }));
      }
    } catch (error) {
      console.error('Error loading invitation:', error);
      toast.error('Erreur lors du chargement de l\'invitation');
      navigate('/auth');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    
    try {
      // Update invitation with employee data if it's a quick registration
      if (isQuick && invitationData) {
        const employeeData = {
          phone: formData.phone || '',
          birth_date: formData.birthDate || null,
          contract_type: 'CDI', // Default pour inscription rapide
          hourly_rate: 0,
          weekly_hours: 40,
          languages: ['FR'],
          employee_number: `EMP${Date.now()}`
        };

        await supabase
          .from('invitations')
          .update({
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            employee_data: employeeData
          })
          .eq('id', invitationData.id);
      }

      // Sign up user
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            invitation_token: inviteToken
          }
        }
      });

      if (signUpError) throw signUpError;

      toast.success('Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte.');
      navigate('/auth');

    } catch (error) {
      console.error('Error during registration:', error);
      toast.error('Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  if (!inviteToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Lien invalide</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Ce lien d'invitation n'est pas valide.</p>
            <Button 
              className="w-full mt-4" 
              onClick={() => navigate('/auth')}
            >
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-[600px]">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {isQuick ? 'Inscription Employé' : 'Finaliser votre inscription'}
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            {isQuick 
              ? 'Remplissez vos informations pour rejoindre l\'équipe'
              : 'Créez votre mot de passe pour accéder à votre compte'
            }
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                  disabled={!isQuick && !!invitationData?.first_name}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                  disabled={!isQuick && !!invitationData?.last_name}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                disabled={!isQuick && !!invitationData?.email}
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone {isQuick ? '(optionnel)' : '*'}</Label>
              <PhoneInput
                value={formData.phone}
                onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                required={!isQuick}
              />
            </div>

            <div>
              <Label htmlFor="birthDate">Date de naissance {(isQuick && !birthRequired) ? '(optionnel)' : '*'}</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                required={!isQuick || birthRequired}
              />
            </div>

            <div>
              <LanguageSelector
                value={formData.languages}
                onChange={(languages) => setFormData(prev => ({ ...prev, languages }))}
                label="Langues parlées *"
                placeholder="Ajouter une langue"
              />
            </div>

            {/* Champs simplifiés pour inscription rapide */}
            {isQuick ? (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Inscription rapide :</strong> Vos informations de contrat seront définies par votre manager après inscription.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="contractType">Type de contrat / Statut *</Label>
                  <Select 
                    value={formData.contractType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contractType: value as ContractType }))}
                    disabled={!isQuick && !!invitationData?.employee_data?.contract_type}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDI">CDI</SelectItem>
                      <SelectItem value="CDD">CDD</SelectItem>
                      <SelectItem value="STUDENT">Étudiant</SelectItem>
                      <SelectItem value="INTERN">Stagiaire</SelectItem>
                      <SelectItem value="FREELANCE">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="hourlyRate">Taux horaire (€)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weeklyHours">
                      {formData.contractType === 'STUDENT' ? 'Heures/sem. (fixe)' : 'Heures/semaine'}
                    </Label>
                    <Input
                      id="weeklyHours"
                      type="number"
                      value={formData.weeklyHours}
                      onChange={(e) => setFormData(prev => ({ ...prev, weeklyHours: e.target.value }))}
                      placeholder={formData.contractType === 'STUDENT' ? 'Optionnel' : '40'}
                    />
                  </div>
                  <div>
                    <LanguageSelector
                      value={formData.languages}
                      onChange={(languages) => setFormData(prev => ({ ...prev, languages }))}
                      label="Langues parlées *"
                      placeholder="Ajouter une langue"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {formData.contractType === 'STUDENT' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Étudiant :</strong> Vos heures sont variables. Les heures/semaine indiquées sont vos heures de base fixes.
                  Les heures supplémentaires seront ajoutées selon vos disponibilités.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};