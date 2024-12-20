'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { CatalogItem } from '@/pages/api/items';
import { useLanguage } from './languageContext';

const CatalogContext = createContext<CatalogItem[] | undefined>(undefined);

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};

export const CatalogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const language = useLanguage();

  useEffect(() => {
    const fetchCatalog = async () => {
      const response = await fetch('/api/items', {
        headers: {
          'accept-language': language.language
        }
      });
      const data = await response.json();
      setCatalog(data);
    };
    fetchCatalog();
  }, [language.language]);

  return (
    <CatalogContext.Provider value={catalog}>
      {children}
    </CatalogContext.Provider>
  );
};