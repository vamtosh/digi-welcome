import React, { createContext, useContext, ReactNode } from 'react';

interface VoiceNavigationContextType {
  currentPage: string;
  currentField: string;
  onFormUpdate: (updates: Record<string, any>) => void;
  onNavigation: (action: string) => void;
  formContext: any;
}

const VoiceNavigationContext = createContext<VoiceNavigationContextType | null>(null);

interface VoiceNavigationProviderProps {
  children: ReactNode;
  currentPage: string;
  currentField: string;
  onFormUpdate: (updates: Record<string, any>) => void;
  onNavigation: (action: string) => void;
  formContext: any;
}

export function VoiceNavigationProvider({
  children,
  currentPage,
  currentField,
  onFormUpdate,
  onNavigation,
  formContext
}: VoiceNavigationProviderProps) {
  return (
    <VoiceNavigationContext.Provider
      value={{
        currentPage,
        currentField,
        onFormUpdate,
        onNavigation,
        formContext
      }}
    >
      {children}
    </VoiceNavigationContext.Provider>
  );
}

export function useVoiceNavigation() {
  const context = useContext(VoiceNavigationContext);
  if (!context) {
    throw new Error('useVoiceNavigation must be used within a VoiceNavigationProvider');
  }
  return context;
}
