import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OnboardingState, Profile, PII, KYC, Checks, Offer, Language } from './types';
import { generateSessionId } from './utils/session';

interface OnboardingStore extends OnboardingState {
  // Actions
  setLanguage: (lang: Language) => void;
  setProfile: (profile: Profile) => void;
  setPii: (pii: Partial<PII>) => void;
  setKyc: (kyc: KYC) => void;
  setChecks: (checks: Checks) => void;
  selectOffer: (offer: Offer) => void;
  setOtpSent: (sent: boolean) => void;
  markCompleted: () => void;
  requestEscalation: () => void;
  reset: () => void;
}

const initialState: OnboardingState = {
  sessionId: generateSessionId(),
  lang: 'en',
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setLanguage: (lang) => set({ lang }),
      
      setProfile: (profile) => set({ profile }),
      
      setPii: (piiUpdate) => set((state) => ({
        pii: state.pii ? { ...state.pii, ...piiUpdate } : piiUpdate as PII
      })),
      
      setKyc: (kyc) => set({ kyc }),
      
      setChecks: (checks) => set({ checks }),
      
      selectOffer: (offer) => set({ selectedOffer: offer }),
      
      setOtpSent: (sent) => set({ otpSent: sent }),
      
      markCompleted: () => set({ completed: true }),
      
      requestEscalation: () => set({ escalated: true }),
      
      reset: () => set({
        ...initialState,
        sessionId: generateSessionId(),
      }),
    }),
    {
      name: 'onboarding-session',
    }
  )
);