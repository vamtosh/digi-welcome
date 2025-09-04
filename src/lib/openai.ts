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
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    // Build conversation context
    const recentHistory = conversationHistory
      .slice(-10) // Last 10 messages
      .map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.text}`)
      .join('\n');

    const systemPrompt = `You are a helpful AI assistant guiding users through a financial services onboarding process. 

Current Step: ${currentStep}

Knowledge Base:
${this.knowledgeBase || 'No specific knowledge base provided. Use general financial services knowledge.'}

Guidelines:
- Be friendly, helpful, and concise
- Provide step-specific guidance based on the current step
- Answer questions about the onboarding process, financial products, and requirements
- If you don't know something specific, acknowledge it and offer to help with what you do know
- Keep responses under 150 words unless more detail is specifically requested

Recent conversation:
${recentHistory}

Respond to the user's message in a helpful and contextual manner.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content || 'Sorry, I could not process your request.';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }
}

export const openaiService = new OpenAIService();