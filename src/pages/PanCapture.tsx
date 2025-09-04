import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ProgressHeader } from "@/components/ProgressHeader";
import { 
  Keyboard, 
  Mic, 
  Camera, 
  CheckCircle, 
  AlertCircle,
  MicIcon,
  Square
} from "lucide-react";
import { useOnboardingStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface PanCaptureProps {
  onEscalate: () => void;
}

// Web Speech API types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export default function PanCapture({ onEscalate }: PanCaptureProps) {
  const navigate = useNavigate();
  const { setPii } = useOnboardingStore();
  const [activeTab, setActiveTab] = useState("type");
  const [panValue, setPanValue] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript.toUpperCase();
          // Clean the transcript to extract PAN-like pattern
          const cleanedTranscript = transcript.replace(/[^A-Z0-9]/g, '');
          
          if (cleanedTranscript.length >= 10) {
            // Take first 10 characters if longer
            const panCandidate = cleanedTranscript.substring(0, 10);
            setPanValue(panCandidate);
            validatePan(panCandidate);
            toast.success("Voice input captured!");
          } else {
            toast.error("Could not recognize a valid PAN. Please try again.");
          }
          setVoiceListening(false);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          let errorMessage = "Speech recognition failed. ";
          
          switch (event.error) {
            case 'no-speech':
              errorMessage += "No speech detected. Please try again.";
              break;
            case 'audio-capture':
              errorMessage += "Microphone not accessible. Please check permissions.";
              break;
            case 'not-allowed':
              errorMessage += "Microphone permission denied. Please allow microphone access.";
              break;
            default:
              errorMessage += "Please try again.";
          }
          
          toast.error(errorMessage);
          setVoiceListening(false);
        };

        recognitionRef.current.onend = () => {
          setVoiceListening(false);
        };
      }
    }
  }, []);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const validatePan = useCallback((pan: string) => {
    const valid = PAN_REGEX.test(pan);
    setIsValid(valid);
    return valid;
  }, []);

  const handlePanChange = (value: string) => {
    const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (formatted.length <= 10) {
      setPanValue(formatted);
      validatePan(formatted);
    }
  };

  const startVoiceCapture = async () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in this browser. Please use typing or camera instead.");
      return;
    }

    try {
      setVoiceListening(true);
      analytics.track('pan_capture_mode', { mode: 'voice' });
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast.error("Failed to start voice recognition. Please try again.");
      setVoiceListening(false);
    }
  };

  const stopVoiceCapture = () => {
    if (recognitionRef.current && voiceListening) {
      recognitionRef.current.stop();
      setVoiceListening(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        analytics.track('pan_capture_mode', { mode: 'camera' });
      }
    } catch (error) {
      toast.error("Camera access denied. Please allow camera permissions.");
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsLoading(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg');
      
      try {
        const response = await api.ocrPan(imageData);
        if (response.success && response.data) {
          setOcrResult(response.data);
          
          // If user already typed a PAN and it's different, ask what to do
          if (panValue && panValue !== response.data.pan) {
            toast.info("Found different PAN in image. Use scanned PAN?", {
              action: {
                label: "Replace",
                onClick: () => {
                  setPanValue(response.data.pan);
                  validatePan(response.data.pan);
                  toast.success("PAN updated from scan!");
                }
              }
            });
          } else {
            setPanValue(response.data.pan);
            validatePan(response.data.pan);
            toast.success("PAN captured from image!");
          }
        } else {
          toast.error(response.error || "Could not read PAN from image");
        }
      } catch (error) {
        toast.error("Failed to process image");
      }
    }
    
    setIsLoading(false);
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setCameraActive(false);
    }
  };

  const handleContinue = async () => {
    if (!isValid) return;
    
    setIsLoading(true);
    analytics.track('pan_validated', { pan: panValue });
    
    // Save PII data
    const piiData = {
      pan: panValue,
      name: ocrResult?.name,
      dob: ocrResult?.dob
    };
    
    setPii(piiData);
    
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 800));
    navigate('/pii/address');
  };

  return (
    <div className="min-h-screen bg-background">
      <ProgressHeader
        currentStep={3}
        totalSteps={10}
        title="PAN Verification"
        subtitle="Verify your identity securely"
        onEscalate={onEscalate}
      />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Enter your PAN details</h2>
            <p className="text-muted-foreground text-sm">
              Choose your preferred method to enter PAN information
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="type" className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                Type
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Voice
              </TabsTrigger>
              <TabsTrigger value="camera" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Camera
              </TabsTrigger>
            </TabsList>

            <TabsContent value="type" className="space-y-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pan">PAN Number</Label>
                    <Input
                      id="pan"
                      value={panValue}
                      onChange={(e) => handlePanChange(e.target.value)}
                      placeholder="ABCDE1234F"
                      className={`font-mono ${isValid ? 'border-success' : panValue ? 'border-destructive' : ''}`}
                    />
                    {panValue && (
                      <div className="flex items-center gap-2 text-sm">
                        {isValid ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span className="text-success">Valid PAN format</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <span className="text-destructive">Invalid PAN format</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format: 5 letters + 4 numbers + 1 letter (e.g., ABCDE1234F)
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="voice" className="space-y-4">
              <Card>
                <CardContent className="p-6 space-y-4 text-center">
                  <div className="space-y-4">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                      voiceListening ? 'bg-destructive animate-pulse' : 'bg-primary'
                    }`}>
                      <MicIcon className="h-8 w-8 text-white" />
                    </div>
                    
                    <div>
                      <h3 className="font-medium">Voice Input</h3>
                      <p className="text-sm text-muted-foreground">
                        {voiceListening ? "Listening... Speak your PAN number clearly" : "Tap the microphone to speak your PAN"}
                      </p>
                      {!voiceListening && (
                        <p className="text-xs text-muted-foreground mt-2">
                          💡 Tip: Say each letter and number clearly (e.g., "A B C D E 1 2 3 4 F")
                        </p>
                      )}
                    </div>

                    <Button
                      variant={voiceListening ? "destructive" : "default"}
                      onClick={voiceListening ? stopVoiceCapture : startVoiceCapture}
                      disabled={isLoading}
                    >
                      {voiceListening ? (
                        <>
                          <Square className="h-4 w-4" />
                          Stop Listening
                        </>
                      ) : (
                        <>
                          <MicIcon className="h-4 w-4" />
                          Start Voice Input
                        </>
                      )}
                    </Button>

                    {panValue && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-mono">{panValue}</p>
                        {isValid && <Badge variant="secondary" className="mt-2">Valid PAN</Badge>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="camera" className="space-y-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center space-y-4">
                    <h3 className="font-medium">Camera Capture</h3>
                    <p className="text-sm text-muted-foreground">
                      Position your PAN card clearly in the camera frame
                    </p>
                  </div>

                  <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {!cameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button onClick={startCamera}>
                          <Camera className="h-4 w-4 mr-2" />
                          Start Camera
                        </Button>
                      </div>
                    )}
                  </div>

                  {cameraActive && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={captureImage} 
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {isLoading ? "Processing..." : "Capture PAN"}
                      </Button>
                      <Button variant="outline" onClick={stopCamera}>
                        Stop Camera
                      </Button>
                    </div>
                  )}

                  {panValue && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-mono">{panValue}</p>
                      {ocrResult?.name && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Name: {ocrResult.name}
                        </p>
                      )}
                      {isValid && <Badge variant="secondary" className="mt-2">Valid PAN</Badge>}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Continue Button */}
          <div className="sticky bottom-0 bg-background pt-4 border-t">
            <Button
              variant={isValid ? "hero" : "secondary"}
              size="xl"
              className="w-full"
              onClick={handleContinue}
              disabled={!isValid || isLoading}
            >
              {isLoading ? "Validating..." : isValid ? "Continue" : "Enter valid PAN to continue"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}