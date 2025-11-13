import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

const countries = [
  { code: 'BE', dialCode: '+32', flag: '🇧🇪', name: 'Belgique' },
  { code: 'FR', dialCode: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'NL', dialCode: '+31', flag: '🇳🇱', name: 'Pays-Bas' },
  { code: 'DE', dialCode: '+49', flag: '🇩🇪', name: 'Allemagne' },
  { code: 'GB', dialCode: '+44', flag: '🇬🇧', name: 'Royaume-Uni' },
  { code: 'US', dialCode: '+1', flag: '🇺🇸', name: 'États-Unis' },
  { code: 'CA', dialCode: '+1', flag: '🇨🇦', name: 'Canada' },
  { code: 'IT', dialCode: '+39', flag: '🇮🇹', name: 'Italie' },
  { code: 'ES', dialCode: '+34', flag: '🇪🇸', name: 'Espagne' },
  { code: 'CH', dialCode: '+41', flag: '🇨🇭', name: 'Suisse' },
];

export const PhoneInput = ({ 
  value, 
  onChange, 
  label, 
  placeholder = "123456789",
  required = false,
  disabled = false 
}: PhoneInputProps) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');

  React.useEffect(() => {
    // Parse existing value if provided
    if (value) {
      const country = countries.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.replace(country.dialCode, ''));
      }
    }
  }, [value]);

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      onChange(country.dialCode + phoneNumber);
    }
  };

  const handlePhoneChange = (phone: string) => {
    // Remove leading zero if present
    const cleanPhone = phone.startsWith('0') ? phone.slice(1) : phone;
    setPhoneNumber(cleanPhone);
    onChange(selectedCountry.dialCode + cleanPhone);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Select 
          value={selectedCountry.code} 
          onValueChange={handleCountryChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-32">
            <SelectValue>
              <div className="flex items-center gap-2">
                <span>{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.dialCode}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.dialCode}</span>
                  <span className="text-sm text-muted-foreground">{country.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Input
          type="tel"
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="flex-1"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Format: {selectedCountry.dialCode} + numéro sans le 0
      </p>
    </div>
  );
};