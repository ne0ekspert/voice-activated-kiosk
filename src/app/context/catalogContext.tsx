'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { CatalogItem } from '../api/items/route';

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

  useEffect(() => {
    const fetchCatalog = async () => {
      const response = await fetch('/api/items');
      const data = await response.json();
      setCatalog(data);
    };
    fetchCatalog();
  }, []);

  return (
    <CatalogContext.Provider value={catalog}>
      {children}
    </CatalogContext.Provider>
  );
};