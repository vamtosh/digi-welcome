import { ApiResponse, Address, KYC, Checks } from './types';
import { 
  getPersonByPan, 
  getCibilScore, 
  getCibilBand, 
  isServiceable,
  getAddressSuggestions 
} from './mockData';
import { hashPan } from './utils/session';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // OCR APIs
  async ocrPan(imageBase64: string): Promise<ApiResponse> {
    await delay(800 + Math.random() * 400);
    
    // Simulate 85% success rate
    if (Math.random() < 0.15) {
      return {
        success: false,
        error: "Could not read PAN clearly. Please try again with better lighting."
      };
    }
    
    const mockPerson = getPersonByPan("ABCDE1234F");
    return {
      success: true,
      data: {
        pan: mockPerson.pan,
        name: mockPerson.name,
        dob: mockPerson.dob,
        confidence: 0.94
      }
    };
  },

  async ocrAddress(imageBase64: string): Promise<ApiResponse> {
    await delay(600 + Math.random() * 600);
    
    if (Math.random() < 0.1) {
      return {
        success: false,
        error: "Document not clear. Please capture again."
      };
    }
    
    return {
      success: true,
      data: {
        address: "118-35 Queens Boulevard, Apt 4B",
        pincode: "400001",
        city: "Mumbai",
        state: "Maharashtra",
        confidence: 0.91
      }
    };
  },

  // Serviceability check
  async checkServiceability(pincode: string): Promise<ApiResponse> {
    await delay(300 + Math.random() * 300);
    
    return {
      success: true,
      data: {
        serviceable: isServiceable(pincode),
        pincode
      }
    };
  },

  // KYC liveness
  async verifyLiveness(selfieBase64: string, panImageBase64?: string): Promise<ApiResponse<KYC>> {
    await delay(1200 + Math.random() * 800);
    
    // 85% success rate
    const isLive = Math.random() < 0.85;
    const faceMatchScore = isLive ? 0.82 + Math.random() * 0.16 : 0.65 + Math.random() * 0.15;
    
    return {
      success: true,
      data: {
        isLive,
        faceMatchScore
      }
    };
  },

  // Background checks
  async runBackgroundChecks(pan: string, address: Address): Promise<ApiResponse<Checks>> {
    await delay(2000 + Math.random() * 2000);
    
    const cibilScore = getCibilScore(pan);
    const hash = parseInt(hashPan(pan)) % 100;
    
    return {
      success: true,
      data: {
        panVerified: true,
        cibil: {
          score: cibilScore,
          band: getCibilBand(cibilScore)
        },
        pepAml: hash < 5 ? 'review' : 'clear', // 5% chance of review
        addressOk: isServiceable(address.pincode)
      }
    };
  },

  // OTP
  async sendOtp(mobile: string): Promise<ApiResponse> {
    await delay(500 + Math.random() * 500);
    
    // Generate mock OTP for demo
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`🔐 Demo OTP for ${mobile}: ${mockOtp}`);
    
    return {
      success: true,
      data: {
        sent: true,
        mockOtp // In real app, this wouldn't be returned
      }
    };
  },

  async verifyOtp(otp: string, expectedOtp?: string): Promise<ApiResponse> {
    await delay(300 + Math.random() * 300);
    
    // For demo, accept any 6-digit OTP or the mock one
    const isValid = otp.length === 6 && /^\d{6}$/.test(otp);
    
    return {
      success: isValid,
      data: isValid ? { verified: true } : undefined,
      error: isValid ? undefined : "Invalid OTP. Please try again."
    };
  },

  // Address suggestions
  async getAddressSuggestions(query: string): Promise<ApiResponse<Address[]>> {
    await delay(200 + Math.random() * 200);
    
    return {
      success: true,
      data: getAddressSuggestions(query)
    };
  }
};