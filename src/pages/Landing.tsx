import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Globe, Sparkles } from "lucide-react";
import { useOnboardingStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { Language } from "@/lib/types";
import { VoiceTest } from "@/components/VoiceTest";

export default function Landing() {
  const navigate = useNavigate();
  const { lang, setLanguage } = useOnboardingStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    setIsLoading(true);
    analytics.track('landing_yes');
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1200));
    navigate('/start');
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    analytics.track('language_changed', { language: newLang });
  };

  const copy = {
    en: {
      greeting: "Hey! I'm Aisha.",
      headline: "Want me to check your credit card eligibility in just 2 minutes?",
      subtitle: "No paperwork, no branch visits. Just you, me, and smart technology.",
      cta: "Yes, let's do this!",
      notNow: "Not now",
      features: [
        "✨ Instant eligibility check",
        "📱 Upload documents with your camera",
        "🚀 Get approved in minutes, not days"
      ]
    },
    hi: {
      greeting: "नमस्ते! मैं आयशा हूँ।",
      headline: "क्या आप चाहते हैं कि मैं सिर्फ 2 मिनट में आपकी क्रेडिट कार्ड पात्रता चेक करूं?",
      subtitle: "कोई कागजी कार्रवाई नहीं, कोई ब्रांच विज़िट नहीं। बस आप, मैं, और स्मार्ट तकनीक।",
      cta: "हाँ, चलिए करते हैं!",
      notNow: "अभी नहीं",
      features: [
        "✨ तुरंत पात्रता जांच",
        "📱 अपने कैमरे से दस्तावेज़ अपलोड करें",
        "🚀 दिनों नहीं, मिनटों में अप्रूवल पाएं"
      ]
    },
    ta: {
      greeting: "வணக்கம்! நான் ஆயிஷா.",
      headline: "உங்கள் கிரெடிட் கார்டு தகுதியை வெறும் 2 நிமிடங்களில் சரிபார்க்க வேண்டுமா?",
      subtitle: "காகித வேலை இல்லை, கிளை வருகை இல்லை. நீங்கள், நான், மற்றும் புத்திசாலி தொழில்நுட்பம்.",
      cta: "ஆம், செய்வோம்!",
      notNow: "இப்போது வேண்டாம்",
      features: [
        "✨ உடனடி தகுதி சரிபார்ப்பு",
        "📱 உங்கள் கேமராவில் ஆவணங்களை பதிவேற்றவும்",
        "🚀 நாட்கள் அல்ல, நிமிடங்களில் ஒப்புதல் பெறுங்கள்"
      ]
    }
  };

  const currentCopy = copy[lang];

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">QuickCard</span>
        </div>
        
        <Select value={lang} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-24">
            <Globe className="h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">EN</SelectItem>
            <SelectItem value="hi">हि</SelectItem>
            <SelectItem value="ta">த</SelectItem>
          </SelectContent>
        </Select>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow">
              <span className="text-3xl">👋</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center border-4 border-background">
              <span className="text-xs">✓</span>
            </div>
          </div>

          {/* Copy */}
          <div className="space-y-4">
            <p className="text-lg font-medium text-primary">{currentCopy.greeting}</p>
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              {currentCopy.headline}
            </h1>
            <p className="text-muted-foreground">
              {currentCopy.subtitle}
            </p>
          </div>

          {/* Features */}
          <Card className="p-4 text-left space-y-2">
            {currentCopy.features.map((feature, index) => (
              <p key={index} className="text-sm text-muted-foreground">
                {feature}
              </p>
            ))}
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              variant="hero" 
              size="xl" 
              className="w-full" 
              onClick={handleGetStarted}
              disabled={isLoading}
            >
              {isLoading ? "Preparing..." : currentCopy.cta}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => window.history.back()}
            >
              {currentCopy.notNow}
            </Button>
          </div>
        </div>

        {/* Voice Test Component - Temporary for debugging */}
        <div className="mt-8">
          <VoiceTest />
        </div>
      </main>
    </div>
  );
}