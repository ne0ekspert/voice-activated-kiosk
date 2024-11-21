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

  useEffect(() => {
    const fetchLangpack = async () => {
        const res = await fetch(`/locales/${language}/common.json`);
        const langpack = await res.json();
        return langpack;
    };

    fetchLangpack().then((langpack) => {
      setLangpack(langpack);
    });

  }, [language]);

  const t = (key: string) => {
    const getValue = (obj: Record<string, unknown>, path: string): string => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const result = getValue(langpack, key) || key

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