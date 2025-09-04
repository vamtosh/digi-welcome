import { Progress } from "@/components/ui/progress";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  canGoBack?: boolean;
  onEscalate?: () => void;
}

const steps = [
  "Landing",
  "Profile", 
  "PAN",
  "Address",
  "KYC",
  "Checks",
  "Offers",
  "Terms",
  "Sign",
  "Success"
];

export function ProgressHeader({ 
  currentStep, 
  totalSteps, 
  title, 
  subtitle,
  canGoBack = true,
  onEscalate 
}: ProgressHeaderProps) {
  const navigate = useNavigate();
  const progress = (currentStep / totalSteps) * 100;

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            {canGoBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          
          {onEscalate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEscalate}
              className="shrink-0"
            >
              <HelpCircle className="h-4 w-4" />
              Need Help?
            </Button>
          )}
        </div>
        
        <div className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {steps[currentStep - 1]}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    </header>
  );
}