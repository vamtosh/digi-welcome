import OpenAI from 'openai';

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

interface ContextUnderstandingResult {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  missingInfo: string[];
  clarificationNeeded: boolean;
  agentResponse: string;
  formUpdates: Record<string, any>;
  nextAction?: string;
}

class GPTContextService {
  private openai: OpenAI | null = null;
  private apiKey: string = '';

  constructor() {
    // Initialize with API key from environment or localStorage
    this.initialize();
  }

  private initialize() {
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    const savedKey = localStorage.getItem('openai_api_key');
    this.apiKey = savedKey || envKey || '';
    
    console.log('GPTContextService: Initializing with API key:', this.apiKey ? 'Present' : 'Missing');
    console.log('GPTContextService: Env key:', envKey ? 'Present' : 'Missing');
    console.log('GPTContextService: Saved key:', savedKey ? 'Present' : 'Missing');
    
    if (this.apiKey) {
      this.openai = new OpenAI({
        apiKey: this.apiKey,
        dangerouslyAllowBrowser: true
      });
      console.log('GPTContextService: OpenAI client initialized');
    } else {
      console.log('GPTContextService: No API key found, OpenAI client not initialized');
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.initialize();
  }

  isConfigured(): boolean {
    return !!(this.openai && this.apiKey);
  }

  async understandUserResponse(
    userSpeech: string,
    formContext: FormContext,
    conversationHistory: Message[] = []
  ): Promise<ContextUnderstandingResult> {
    console.log('GPTContextService: Starting understandUserResponse');
    console.log('GPTContextService: User speech:', userSpeech);
    console.log('GPTContextService: Form context:', formContext);
    
    if (!this.openai) {
      console.error('GPTContextService: OpenAI not configured');
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = this.buildContextPrompt(userSpeech, formContext, conversationHistory);
      console.log('GPTContextService: Built prompt:', prompt);
      
      console.log('GPTContextService: Calling OpenAI API...');
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt()
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      console.log('GPTContextService: Received response:', response);
      const result = JSON.parse(response.choices[0].message.content);
      console.log('GPTContextService: Parsed result:', result);
      
      // Validate and enhance the result
      return this.validateAndEnhanceResult(result, formContext);
      
    } catch (error: any) {
      console.error('GPT Context Understanding Error:', error);
      
      // Fallback to basic understanding
      return this.getFallbackUnderstanding(userSpeech, formContext);
    }
  }

  private getSystemPrompt(): string {
    return `
You are an intelligent form assistant that understands user responses in context.

Your job is to:
1. Understand what the user is trying to communicate
2. Extract relevant information for form fields
3. Determine the user's intent
4. Identify any missing or unclear information
5. Generate appropriate responses

IMPORTANT: For navigation actions, you can ONLY use these predefined actions:
- "continue" or "next" - Move to the next page in the flow
- "back" or "previous" - Move to the previous page
- "skip" - Skip current step
- "restart" - Start over from beginning
- "request_missing_info" - Ask for clarification without navigating

DO NOT create new navigation actions like "request_full_name", "ask_for_employment_details", etc.
If the user wants to proceed, use "continue" or "next".

Always respond with a JSON object containing:
{
  "intent": "string", // What the user wants to do
  "entities": {}, // Extracted information
  "confidence": number, // 0-1 confidence score
  "missingInfo": [], // What information is still needed
  "clarificationNeeded": boolean,
  "agentResponse": "string", // What the agent should say next
  "formUpdates": {}, // What form fields to update
  "nextAction": "string" // ONLY use: "continue", "next", "back", "previous", "skip", "restart", or "request_missing_info"
}

Be precise, helpful, and conversational in your responses. Consider the form context and conversation history.
`;
  }

  private buildContextPrompt(
    userSpeech: string,
    formContext: FormContext,
    conversationHistory: Message[]
  ): string {
    const recentHistory = conversationHistory.slice(-3).map(msg => 
      `${msg.isUser ? 'User' : 'Agent'}: ${msg.text}`
    ).join('\n');

    return `
CURRENT FORM CONTEXT:
- Page: ${formContext.currentPage}
- Current Field: ${formContext.currentField}
- Expected Input: ${formContext.expectedInputType}
- Form Progress: ${formContext.formProgress}%
- Previous Answers: ${JSON.stringify(formContext.previousAnswers)}
${formContext.fieldRequirements ? `- Field Requirements: ${formContext.fieldRequirements.join(', ')}` : ''}

RECENT CONVERSATION:
${recentHistory || 'No recent conversation'}

USER JUST SAID: "${userSpeech}"

Please analyze this response and provide structured understanding.
`;
  }

  private validateAndEnhanceResult(
    result: any,
    formContext: FormContext
  ): ContextUnderstandingResult {
    // Ensure required fields exist
    const enhancedResult: ContextUnderstandingResult = {
      intent: result.intent || 'unknown',
      entities: result.entities || {},
      confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
      missingInfo: result.missingInfo || [],
      clarificationNeeded: result.clarificationNeeded || false,
      agentResponse: result.agentResponse || 'I understand. Let me help you with that.',
      formUpdates: result.formUpdates || {},
      nextAction: result.nextAction
    };

    // Add field-specific validation
    if (formContext.expectedInputType === 'pan') {
      enhancedResult.formUpdates = this.validatePANUpdate(enhancedResult.formUpdates);
    } else if (formContext.expectedInputType === 'address') {
      enhancedResult.formUpdates = this.validateAddressUpdate(enhancedResult.formUpdates);
    }

    return enhancedResult;
  }

  private validatePANUpdate(formUpdates: Record<string, any>): Record<string, any> {
    if (formUpdates.panNumber) {
      // Clean and validate PAN format
      const cleaned = formUpdates.panNumber.replace(/[^A-Z0-9]/g, '').toUpperCase();
      if (cleaned.length === 10 && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleaned)) {
        formUpdates.panNumber = cleaned;
      } else {
        formUpdates.panNumber = null;
      }
    }
    return formUpdates;
  }

