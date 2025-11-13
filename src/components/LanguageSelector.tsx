import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X, Plus } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  // Europe
  { code: 'FR', name: 'Français', flag: '🇫🇷' },
  { code: 'EN', name: 'Anglais', flag: '🇬🇧' },
  { code: 'NL', name: 'Néerlandais', flag: '🇳🇱' },
  { code: 'DE', name: 'Allemand', flag: '🇩🇪' },
  { code: 'ES', name: 'Espagnol', flag: '🇪🇸' },
  { code: 'IT', name: 'Italien', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugais', flag: '🇵🇹' },
  { code: 'RU', name: 'Russe', flag: '🇷🇺' },
  { code: 'PL', name: 'Polonais', flag: '🇵🇱' },
  
  // Americas
  { code: 'EN-US', name: 'Anglais (États-Unis)', flag: '🇺🇸' },
  { code: 'ES-MX', name: 'Espagnol (Mexique)', flag: '🇲🇽' },
  { code: 'PT-BR', name: 'Portugais (Brésil)', flag: '🇧🇷' },
  { code: 'FR-CA', name: 'Français (Canada)', flag: '🇨🇦' },
  
  // Asia
  { code: 'ZH', name: 'Chinois', flag: '🇨🇳' },
  { code: 'JA', name: 'Japonais', flag: '🇯🇵' },
  { code: 'KO', name: 'Coréen', flag: '🇰🇷' },
  { code: 'HI', name: 'Hindi', flag: '🇮🇳' },
  { code: 'TH', name: 'Thaï', flag: '🇹🇭' },
  { code: 'VI', name: 'Vietnamien', flag: '🇻🇳' },
  { code: 'ID', name: 'Indonésien', flag: '🇮🇩' },
  
  // Middle East & Africa
  { code: 'AR', name: 'Arabe', flag: '🇸🇦' },
  { code: 'TR', name: 'Turc', flag: '🇹🇷' },
  { code: 'FA', name: 'Persan', flag: '🇮🇷' },
  { code: 'HE', name: 'Hébreu', flag: '🇮🇱' },
  { code: 'SW', name: 'Swahili', flag: '🇰🇪' },
  { code: 'AM', name: 'Amharique', flag: '🇪🇹' },
  { code: 'IG', name: 'Igbo', flag: '🇳🇬' },
  { code: 'YO', name: 'Yoruba', flag: '🇳🇬' },
  { code: 'ZU', name: 'Zoulou', flag: '🇿🇦' },
  { code: 'AF', name: 'Afrikaans', flag: '🇿🇦' }
];

interface LanguageSelectorProps {
  value: string[];
  onChange: (languages: string[]) => void;
  label?: string;
  placeholder?: string;
}

export const LanguageSelector = ({ 
  value = [], 
  onChange, 
  label = "Langues parlées",
  placeholder = "Sélectionner une langue"
}: LanguageSelectorProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  const addLanguage = () => {
    if (selectedLanguage && !value.includes(selectedLanguage)) {
      onChange([...value, selectedLanguage]);
      setSelectedLanguage('');
    }
  };

  const removeLanguage = (languageCode: string) => {
    onChange(value.filter(lang => lang !== languageCode));
  };

  const getLanguageInfo = (code: string) => {
    return LANGUAGES.find(lang => lang.code === code) || { code, name: code, flag: '🌐' };
  };

  const availableLanguages = LANGUAGES.filter(lang => !value.includes(lang.code));

  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      
      {/* Selected languages */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 mb-3">
          {value.map((langCode) => {
            const lang = getLanguageInfo(langCode);
            return (
              <div
                key={langCode}
                className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md text-sm"
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeLanguage(langCode)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new language */}
      <div className="flex gap-2">
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {availableLanguages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLanguage}
          disabled={!selectedLanguage || value.includes(selectedLanguage)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};