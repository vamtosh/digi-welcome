import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Square } from 'lucide-react';
import { whisperService } from '@/lib/whisper';
import { useToast } from '@/hooks/use-toast';

export function VoiceTest() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      if (!whisperService.isConfigured()) {
        toast({
          title: 'API Key Required',
          description: 'Please configure your OpenAI API key first.',
          variant: 'destructive'
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        try {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          console.log('Audio blob size:', audioBlob.size);
          
          const result = await whisperService.transcribeForGeneralInput(audioBlob);
          setTranscription(result);
          
          toast({
            title: 'Success',
            description: 'Audio transcribed successfully!',
          });
        } catch (error) {
          console.error('Transcription error:', error);
          toast({
            title: 'Error',
            description: 'Failed to transcribe audio. Check console for details.',
            variant: 'destructive'
          });
        } finally {
          setIsProcessing(false);
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 3 seconds for testing
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 3000);

    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: 'Error',
        description: 'Failed to start recording. Check microphone permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4 space-y-4">
        <h3 className="font-medium">Voice Test</h3>
        
        <div className="text-sm text-muted-foreground">
          <p>API Status: {whisperService.isConfigured() ? '✅ Configured' : '❌ Not Configured'}</p>
          <p>MediaRecorder: {MediaRecorder ? '✅ Supported' : '❌ Not Supported'}</p>
        </div>

        <div className="flex justify-center">
          {isRecording ? (
            <Button onClick={stopRecording} className="bg-red-500 hover:bg-red-600">
              <Square className="h-4 w-4 mr-2" />
              Stop Recording
            </Button>
          ) : (
            <Button onClick={startRecording} disabled={isProcessing}>
              <Mic className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Start Recording'}
            </Button>
          )}
        </div>

        {isRecording && (
          <div className="text-center text-red-600">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mx-auto mb-2"></div>
            Recording... (auto-stops in 3 seconds)
          </div>
        )}

        {transcription && (
          <div className="bg-muted p-3 rounded-lg">
            <h4 className="font-medium mb-2">Transcription:</h4>
            <p className="text-sm">{transcription}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