  private validateAddressUpdate(formUpdates: Record<string, any>): Record<string, any> {
    // Basic address validation
    if (formUpdates.address) {
      // Ensure address has required fields
      if (!formUpdates.address.street && !formUpdates.address.city) {
        formUpdates.address = null;
      }
    }
    return formUpdates;
  }

  private getFallbackUnderstanding(
    userSpeech: string,
    formContext: FormContext
  ): ContextUnderstandingResult {
    // Basic fallback when GPT is not available
    return {
      intent: 'input_provided',
      entities: { rawInput: userSpeech },
      confidence: 0.3,
      missingInfo: [],
      clarificationNeeded: true,
      agentResponse: 'I heard you say something, but I need to process it better. Could you please repeat that?',
      formUpdates: {}
    };
  }

  // Specialized methods for different form fields
  async understandWorkType(userSpeech: string, context: FormContext): Promise<ContextUnderstandingResult> {
    const enhancedContext = {
      ...context,
      expectedInputType: 'work_type_selection',
      fieldRequirements: ['salaried', 'self-employed', 'student']
    };
    
    return this.understandUserResponse(userSpeech, enhancedContext, []);
  }

  async understandPerk(userSpeech: string, context: FormContext): Promise<ContextUnderstandingResult> {
    const enhancedContext = {
      ...context,
      expectedInputType: 'perk_selection',
      fieldRequirements: ['cashback', 'travel', 'shopping']
    };
    
    return this.understandUserResponse(userSpeech, enhancedContext, []);
  }

  async understandPAN(userSpeech: string, context: FormContext): Promise<ContextUnderstandingResult> {
    const enhancedContext = {
      ...context,
      expectedInputType: 'pan',
      fieldRequirements: ['10 characters', '5 letters + 4 numbers + 1 letter']
    };
    
    return this.understandUserResponse(userSpeech, enhancedContext, []);
  }

  async understandAddress(userSpeech: string, context: FormContext): Promise<ContextUnderstandingResult> {
    const enhancedContext = {
      ...context,
      expectedInputType: 'address',
      fieldRequirements: ['street', 'city', 'state', 'pincode']
    };
    
    return this.understandUserResponse(userSpeech, enhancedContext, []);
  }

  async understandGeneralInput(userSpeech: string, context: FormContext): Promise<ContextUnderstandingResult> {
    return this.understandUserResponse(userSpeech, context, []);
  }
}

export const gptContextService = new GPTContextService();
