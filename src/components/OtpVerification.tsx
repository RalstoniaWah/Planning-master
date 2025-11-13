import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Smartphone } from 'lucide-react';

interface OtpVerificationProps {
  phone: string;
  onBack: () => void;
  onResend: () => void;
}

export default function OtpVerification({ phone, onBack, onResend }: OtpVerificationProps) {
  const { verifyOtp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Veuillez entrer le code à 6 chiffres');
      return;
    }

    setIsLoading(true);
    const { error } = await verifyOtp(phone, otp);
    
    if (error) {
      if (error.message.includes('Invalid token')) {
        toast.error('Code OTP invalide');
      } else if (error.message.includes('expired')) {
        toast.error('Code OTP expiré');
      } else {
        toast.error('Erreur de vérification: ' + error.message);
      }
    } else {
      toast.success('Vérification réussie!');
    }
    setIsLoading(false);
  };

  const handleResend = async () => {
    setIsLoading(true);
    await onResend();
    setIsLoading(false);
    toast.success('Code renvoyé!');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">
          Vérification SMS
        </CardTitle>
        <CardDescription>
          Un code à 6 chiffres a été envoyé au {phone}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="otp" className="text-center block">
            Code de vérification
          </Label>
          <div className="flex justify-center">
            <InputOTP
              id="otp"
              maxLength={6}
              value={otp}
              onChange={setOtp}
              onComplete={handleVerifyOtp}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleVerifyOtp} 
            className="w-full" 
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vérification...
              </>
            ) : (
              'Vérifier le code'
            )}
          </Button>

          <div className="flex justify-between">
            <Button 
              variant="ghost" 
              onClick={onBack}
              disabled={isLoading}
              className="text-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleResend}
              disabled={isLoading}
              className="text-sm"
            >
              Renvoyer le code
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Le code expire dans 5 minutes
        </p>
      </CardContent>
    </Card>
  );
}