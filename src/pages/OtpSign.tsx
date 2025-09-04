import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressHeader } from "@/components/ProgressHeader";
import { 
  Shield, 
  Smartphone,
  CheckCircle,
  RotateCcw,
  Loader2
} from "lucide-react";
import { useOnboardingStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface OtpSignProps {
  onEscalate: () => void;
}

export default function OtpSign({ onEscalate }: OtpSignProps) {
  const navigate = useNavigate();
  const { selectedOffer, setOtpSent, markCompleted } = useOnboardingStore();
  const [step, setStep] = useState<'send' | 'verify' | 'signing' | 'complete'>('send');
  const [phoneNumber] = useState("9876543210"); // Mock phone number
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [mockOtp, setMockOtp] = useState("");

  if (!selectedOffer) {
    return <div>No offer selected</div>;
  }

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendOtp = async () => {
    setIsLoading(true);
    
    try {
      const response = await api.sendOtp(phoneNumber);
      if (response.success) {
        setMockOtp(response.data.mockOtp);
        setOtpSent(true);
        setStep('verify');
        setCountdown(60);
        toast.success("OTP sent to your registered mobile number");
        
        // Show mock OTP in console for demo
        console.log(`🔐 Demo OTP: ${response.data.mockOtp}`);
        toast.info(`Demo OTP: ${response.data.mockOtp}`, {
          duration: 5000,
        });
      } else {
        toast.error("Failed to send OTP. Please try again.");
      }
    } catch (error) {
      toast.error("Network error. Please check your connection.");
    }
    
    setIsLoading(false);
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await api.verifyOtp(otp, mockOtp);
      if (response.success) {
        analytics.track('otp_verified', { 
          offerId: selectedOffer.id 
        });
        setStep('signing');
        
        // Simulate document signing process
        setTimeout(() => {
          setStep('complete');
          markCompleted();
          analytics.track('onboarding_success', {
            offerId: selectedOffer.id,
            offerTitle: selectedOffer.title
          });
          
          // Navigate to success page
          setTimeout(() => {
            navigate('/success');
          }, 2000);
        }, 1500);
      } else {
        toast.error(response.error || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      toast.error("Verification failed. Please try again.");
    }
    
    setIsLoading(false);
  };

  const resendOtp = async () => {
    if (countdown > 0) return;
    await sendOtp();
  };

  const handleOtpChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setOtp(digits);
  };

  const formatPhoneNumber = (phone: string) => {
    return `+91 ${phone.slice(0, 2)}******${phone.slice(-2)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <ProgressHeader
        currentStep={9}
        totalSteps={10}
        title="Digital Signature"
        subtitle="Secure document signing"
        onEscalate={onEscalate}
      />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {step === 'send' && (
            <>
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow">
                  <Shield className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Secure Digital Signing</h2>
                  <p className="text-muted-foreground">
                    We'll send an OTP to your registered mobile number for secure document signing
                  </p>
                </div>
              </div>

              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Registered Mobile Number</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPhoneNumber(phoneNumber)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">What happens next:</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• We'll send a 6-digit OTP to your mobile</p>
                      <p>• Enter the OTP to digitally sign your card agreement</p>
                      <p>• Your card will be approved and activated instantly</p>
                    </div>
                  </div>

                  <Button
                    variant="hero"
                    size="xl"
                    className="w-full"
                    onClick={sendOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Smartphone className="h-5 w-5" />
                    )}
                    {isLoading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto">
                  <Smartphone className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Enter OTP</h2>
                  <p className="text-muted-foreground">
                    We've sent a 6-digit code to {formatPhoneNumber(phoneNumber)}
                  </p>
                </div>
              </div>

              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">6-Digit OTP</label>
                    <Input
                      value={otp}
                      onChange={(e) => handleOtpChange(e.target.value)}
                      placeholder="000000"
                      className="text-center text-lg font-mono tracking-widest"
                      maxLength={6}
                    />
                  </div>

                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Resend OTP in {countdown} seconds
                      </p>
                    ) : (
                      <Button 
                        variant="ghost" 
                        onClick={resendOtp}
                        className="text-primary"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Resend OTP
                      </Button>
                    )}
                  </div>

                  <Button
                    variant={otp.length === 6 ? "hero" : "secondary"}
                    size="xl"
                    className="w-full"
                    onClick={verifyOtp}
                    disabled={otp.length !== 6 || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Shield className="h-5 w-5" />
                    )}
                    {isLoading ? "Verifying..." : "Verify & Sign"}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {step === 'signing' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Signing Documents...</h2>
                <p className="text-muted-foreground">
                  Please wait while we process your digital signature
                </p>
              </div>
              <div className="max-w-sm mx-auto">
                <div className="flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-success">Documents Signed Successfully!</h2>
                <p className="text-muted-foreground">
                  Your {selectedOffer.title} card has been approved and is being activated
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Redirecting to your new card...
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}