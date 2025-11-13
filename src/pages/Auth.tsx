import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, UserPlus, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import OtpVerification from '@/components/OtpVerification';

export default function Auth() {
  const { signIn, signUp, signInWithOtp, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [verificationPhone, setVerificationPhone] = useState('');
  
  // Sign In form
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Sign Up form
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');

  // Check for invitation token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteToken = urlParams.get('invite');
    
    if (inviteToken) {
      loadInvitationData(inviteToken);
    }
  }, []);

  const loadInvitationData = async (token: string) => {
    setLoadingInvitation(true);
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('invitation_token', token)
        .eq('is_used', false)
        .gt('invitation_expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        toast.error('Lien d\'invitation invalide ou expiré');
        return;
      }

      setInvitationData(data);
      setSignUpEmail(data.email);
      setFirstName(data.first_name || '');
      setLastName(data.last_name || '');
      setCompanyName(data.company_name || '');
      
      toast.success(`Invitation trouvée pour ${data.email}`);
    } catch (error) {
      console.error('Error loading invitation:', error);
      toast.error('Erreur lors du chargement de l\'invitation');
    } finally {
      setLoadingInvitation(false);
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      window.location.href = '/';
    }
  }, [user, loading]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(signInEmail, signInPassword);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email ou mot de passe incorrect');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Veuillez confirmer votre email avant de vous connecter');
      } else {
        toast.error('Erreur de connexion: ' + error.message);
      }
    } else {
      toast.success('Connexion réussie!');
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword || !firstName || !lastName || !companyName) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (signUpPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Validation du numéro de téléphone si fourni
    if (phone && !phone.match(/^\+[1-9]\d{10,14}$/)) {
      toast.error('Format de téléphone invalide (exemple: +33123456789)');
      return;
    }

    setIsLoading(true);
    
    // Si un numéro de téléphone est fourni, utiliser l'authentification SMS
    if (phone) {
      const { error } = await signInWithOtp(phone);
      if (error) {
        toast.error('Erreur d\'envoi SMS: ' + error.message);
        setIsLoading(false);
        return;
      }
      setVerificationPhone(phone);
      setShowOtpVerification(true);
      toast.success('Code SMS envoyé!');
    } else {
      // Sinon, utiliser l'inscription classique par email
      const { error } = await signUp(signUpEmail, signUpPassword, firstName, lastName, companyName, phone);
      
      if (error) {
        if (error.message.includes('User already registered')) {
          toast.error('Cet email est déjà utilisé');
        } else {
          toast.error('Erreur d\'inscription: ' + error.message);
        }
      } else {
        toast.success('Inscription réussie! Vérifiez votre email pour confirmer votre compte. Vous serez automatiquement connecté après validation.');
      }
    }
    setIsLoading(false);
  };

  const handleResendOtp = async () => {
    if (verificationPhone) {
      return await signInWithOtp(verificationPhone);
    }
  };

  const handleBackFromOtp = () => {
    setShowOtpVerification(false);
    setVerificationPhone('');
  };

  if (loading || loadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show OTP verification if needed
  if (showOtpVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <OtpVerification 
          phone={verificationPhone}
          onBack={handleBackFromOtp}
          onResend={handleResendOtp}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {invitationData ? 'Finaliser votre inscription' : 'Gestion du Personnel'}
          </CardTitle>
          <CardDescription>
            {invitationData ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Vous avez été invité(e)</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {invitationData.role === 'EMPLOYEE' ? 'Employé' : 'Super Manager'}
                </Badge>
              </div>
            ) : (
              'Connectez-vous pour accéder à votre système de planification'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={invitationData ? "signup" : "signin"} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Connexion</TabsTrigger>
              <TabsTrigger value="signup">
                {invitationData ? 'Finaliser' : 'Inscription'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Mot de passe</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              {invitationData && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Building className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Invitation de {invitationData.company_name || 'votre entreprise'}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Créez votre mot de passe pour finaliser votre inscription
                  </p>
                </div>
              )}
              
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">Prénom</Label>
                    <Input
                      id="first-name"
                      placeholder="Prénom"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={!!invitationData}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Nom</Label>
                    <Input
                      id="last-name"
                      placeholder="Nom"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={!!invitationData}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nom de l'entreprise</Label>
                  <Input
                    id="company-name"
                    placeholder="Nom de votre entreprise"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required={!invitationData}
                    disabled={!!invitationData}
                  />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="signup-email">Email</Label>
                   <Input
                     id="signup-email"
                     type="email"
                     placeholder="votre@email.com"
                     value={signUpEmail}
                     onChange={(e) => setSignUpEmail(e.target.value)}
                     required
                     disabled={!!invitationData}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="phone">Téléphone (optionnel)</Label>
                   <Input
                     id="phone"
                     type="tel"
                     placeholder="+33123456789"
                     value={phone}
                     onChange={(e) => setPhone(e.target.value)}
                   />
                   <p className="text-xs text-muted-foreground">
                     Format international pour recevoir un code SMS
                   </p>
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="signup-password">Mot de passe</Label>
                   <Input
                     id="signup-password"
                     type="password"
                     placeholder="••••••••"
                     value={signUpPassword}
                     onChange={(e) => setSignUpPassword(e.target.value)}
                     required={!phone}
                   />
                   <p className="text-sm text-muted-foreground">
                     {phone ? 'Optionnel avec SMS' : 'Au moins 6 caractères'}
                   </p>
                 </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inscription...
                    </>
                  ) : (
                    'S\'inscrire'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}