import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Square, Loader2 } from 'lucide-react';
import { whisperService } from '@/lib/whisper';
import { toast } from 'sonner';

interface HybridInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  mode?: 'pan' | 'general'; // Different processing modes
}

export function HybridInput({ 
  value, 
  onChange, 
  placeholder = "Type or speak...", 
  disabled = false,
  className = "",
  onKeyPress,
  mode = 'general'
}: HybridInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if Whisper is configured
  const isWhisperConfigured = whisperService.isConfigured();

  const startRecording = useCallback(async () => {
    if (!isWhisperConfigured) {
      toast.error("OpenAI API key not configured. Please configure it in settings to use voice input.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          let transcribedText: string;
          if (mode === 'pan') {
            transcribedText = await whisperService.transcribeForPan(audioBlob);
          } else {
            transcribedText = await whisperService.transcribeForGeneralInput(audioBlob);
          }

          if (transcribedText) {
            onChange(transcribedText);
            toast.success("Voice input captured successfully!");
          } else {
            toast.error("Could not process voice input. Please try again.");
          }
        } catch (error: any) {
          console.error('Transcription error:', error);
          
          let errorMessage = "Voice transcription failed. ";
          if (error?.status === 401) {
            errorMessage += "Invalid OpenAI API key. Please check your settings.";
          } else if (error?.status === 429) {
            errorMessage += "API quota exceeded. Please try again later.";
          } else {
            errorMessage += "Please try again.";
          }
          
          toast.error(errorMessage);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info("Recording started. Speak clearly...");

    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  }, [isWhisperConfigured, onChange, mode]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (onKeyPress) {
      onKeyPress(e);
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled || isProcessing}
        className="flex-1"
      />
      
      <Button
        type="button"
        variant={isRecording ? "destructive" : "outline"}
        size="icon"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isProcessing}
        className="shrink-0"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <Square className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          Recording...
        </div>
      )}
    </div>
  );
}
