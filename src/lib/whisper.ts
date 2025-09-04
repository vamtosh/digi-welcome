import OpenAI from 'openai';

interface WhisperServiceConfig {
  apiKey: string;
}

interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
}

class WhisperService {
  private openai: OpenAI | null = null;
  private apiKey: string = '';

  constructor() {
    // Load API key from environment variables
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (this.apiKey) {
      this.initialize();
    }
  }

  private initialize() {
    if (this.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true
      });
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.initialize();
  }

  getApiKey() {
    return this.apiKey;
  }

  isConfigured(): boolean {
    return !!(this.openai && this.apiKey);
  }

  async transcribeAudio(audioBlob: Blob, language: string = 'en'): Promise<TranscriptionResult> {
    if (!this.openai || !this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Convert blob to File object
      const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: language,
        response_format: 'verbose_json',
        temperature: 0.0, // More deterministic for structured data like PAN numbers
      });

      return {
        text: transcription.text,
        confidence: transcription.segments?.[0]?.avg_logprob ? 
          Math.exp(transcription.segments[0].avg_logprob) : undefined,
        language: transcription.language
      };
    } catch (error: any) {
      console.error('Whisper API Error:', error);
      
      // Re-throw with more specific error information
      if (error?.status) {
        const enhancedError = new Error(error.message);
        (enhancedError as any).status = error.status;
        (enhancedError as any).code = error.code;
        throw enhancedError;
      }
      
      throw error;
    }
  }

  async transcribeForPan(audioBlob: Blob): Promise<string> {
    const result = await this.transcribeAudio(audioBlob, 'en');
    
    // Clean and format the transcription for PAN input
    const cleanedText = result.text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // Remove all non-alphanumeric characters
      .substring(0, 10); // Take only first 10 characters
    
    return cleanedText;
  }

  async transcribeForGeneralInput(audioBlob: Blob): Promise<string> {
    const result = await this.transcribeAudio(audioBlob, 'en');
    return result.text.trim();
  }
}

export const whisperService = new WhisperService();
