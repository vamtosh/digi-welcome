import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProgressHeader } from "@/components/ProgressHeader";
import { 
  FileText, 
  IndianRupee, 
  Calendar,
  Percent,
  CreditCard,
  Shield,
  AlertTriangle
} from "lucide-react";
import { useOnboardingStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";

interface TermsProps {
  onEscalate: () => void;
}

export default function Terms({ onEscalate }: TermsProps) {
  const navigate = useNavigate();
  const { selectedOffer } = useOnboardingStore();
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  if (!selectedOffer) {
    return <div>No offer selected</div>;
  }

  const handleContinue = () => {
    if (!agreedToTerms) return;
    
    analytics.track('terms_accepted', { 
      offerId: selectedOffer.id,
      offerTitle: selectedOffer.title 
    });
    navigate('/sign');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const termsSummary = [
    {
      icon: CreditCard,
      title: "Credit Limit",
      value: `Up to ${formatCurrency(selectedOffer.limit)}`,
      description: "Based on your income and credit profile"
    },
    {
      icon: IndianRupee,
      title: "Annual Fee",
      value: selectedOffer.fee === 0 ? "₹0" : formatCurrency(selectedOffer.fee),
      description: selectedOffer.fee === 0 ? "Lifetime free" : "Charged annually"
    },
    {
      icon: Percent,
      title: "Interest Rate (APR)",
      value: "3.35% per month",
      description: "40.2% annually on outstanding balance"
    },
    {
      icon: Calendar,
      title: "Billing Cycle",
      value: "Monthly",
      description: "Statement generated every month"
    }
  ];

  const faqs = [
    {
      question: "When will I receive my card?",
      answer: "Your virtual card will be available immediately after approval. The physical card will be delivered within 7-10 business days to your registered address."
    },
    {
      question: "Are there any hidden charges?",
      answer: "No hidden charges. All fees are clearly mentioned in the pricing guide. Common charges include late payment fees (₹500), overlimit fees (2.5% of overlimit amount), and cash advance fees (2.5% of transaction amount)."
    },
    {
      question: "How do I activate my card?",
      answer: "Virtual card is activated automatically. For physical card, you can activate it through our mobile app, website, or by calling customer care once you receive it."
    },
    {
      question: "What is the minimum payment due?",
      answer: "The minimum payment is 3% of the outstanding balance or ₹200, whichever is higher. However, we recommend paying the full amount to avoid interest charges."
    },
    {
      question: "Can I change my credit limit later?",
      answer: "Yes, you can request a credit limit increase after 6 months of good payment history. The decision is based on your updated income and credit profile."
    },
    {
      question: "What happens if I miss a payment?",
      answer: "Late payment fees apply, and it may affect your credit score. We send reminders before the due date to help you avoid this."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ProgressHeader
        currentStep={8}
        totalSteps={10}
        title="Terms & Conditions"
        subtitle="Review your card terms"
        onEscalate={onEscalate}
      />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Almost there!</h2>
            <p className="text-muted-foreground">
              Please review the terms for your <strong>{selectedOffer.title}</strong> card
            </p>
          </div>

          {/* Terms Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Card Terms Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {termsSummary.map((term, index) => {
                const Icon = term.icon;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 bg-background rounded-lg">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{term.title}</span>
                        <span className="font-semibold text-primary">{term.value}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{term.description}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card>
            <CardHeader>
              <CardTitle>Your Selected Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {selectedOffer.perks.map((perk, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm">{perk}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-medium text-warning">Important Notice</h4>
                  <p className="text-sm text-muted-foreground">
                    This is a credit facility. Please use responsibly. Pay your dues on time to maintain a good credit score. 
                    Interest will be charged on unpaid balances.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Consent */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms-agreement"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms-agreement"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the Terms & Conditions and Privacy Policy
                  </label>
                  <p className="text-xs text-muted-foreground">
                    By checking this box, I consent to the processing of my personal data for credit assessment 
                    and card issuance. I understand the card terms and agree to use the card responsibly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <div className="sticky bottom-0 bg-background pt-4 border-t">
            <Button
              variant={agreedToTerms ? "hero" : "secondary"}
              size="xl"
              className="w-full"
              onClick={handleContinue}
              disabled={!agreedToTerms}
            >
              {agreedToTerms ? (
                <>
                  <Shield className="h-5 w-5" />
                  Proceed to Digital Signature
                </>
              ) : (
                "Please agree to terms to continue"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}