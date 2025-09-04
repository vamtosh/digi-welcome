import OpenAI from 'openai';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

class OpenAIService {
  private openai: OpenAI | null = null;
  private knowledgeBase: string = '';
  private apiKey: string = '';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
      });
    } else {
      this.openai = null;
    }
  }

  setKnowledgeBase(knowledgeBase: string) {
    this.knowledgeBase = knowledgeBase;
  }

  getApiKey() {
    return this.apiKey;
  }

  getKnowledgeBase() {
    return this.knowledgeBase;
  }

  async sendMessage(message: string, currentStep: string, conversationHistory: Message[]): Promise<string> {
    if (!this.openai || !this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build conversation context from recent history
    const recentHistory = conversationHistory
      .slice(-8) // Last 8 messages to stay within token limits
      .map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }));

    const systemPrompt = `You are a helpful AI assistant guiding users through a financial services onboarding process. 

CURRENT STEP: ${currentStep}

KNOWLEDGE BASE:
${this.knowledgeBase || 'Use general financial services knowledge for credit cards, KYC, PAN verification, address verification, CIBIL scores, and onboarding processes.'}

GUIDELINES:
- Be friendly, helpful, and conversational
- Provide step-specific guidance based on the current step the user is on
- Answer questions about the onboarding process, financial products, KYC requirements, and document verification
- If the user seems stuck or confused, offer to guide them through the current step
- Keep responses concise (under 200 words) but informative
- Use a supportive tone and encourage the user through the process
- If you don't know something specific from the knowledge base, use general financial services knowledge

Focus on helping the user successfully complete their current step while being encouraging and supportive.`;

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...recentHistory.slice(-5), // Include last 5 conversation turns
        { role: 'user', content: message }
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages as any,
        max_tokens: 400,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return completion.choices[0]?.message?.content || 'Sorry, I could not process your request. Please try again.';
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      
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
}

export const openaiService = new OpenAIService();