import { gptContextService } from './gptContextService';
import { whisperService } from './whisperService';

interface FormContext {
  currentPage: string;
  currentField: string;
  expectedInputType: string;
  formProgress: number;
  previousAnswers: Record<string, any>;
  fieldRequirements?: string[];
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ConversationState {
  isActive: boolean;
  isListening: boolean;
  currentContext: FormContext;
  conversationHistory: Message[];
  lastUserInput: string;
  pendingAction?: string;
}

class ConversationalAgent {
  private state: ConversationState;
  private onStateChange?: (state: ConversationState) => void;
  private onFormUpdate?: (updates: Record<string, any>) => void;
  private onNavigation?: (action: string) => void;

  constructor() {
    this.state = {
      isActive: false,
      isListening: false,
      currentContext: {
        currentPage: '/',
        currentField: '',
        expectedInputType: 'general',
        formProgress: 0,
        previousAnswers: {}
      },
      conversationHistory: []
    };
  }

  // Event handlers
  setOnStateChange(callback: (state: ConversationState) => void) {
    this.onStateChange = callback;
  }

  setOnFormUpdate(callback: (updates: Record<string, any>) => void) {
    this.onFormUpdate = callback;
  }

  setOnNavigation(callback: (action: string) => void) {
    this.onNavigation = callback;
  }

  // Update form context
  updateFormContext(context: Partial<FormContext>) {
    this.state.currentContext = { ...this.state.currentContext, ...context };
    this.notifyStateChange();
  }

  // Start conversation
  async startConversation() {
    if (!gptContextService.isConfigured()) {
      throw new Error('OpenAI API key not configured');
    }

    this.state.isActive = true;
    this.notifyStateChange();

    // Start with welcome message
    await this.speak("Hi! I'm your personal assistant for this credit card application. I'll guide you through each step and answer any questions you have. Ready to get started?");
  }

  // Stop conversation
  stopConversation() {
    this.state.isActive = false;
    this.state.isListening = false;
    this.notifyStateChange();
  }

  // Process user speech input
  async processUserSpeech(audioBlob: Blob): Promise<void> {
    if (!this.state.isActive) return;

    try {
      this.state.isListening = true;
      this.notifyStateChange();

      // Transcribe speech to text
      const userSpeech = await whisperService.transcribeForGeneralInput(audioBlob);
      
      // Add to conversation history
      this.addMessage(userSpeech, true);

      // Understand context using GPT-4o
      const understanding = await gptContextService.understandUserResponse(
        userSpeech,
        this.state.currentContext,
        this.state.conversationHistory
      );

      // Process the understanding
      await this.processUnderstanding(understanding);

    } catch (error) {
      console.error('Error processing user speech:', error);
      await this.speak("Sorry, I had trouble understanding that. Could you please try again?");
    } finally {
      this.state.isListening = false;
      this.notifyStateChange();
    }
  }

  // Process text input (for keyboard input)
  async processUserText(text: string): Promise<void> {
    if (!this.state.isActive) return;

    try {
      // Add to conversation history
      this.addMessage(text, true);

      // Understand context using GPT-4o
      const understanding = await gptContextService.understandUserResponse(
        text,
        this.state.currentContext,
        this.state.conversationHistory
      );

      // Process the understanding
      await this.processUnderstanding(understanding);

    } catch (error) {
      console.error('Error processing user text:', error);
      await this.speak("Sorry, I had trouble understanding that. Could you please try again?");
    }
  }

  private async processUnderstanding(understanding: any): Promise<void> {
    // Update form fields if needed
    if (understanding.formUpdates && Object.keys(understanding.formUpdates).length > 0) {
      this.onFormUpdate?.(understanding.formUpdates);
    }

    // Handle navigation actions
    if (understanding.nextAction) {
      this.onNavigation?.(understanding.nextAction);
    }

    // Speak the agent response
    await this.speak(understanding.agentResponse);

    // Add agent response to conversation history
    this.addMessage(understanding.agentResponse, false);

    // Update conversation state
    this.state.lastUserInput = understanding.intent;
    this.state.pendingAction = understanding.nextAction;
    this.notifyStateChange();
  }

  // Text-to-speech functionality
  private async speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        
        speechSynthesis.speak(utterance);
      } else {
        // Fallback: just resolve immediately
        resolve();
      }
    });
  }

  // Add message to conversation history
  private addMessage(text: string, isUser: boolean): void {
    const message: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date()
    };

    this.state.conversationHistory.push(message);
    
    // Keep only last 10 messages to manage memory
    if (this.state.conversationHistory.length > 10) {
      this.state.conversationHistory = this.state.conversationHistory.slice(-10);
    }
  }

  // Notify state change
  private notifyStateChange(): void {
    this.onStateChange?.(this.state);
  }

  // Get current state
  getState(): ConversationState {
    return { ...this.state };
  }

  // Page-specific conversation starters
  async startPageConversation(page: string): Promise<void> {
    const pageStarters = {
      '/': "Welcome to Tata Neu HDFC Bank! I'm here to help you apply for a credit card. Let's get started!",
      '/start': "Let's begin with your work type. Are you salaried, self-employed, or a student?",
      '/pii/pan': "Now I need your PAN number for identity verification. You can speak it clearly or type it in.",
      '/pii/address': "I need your current address for verification and card delivery. Let's start with your house number and street name.",
      '/kyc/selfie': "Now I need to verify your identity with a selfie. Please position your face clearly in the camera frame.",
      '/checks': "I'm running some background checks to verify your information. This usually takes 30-60 seconds.",
      '/offers': "Based on your profile, I have some great credit card options for you. Let me explain each one.",
      '/terms': "Before we finalize your application, I need to go through the terms and conditions with you.",
      '/sign': "Almost done! I'm sending you an OTP to digitally sign your application.",
      '/success': "Congratulations! Your credit card application has been submitted successfully."
    };

    const starter = pageStarters[page as keyof typeof pageStarters];
    if (starter) {
      await this.speak(starter);
      this.addMessage(starter, false);
    }
  }

  // Handle specific form field conversations
  async handleFieldConversation(field: string, context: FormContext): Promise<void> {
    this.updateFormContext(context);

    const fieldConversations = {
      'workType': "What's your work situation? Are you salaried, self-employed, or a student?",
      'perk': "What type of rewards interest you most? We have cashback, travel benefits, or shopping discounts.",
      'panNumber': "What's your PAN number? It's 10 characters - 5 letters, 4 numbers, and 1 letter.",
      'currentAddress': "What's your current address? Let's start with your house number and street name.",
      'permanentAddress': "Is this also your permanent address, or do you have a different one?",
      'selfie': "Please position your face clearly in the camera frame for identity verification."
    };

    const conversation = fieldConversations[field as keyof typeof fieldConversations];
    if (conversation) {
      await this.speak(conversation);
      this.addMessage(conversation, false);
    }
  }
}

export const conversationalAgent = new ConversationalAgent();
