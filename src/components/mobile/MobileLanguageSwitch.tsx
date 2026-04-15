import { ChevronLeft, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: 'us' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: 'jp' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: 'kr' },
  { code: 'zh', name: 'Traditional Chinese', nativeName: '繁体中文', flag: 'tw' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: 'th' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: 'vn' },
  { code: 'fr', name: 'French', nativeName: 'français', flag: 'fr' },
  { code: 'de', name: 'German', nativeName: 'Deutsche', flag: 'de' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский язык', flag: 'ru' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: 'es' },
];

interface MobileLanguageSwitchProps {
  onBack: () => void;
}

export default function MobileLanguageSwitch({ onBack }: MobileLanguageSwitchProps) {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center px-4 h-14 border-b border-gray-100 sticky top-0 bg-white z-10">
        <button onClick={onBack} className="p-1 -ml-1">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="flex-1 text-center text-lg font-medium mr-6">
          {t('language_switch')}
        </h1>
      </div>

      {/* Language List */}
      <div className="flex-1 overflow-y-auto pb-24">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className="w-full flex items-center px-4 py-4 border-b border-gray-50 active:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-6 mr-4 flex-shrink-0 overflow-hidden rounded-sm shadow-sm border border-gray-100">
              <img 
                src={`https://flagcdn.com/w80/${lang.flag}.png`} 
                className="w-full h-full object-cover" 
                alt={lang.name}
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="flex-1 text-left text-[15px] text-gray-700">
              {lang.nativeName}
            </span>
            {i18n.language.startsWith(lang.code) && (
              <Check className="w-5 h-5 text-yellow-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
