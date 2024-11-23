'use client'
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const LanguageContext = createContext<{
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<string>('en');
  const [langpack, setLangpack] = useState({});

  type LangpackType = {
    [key: string]: string | LangpackType;
  };

  useEffect(() => {
    const fetchLangpack = async () => {
        const res = await fetch(`/locales/${language}/common.json`);
        const langpack: LangpackType = await res.json();
        return langpack;
    };

    fetchLangpack().then((langpack) => {
      setLangpack(langpack);
    });

  }, [language]);

  const t = (key: string) => {
    const getValue = (obj: LangpackType, path: string): string | undefined => {
      return path.split('.').reduce((acc: LangpackType | string, part: string) => {
        // If acc is an object (LangpackType), access the property
        if (typeof acc === 'object' && acc !== null && part in acc) {
          return acc[part]; // Safe property access
        }
        return part; // Return undefined if not an object or property doesn't exist
      }, obj) as string; // Cast the initial value to LangpackType
    };

    const result = getValue(langpack, key) || key;

    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}