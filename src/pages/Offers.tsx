import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressHeader } from "@/components/ProgressHeader";
import { 
  CreditCard, 
  Star, 
  Gift,
  ArrowRight,
  IndianRupee,
  TrendingUp
} from "lucide-react";
import { useOnboardingStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { getOffersForProfile } from "@/lib/mockData";
import { Offer } from "@/lib/types";

interface OffersProps {
  onEscalate: () => void;
}

export default function Offers({ onEscalate }: OffersProps) {
  const navigate = useNavigate();
  const { profile, selectOffer, checks } = useOnboardingStore();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      const availableOffers = getOffersForProfile(profile.perk, profile.workType);
      setOffers(availableOffers);
      analytics.track('offer_viewed', { 
        perk: profile.perk, 
        workType: profile.workType,
        offerCount: availableOffers.length 
      });
    }
  }, [profile]);

  const handleSelectOffer = (offer: Offer) => {
    setSelectedOfferId(offer.id);
  };

  const handleContinue = () => {
    const selectedOffer = offers.find(o => o.id === selectedOfferId);
    if (!selectedOffer) return;
    
    selectOffer(selectedOffer);
    analytics.track('offer_selected', { 
      offerId: selectedOffer.id,
      offerTitle: selectedOffer.title,
      limit: selectedOffer.limit 
    });
    navigate('/terms');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getBadgeForPerk = (perk: string) => {
    switch (perk.toLowerCase()) {
      case 'travel':
        return <Badge className="bg-blue-100 text-blue-800">✈️ Travel</Badge>;
      case 'cashback':
        return <Badge className="bg-green-100 text-green-800">💰 Cashback</Badge>;
      case 'shopping':
        return <Badge className="bg-purple-100 text-purple-800">🛍️ Shopping</Badge>;
      default:
        return <Badge variant="secondary">{perk}</Badge>;
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <ProgressHeader
        currentStep={7}
        totalSteps={10}
        title="Personalized Offers"
        subtitle="Cards tailored for your lifestyle"
        onEscalate={onEscalate}
      />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-success rounded-full flex items-center justify-center mx-auto shadow-glow">
              <Gift className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Congratulations!</h2>
              <p className="text-muted-foreground">
                Based on your profile and credit check, here are the cards we recommend for you.
              </p>
            </div>
          </div>

          {/* Credit Score Display */}
          {checks?.cibil && (
            <Card className="bg-gradient-subtle border-none">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <span className="text-sm text-muted-foreground">Your CIBIL Score</span>
                  </div>
                  <div className="text-2xl font-bold text-success">
                    {checks.cibil.score}
                  </div>
                  <Badge variant="default">{checks.cibil.band}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Offers */}
          <div className="space-y-4">
            {offers.map((offer, index) => {
              const isSelected = selectedOfferId === offer.id;
              const isRecommended = index === 0;
              
              return (
                <Card
                  key={offer.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-card ${
                    isSelected ? 'ring-2 ring-primary shadow-elegant' : ''
                  } ${
                    isRecommended ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                  onClick={() => handleSelectOffer(offer)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-lg ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                          }`}>
                            <CreditCard className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">{offer.title}</h3>
                              {isRecommended && (
                                <Badge className="bg-gradient-primary text-white border-none">
                                  <Star className="h-3 w-3 mr-1" />
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <IndianRupee className="h-4 w-4" />
                                <span>Limit up to {formatCurrency(offer.limit)}</span>
                              </div>
                              <div>
                                {offer.fee === 0 ? (
                                  <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                                    No Annual Fee
                                  </Badge>
                                ) : (
                                  <span>Annual Fee: {formatCurrency(offer.fee)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>

                      {/* Perks */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Key Benefits:</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {offer.perks.map((perk, perkIndex) => (
                            <div key={perkIndex} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                              <span>{perk}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Category Badge */}
                      <div className="flex justify-between items-center">
                        {getBadgeForPerk(profile.perk)}
                        <div className="text-xs text-muted-foreground">
                          Perfect for {profile.workType} professionals
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Continue Button */}
          <div className="sticky bottom-0 bg-background pt-4 border-t">
            <Button
              variant={selectedOfferId ? "hero" : "secondary"}
              size="xl"
              className="w-full"
              onClick={handleContinue}
              disabled={!selectedOfferId}
            >
              {selectedOfferId ? (
                <>
                  Continue with Selected Card
                  <ArrowRight className="h-5 w-5" />
                </>
              ) : (
                "Select a card to continue"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}