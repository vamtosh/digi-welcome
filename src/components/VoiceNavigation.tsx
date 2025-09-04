import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, Volume2, VolumeX, Settings, HelpCircle } from 'lucide-react';
import { conversationalAgent } from '@/lib/conversationalAgent';
import { whisperService } from '@/lib/whisper';
import { useToast } from '@/hooks/use-toast';

interface VoiceNavigationProps {
  currentPage: string;
  currentField: string;
  onFormUpdate: (updates: Record<string, any>) => void;
  onNavigation: (action: string) => void;
  formContext?: any;
}

interface ConversationState {
  isActive: boolean;
  isListening: boolean;
  currentContext: any;
  conversationHistory: any[];
  lastUserInput: string;
  pendingAction?: string;
}

export function VoiceNavigation({ 
  currentPage, 
  currentField, 
  onFormUpdate, 
  onNavigation,
  formContext 
}: VoiceNavigationProps) {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Initialize conversational agent
  useEffect(() => {
    conversationalAgent.setOnStateChange(setConversationState);
    conversationalAgent.setOnFormUpdate(onFormUpdate);
    conversationalAgent.setOnNavigation(onNavigation);
    
    console.log('VoiceNavigation: Set handlers for conversational agent');
    console.log('onFormUpdate:', !!onFormUpdate);
    console.log('onNavigation:', !!onNavigation);

    return () => {
      conversationalAgent.stopConversation();
    };
  }, [onFormUpdate, onNavigation]);

  // Update form context when props change
  useEffect(() => {
    if (formContext) {
      conversationalAgent.updateFormContext({
        currentPage,
        currentField,
        ...formContext
      });
    }
  }, [currentPage, currentField, formContext]);

  const startVoiceNavigation = async () => {
    console.log('VoiceNavigation: Starting voice navigation...');
    if (!whisperService.isConfigured()) {
      console.log('VoiceNavigation: Whisper service not configured');
      toast({
        title: 'Voice Navigation Unavailable',
        description: 'Please configure your OpenAI API key in settings to use voice navigation.',
        variant: 'destructive'
      });
      return;
    }

    console.log('VoiceNavigation: Whisper service configured, starting conversation...');
    try {
      await conversationalAgent.startConversation();
      setIsActive(true);
      console.log('VoiceNavigation: Voice navigation started successfully');
      toast({
        title: 'Voice Navigation Started',
        description: 'I\'m now listening and ready to help you through the form!'
      });
    } catch (error) {
      console.error('VoiceNavigation: Error starting voice navigation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start voice navigation. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const stopVoiceNavigation = () => {
    conversationalAgent.stopConversation();
    setIsActive(false);
    setIsListening(false);
    toast({
      title: 'Voice Navigation Stopped',
      description: 'Voice navigation has been disabled.'
    });
  };

  const startListening = async () => {
    if (!isActive) return;

    try {
      // Check if whisper service is configured
      if (!whisperService.isConfigured()) {
        toast({
          title: 'Configuration Required',
          description: 'Please configure your OpenAI API key in settings first.',
          variant: 'destructive'
        });
        return;
      }

      // For testing, let's also check if we can use Web Speech API as fallback
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        console.log('Web Speech API available as fallback');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Check if MediaRecorder supports the mime type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          if (audioChunksRef.current.length === 0) {
            console.log('No audio data recorded');
            return;
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log('Audio blob created:', audioBlob.size, 'bytes');
          
          console.log('Calling conversationalAgent.processUserSpeech...');
          await conversationalAgent.processUserSpeech(audioBlob);
          console.log('conversationalAgent.processUserSpeech completed successfully');
        } catch (error) {
          console.error('Error processing speech:', error);
          console.error('Error details:', error);
          toast({
            title: 'Error',
            description: `Failed to process your speech: ${error.message || 'Unknown error'}`,
            variant: 'destructive'
          });
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast({
          title: 'Recording Error',
          description: 'An error occurred while recording. Please try again.',
          variant: 'destructive'
        });
        setIsListening(false);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsListening(true);
      console.log('Recording started');

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      console.log('Recording stopped');
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  // Auto-stop recording after 10 seconds
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isListening) {
      timeoutId = setTimeout(() => {
        console.log('Auto-stopping recording after timeout');
        stopListening();
      }, 10000); // 10 seconds
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isListening]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implement mute functionality
    if (isMuted) {
      // Unmute
      toast({
        title: 'Voice Unmuted',
        description: 'I will now speak responses aloud.'
      });
    } else {
      // Mute
      toast({
        title: 'Voice Muted',
        description: 'I will only show text responses.'
      });
    }
  };

  const showVoiceCommands = () => {
    setShowHelp(!showHelp);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!isActive) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-4 text-center space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Voice Navigation</h3>
            <p className="text-sm text-muted-foreground">
              Get hands-free help through your application
            </p>
          </div>
          
          <Button 
            onClick={startVoiceNavigation}
            className="w-full"
            disabled={!whisperService.isConfigured()}
          >
            <Mic className="h-4 w-4 mr-2" />
            Start Voice Assistant
          </Button>
          
          {!whisperService.isConfigured() && (
            <p className="text-xs text-muted-foreground">
              Configure OpenAI API key in settings to enable voice navigation
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Voice Assistant</h3>
            <Badge variant="secondary" className="text-green-700 bg-green-100">
              Active
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={showVoiceCommands}
              className="h-8 w-8"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={stopVoiceNavigation}
              className="h-8 w-8"
            >
              <MicOff className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Voice Commands Help */}
        {showHelp && (
          <div className="bg-muted p-3 rounded-lg text-sm space-y-2">
            <h4 className="font-medium">Voice Commands:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• "Next" or "Continue" - Go to next step</li>
              <li>• "Select [option]" - Choose an option</li>
              <li>• "Enter [value]" - Fill a field</li>
              <li>• "Help" - Get assistance</li>
              <li>• "Stop" - End voice navigation</li>
            </ul>
          </div>
        )}

        {/* Listening Status */}
        <div className="flex items-center justify-center">
          {isListening ? (
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Listening...</span>
            </div>
          ) : (
            <Button
              onClick={startListening}
              disabled={!isActive}
              className="w-full"
            >
              <Mic className="h-4 w-4 mr-2" />
              Tap to Speak
            </Button>
          )}
        </div>

        {/* Current Context */}
        {conversationState && (
          <div className="text-xs text-muted-foreground">
            <p>Page: {conversationState.currentContext?.currentPage}</p>
            <p>Field: {conversationState.currentContext?.currentField}</p>
            {conversationState.pendingAction && (
              <p>Next: {conversationState.pendingAction}</p>
            )}
          </div>
        )}

        {/* Debug Info */}
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          <p>Status: {isActive ? 'Active' : 'Inactive'} | {isListening ? 'Listening' : 'Ready'}</p>
          <p>API: {whisperService.isConfigured() ? 'Ready' : 'Not Configured'}</p>
          <p>MediaRecorder: {MediaRecorder ? 'Supported' : 'Not Supported'}</p>
        </div>

        {/* Recent Conversation */}
        {conversationState?.conversationHistory && conversationState.conversationHistory.length > 0 && (
          <div className="bg-muted p-3 rounded-lg max-h-32 overflow-y-auto">
            <h4 className="font-medium text-sm mb-2">Recent:</h4>
            <div className="space-y-1">
              {conversationState.conversationHistory.slice(-2).map((msg, index) => (
                <div key={index} className="text-xs">
                  <span className={msg.isUser ? 'text-blue-600' : 'text-green-600'}>
                    {msg.isUser ? 'You' : 'Assistant'}:
                  </span>
                  <span className="ml-1">{msg.text.substring(0, 50)}...</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
