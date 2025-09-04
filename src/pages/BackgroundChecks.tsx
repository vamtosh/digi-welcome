import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressHeader } from "@/components/ProgressHeader";
import { 
  Shield, 
  CreditCard, 
  MapPin, 
  UserCheck,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useOnboardingStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { api } from "@/lib/api";

interface BackgroundChecksProps {
  onEscalate: () => void;
}

interface CheckItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration: number;
}

export default function BackgroundChecks({ onEscalate }: BackgroundChecksProps) {
  const navigate = useNavigate();
  const { pii, setChecks } = useOnboardingStore();
  const [checks, setCheckItems] = useState<CheckItem[]>([
    {
      id: 'pan',
      title: 'PAN Validation',
      description: 'Verifying PAN details with government database',
      icon: UserCheck,
      status: 'pending',
      duration: 2000
    },
    {
      id: 'cibil',
      title: 'CIBIL Credit Check',
      description: 'Pulling your credit score and history',
      icon: CreditCard,
      status: 'pending',
      duration: 3000
    },
    {
      id: 'aml',
      title: 'AML/PEP Screening',
      description: 'Checking against sanctions and PEP lists',
      icon: Shield,
      status: 'pending',
      duration: 2500
    },
    {
      id: 'address',
      title: 'Address Verification',
      description: 'Confirming serviceability and address validity',
      icon: MapPin,
      status: 'pending',
      duration: 1500
    }
  ]);

  const runChecks = async () => {
    if (!pii?.pan || !pii?.addresses?.current) return;

    // Process checks sequentially with delays
    for (let i = 0; i < checks.length; i++) {
      const check = checks[i];
      
      // Mark as processing
      setCheckItems(prev => prev.map((item, index) => 
        index === i ? { ...item, status: 'processing' } : item
      ));

      // Wait for the specified duration
      await new Promise(resolve => setTimeout(resolve, check.duration));

      // Mark as completed
      setCheckItems(prev => prev.map((item, index) => 
        index === i ? { ...item, status: 'completed' } : item
      ));
    }

    // Run actual API call after UI completes
    try {
      const response = await api.runBackgroundChecks(pii.pan, pii.addresses.current);
      if (response.success && response.data) {
        setChecks(response.data);
        analytics.track('checks_done', {
          cibilScore: response.data.cibil.score,
          pepAml: response.data.pepAml
        });
        
        // Navigate to offers after brief delay
        setTimeout(() => {
          navigate('/offers');
        }, 1000);
      }
    } catch (error) {
      console.error('Background checks failed:', error);
      onEscalate();
    }
  };

  useEffect(() => {
    runChecks();
  }, []);

  const allCompleted = checks.every(check => check.status === 'completed');
  const anyFailed = checks.some(check => check.status === 'failed');

  const getStatusIcon = (status: CheckItem['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted" />;
    }
  };

  const getStatusText = (status: CheckItem['status']) => {
    switch (status) {
      case 'processing':
        return 'Checking...';
      case 'completed':
        return 'Verified';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ProgressHeader
        currentStep={6}
        totalSteps={10}
        title="Background Verification"
        subtitle="Running security and eligibility checks"
        canGoBack={false}
        onEscalate={onEscalate}
      />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Running Background Checks</h2>
              <p className="text-muted-foreground">
                We're verifying your information with various databases. This usually takes a few seconds.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {checks.map((check) => {
              const Icon = check.icon;
              return (
                <Card key={check.id} className="transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${
                        check.status === 'completed' ? 'bg-success/10' :
                        check.status === 'processing' ? 'bg-primary/10' :
                        check.status === 'failed' ? 'bg-destructive/10' :
                        'bg-muted'
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          check.status === 'completed' ? 'text-success' :
                          check.status === 'processing' ? 'text-primary' :
                          check.status === 'failed' ? 'text-destructive' :
                          'text-muted-foreground'
                        }`} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">{check.title}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              check.status === 'completed' ? 'default' :
                              check.status === 'processing' ? 'secondary' :
                              check.status === 'failed' ? 'destructive' :
                              'outline'
                            }>
                              {getStatusText(check.status)}
                            </Badge>
                            {getStatusIcon(check.status)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{check.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {allCompleted && (
            <Card className="border-success bg-success/5">
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="font-semibold text-success mb-2">All Checks Completed!</h3>
                <p className="text-sm text-muted-foreground">
                  Great news! You've passed all our verification checks. 
                  We're now preparing personalized card offers for you.
                </p>
              </CardContent>
            </Card>
          )}

          {anyFailed && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="font-semibold text-destructive mb-2">Verification Issues</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Some checks couldn't be completed automatically. Our team will review your application manually.
                </p>
                <button 
                  onClick={onEscalate}
                  className="text-sm text-primary hover:underline"
                >
                  Contact support for assistance →
                </button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}