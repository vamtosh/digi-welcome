import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Copy, 
  Wallet,
  Smartphone,
  Gift,
  ArrowRight,
  CheckCircle,
  Sparkles
} from "lucide-react";
import { useOnboardingStore } from "@/lib/store";
import { toast } from "sonner";

export default function Success() {
  const { selectedOffer } = useOnboardingStore();
  const [showConfetti, setShowConfetti] = useState(true);
  const [cardRevealed, setCardRevealed] = useState(false);

  // Mock card details
  const cardNumber = "4532 1234 5678 9012";
  const expiryDate = "12/28";
  const cvv = "123";
  const cardholderName = "SANTOSH SELVAM";

  useEffect(() => {
    // Show confetti animation
    setTimeout(() => setShowConfetti(false), 3000);
    
    // Reveal card with animation
    setTimeout(() => setCardRevealed(true), 1000);
  }, []);

  if (!selectedOffer) {
    return <div>Loading...</div>;
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const maskCardNumber = (number: string) => {
    const clean = number.replace(/\s/g, '');
    return `${clean.slice(0, 4)} ${'****'.repeat(2)} ${clean.slice(-4)}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent animate-pulse"></div>
          {/* Animated sparkles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <Sparkles className="h-4 w-4 text-primary opacity-60" />
            </div>
          ))}
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-8">
          {/* Success Header */}
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-gradient-success rounded-full flex items-center justify-center mx-auto shadow-glow">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-success mb-2">Congratulations! 🎉</h1>
              <p className="text-xl text-foreground">Your {selectedOffer.title} is approved!</p>
              <p className="text-muted-foreground">
                From application to approval in just a few minutes
              </p>
            </div>
          </div>

          {/* Virtual Card */}
          <div className="relative">
            <Card className={`overflow-hidden border-none shadow-elegant transition-all duration-1000 ${
              cardRevealed ? 'transform-none opacity-100' : 'transform scale-95 opacity-0'
            }`}>
              <CardContent className="p-0">
                <div className="bg-gradient-primary p-8 text-white relative overflow-hidden">
                  {/* Card Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 right-4 w-16 h-16 border-2 border-white/20 rounded-full"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-white/20 rounded-full"></div>
                  </div>
                  
                  <div className="relative space-y-6">
                    {/* Card Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm opacity-80">Virtual Card</p>
                        <h3 className="text-lg font-semibold">{selectedOffer.title}</h3>
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30">
                        Active
                      </Badge>
                    </div>

                    {/* Card Number */}
                    <div className="space-y-2">
                      <p className="text-sm opacity-80">Card Number</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-mono tracking-wider">
                          {maskCardNumber(cardNumber)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(cardNumber.replace(/\s/g, ''), 'Card number')}
                          className="text-white hover:bg-white/20"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs opacity-80">Cardholder Name</p>
                        <p className="font-medium">{cardholderName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-80">Valid Thru</p>
                        <p className="font-medium">{expiryDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-80">CVV</p>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">***</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(cvv, 'CVV')}
                            className="text-white hover:bg-white/20 p-1 h-auto"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card Details Summary */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold">Your New Card Benefits</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Credit Limit</p>
                  <p className="font-semibold text-success">{formatCurrency(selectedOffer.limit)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Annual Fee</p>
                  <p className="font-semibold">
                    {selectedOffer.fee === 0 ? (
                      <span className="text-success">Lifetime Free</span>
                    ) : (
                      formatCurrency(selectedOffer.fee)
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Key Benefits:</p>
                <div className="grid grid-cols-1 gap-1">
                  {selectedOffer.perks.map((perk, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4">
            <Button variant="hero" size="xl" className="w-full">
              <Wallet className="h-5 w-5" />
              Add to Digital Wallet
            </Button>
            
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" size="lg" className="flex-1">
                <Smartphone className="h-5 w-5" />
                Install App
              </Button>
              <Button variant="outline" size="lg" className="flex-1">
                <Gift className="h-5 w-5" />
                View Rewards
              </Button>
            </div>
          </div>

          {/* Next Steps */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-primary" />
                What's Next?
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white font-medium">1</div>
                  <p>Your virtual card is active and ready to use for online transactions</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white font-medium">2</div>
                  <p>Physical card will be delivered to your address within 7-10 business days</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white font-medium">3</div>
                  <p>Download our mobile app to track spending and manage your card</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Support */}
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <h3 className="font-semibold">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Our customer support team is available 24/7 to assist you
              </p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  📞 Call Support
                </Button>
                <Button variant="outline" className="flex-1">
                  💬 Live Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}