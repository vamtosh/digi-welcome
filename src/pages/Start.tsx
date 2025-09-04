import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressHeader } from "@/components/ProgressHeader";
import { 
  Briefcase, 
  GraduationCap, 
  Building, 
  CreditCard, 
  Plane, 
  ShoppingBag,
  Sparkles,
  Mic
} from "lucide-react";
import { useOnboardingStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { WorkType, Perk } from "@/lib/types";
import { conversationalAgent } from "@/lib/conversationalAgent";

export default function Start() {
  const navigate = useNavigate();
  const { setProfile } = useOnboardingStore();
  const [workType, setWorkType] = useState<WorkType | null>(null);
  const [perk, setPerk] = useState<Perk | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);

  // Handle voice navigation updates
  useEffect(() => {
    const handleVoiceUpdate = (updates: Record<string, any>) => {
      if (updates.workType) {
        setWorkType(updates.workType);
        analytics.track('voice_work_type_selected', { workType: updates.workType });
      }
      if (updates.perk) {
        setPerk(updates.perk);
        analytics.track('voice_perk_selected', { perk: updates.perk });
      }
    };

    // Listen for voice navigation updates
    conversationalAgent.setOnFormUpdate(handleVoiceUpdate);

    return () => {
      conversationalAgent.setOnFormUpdate(undefined);
    };
  }, []);

  const workTypes = [
    { id: 'salaried' as WorkType, label: 'Salaried', icon: Briefcase, desc: 'Regular monthly income' },
    { id: 'self' as WorkType, label: 'Self-employed', icon: Building, desc: 'Business or freelance' },
    { id: 'student' as WorkType, label: 'Student', icon: GraduationCap, desc: 'College or university' }
  ];

  const perks = [
    { id: 'cashback' as Perk, label: 'Cashback', icon: CreditCard, desc: 'Earn money back on every spend' },
    { id: 'travel' as Perk, label: 'Travel', icon: Plane, desc: 'Lounge access and travel rewards' },
    { id: 'shopping' as Perk, label: 'Shopping', icon: ShoppingBag, desc: 'Discounts and exclusive deals' }
  ];

  const canContinue = workType && perk;

  const handleContinue = () => {
    if (!canContinue) return;
    
    setProfile({ workType, perk });
    analytics.track('start_perk_selected', { workType, perk });
    navigate('/pii/pan');
  };

  return (
    <div className="min-h-screen bg-background">
      <ProgressHeader
        currentStep={2}
        totalSteps={10}
        title="Quick Profile Setup"
        subtitle="Help us personalize your experience"
        canGoBack={true}
      />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-8">
          {/* Work Type Question */}
          <section className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">What's your work type?</h2>
              <p className="text-muted-foreground text-sm">
                This helps us determine your eligibility
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Mic className="h-3 w-3" />
                <span>Say "Select salaried", "Choose self-employed", or "Pick student"</span>
              </div>
            </div>
            
            <div className="grid gap-3">
              {workTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = workType === type.id;
                
                return (
                  <Card
                    key={type.id}
                    className={`p-4 cursor-pointer transition-smooth hover:shadow-card ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setWorkType(type.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{type.label}</h3>
                          {isSelected && <Badge variant="secondary" className="text-xs">Selected</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{type.desc}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Perk Question */}
          <section className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">What perks matter most to you?</h2>
              <p className="text-muted-foreground text-sm">
                We'll recommend the best cards for your lifestyle
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Mic className="h-3 w-3" />
                <span>Say "Select cashback", "Choose travel", or "Pick shopping"</span>
              </div>
            </div>
            
            <div className="grid gap-3">
              {perks.map((perkOption) => {
                const Icon = perkOption.icon;
                const isSelected = perk === perkOption.id;
                
                return (
                  <Card
                    key={perkOption.id}
                    className={`p-4 cursor-pointer transition-smooth hover:shadow-card ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setPerk(perkOption.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{perkOption.label}</h3>
                          {isSelected && <Badge variant="secondary" className="text-xs">Selected</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{perkOption.desc}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Continue Button */}
          <div className="sticky bottom-0 bg-background pt-4 border-t">
            <Button
              variant={canContinue ? "hero" : "secondary"}
              size="xl"
              className="w-full"
              onClick={handleContinue}
              disabled={!canContinue}
            >
              {canContinue && <Sparkles className="h-5 w-5" />}
              {canContinue ? "Let's do this!" : "Please select both options"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}