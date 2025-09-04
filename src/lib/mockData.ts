import { Address, Offer, Perk, WorkType } from './types';

export const mockAddresses: Address[] = [
  {
    line1: "118-35 Queens Boulevard",
    line2: "Apt 4B",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    serviceable: true
  },
  {
    line1: "45 MG Road",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
    serviceable: true
  },
  {
    line1: "23 Connaught Place",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110001",
    serviceable: true
  },
  {
    line1: "67 Park Street",
    city: "Kolkata",
    state: "West Bengal",
    pincode: "700016",
    serviceable: true
  },
  {
    line1: "89 Anna Salai",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600002",
    serviceable: true
  },
  // Non-serviceable areas
  {
    line1: "Remote Village Road",
    city: "Remote Village",
    state: "Himachal Pradesh",
    pincode: "177001",
    serviceable: false
  }
];

export const mockPeople = [
  { pan: "ABCDE1234F", name: "Santosh Selvam", dob: "1990-05-09" },
  { pan: "FGHIJ5678K", name: "Priya Sharma", dob: "1988-12-15" },
  { pan: "KLMNO9012P", name: "Rajesh Kumar", dob: "1985-03-22" },
];

export const offersByPerk: Record<Perk, Offer[]> = {
  travel: [
    {
      id: "travel_plus",
      title: "Travel Plus",
      limit: 120000,
      fee: 500,
      perks: ["4x Airport Lounge Access", "0% Forex Markup", "5% on Travel Bookings"]
    },
    {
      id: "wanderlust",
      title: "Wanderlust Premium",
      limit: 200000,
      fee: 1500,
      perks: ["Unlimited Lounge Access", "Travel Insurance", "10% on Hotels"]
    }
  ],
  cashback: [
    {
      id: "cashback_go",
      title: "Cashback Go",
      limit: 90000,
      fee: 0,
      perks: ["5% on Groceries", "2% on Fuel", "1% on All Spends"]
    },
    {
      id: "rewards_max",
      title: "Rewards Max",
      limit: 150000,
      fee: 750,
      perks: ["10% on Dining", "5% on Shopping", "2% on All Spends"]
    }
  ],
  shopping: [
    {
      id: "shopping_star",
      title: "Shopping Star",
      limit: 100000,
      fee: 299,
      perks: ["10% on E-commerce", "5% on Fashion", "Special Sale Access"]
    },
    {
      id: "lifestyle_premium",
      title: "Lifestyle Premium",
      limit: 180000,
      fee: 999,
      perks: ["15% on Premium Brands", "Personal Shopper", "Exclusive Events"]
    }
  ]
};

export const mockServiceablePincodes = [
  "110001", "400001", "560001", "700016", "600002", "500001", "380001", 
  "411001", "302001", "226001", "160001", "395001", "721001", "781001"
];

export function getAddressSuggestions(query: string): Address[] {
  return mockAddresses.filter(addr => 
    addr.line1.toLowerCase().includes(query.toLowerCase()) ||
    addr.city.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);
}

export function getPersonByPan(pan: string) {
  const hash = parseInt(pan.slice(-1), 36) % mockPeople.length;
  return mockPeople[hash];
}

export function getCibilScore(pan: string): number {
  // Generate deterministic score based on PAN
  const hash = pan.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 620 + (hash % 200); // Score between 620-820
}

export function getCibilBand(score: number): string {
  if (score >= 750) return "Excellent";
  if (score >= 700) return "Good";
  if (score >= 650) return "Fair";
  return "Poor";
}

export function isServiceable(pincode: string): boolean {
  return mockServiceablePincodes.includes(pincode);
}

export function getOffersForProfile(perk: Perk, workType: WorkType): Offer[] {
  const baseOffers = offersByPerk[perk];
  
  // Adjust limits based on work type
  return baseOffers.map(offer => ({
    ...offer,
    limit: workType === 'student' 
      ? Math.round(offer.limit * 0.5)
      : workType === 'self'
      ? Math.round(offer.limit * 0.8)
      : offer.limit
  }));
}