export type Language = 'en' | 'hi' | 'ta';

export type WorkType = 'salaried' | 'self' | 'student';
export type Perk = 'cashback' | 'travel' | 'shopping';

export interface Profile {
  workType: WorkType;
  perk: Perk;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  serviceable?: boolean;
}

export interface PII {
  pan: string;
  name?: string;
  dob?: string;
  addresses: {
    current: Address;
    permanent?: Address;
  };
}

export interface KYC {
  isLive: boolean;
  faceMatchScore: number;
}

export interface Checks {
  panVerified: boolean;
  cibil: {
    score: number;
    band: string;
  };
  pepAml: 'clear' | 'review';
  addressOk: boolean;
}

export interface Offer {
  id: string;
  title: string;
  limit: number;
  fee: number;
  perks: string[];
  image?: string;
}

export interface OnboardingState {
  sessionId: string;
  lang: Language;
  profile?: Profile;
  pii?: PII;
  kyc?: KYC;
  checks?: Checks;
  selectedOffer?: Offer;
  otpSent?: boolean;
  completed?: boolean;
  escalated?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Analytics events
export type AnalyticsEvent = 
  | 'landing_yes'
  | 'start_perk_selected'
  | 'pan_capture_mode'
  | 'pan_validated'
  | 'address_serviceable'
  | 'kyc_pass'
  | 'checks_done'
  | 'offer_viewed'
  | 'offer_selected'
  | 'terms_accepted'
  | 'otp_verified'
  | 'onboarding_success'
  | 'escalation_requested'
  | 'language_changed';