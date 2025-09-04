import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, Settings, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'react-router-dom';
import { openaiService } from '@/lib/openai';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatPanelProps {
  onOpenSettings: () => void;
}

const getStepContext = (pathname: string) => {
  const stepMap: Record<string, string> = {
    '/': 'Landing - User is on the welcome page with AI avatar',
    '/start': 'Profile Setup - User is selecting work type and preferences',
    '/pii/pan': 'PAN Capture - User is entering/capturing PAN details',
    '/pii/address': 'Address Capture - User is entering address information',
    '/kyc/selfie': 'KYC Selfie - User is taking selfie for verification',
    '/checks': 'Background Checks - Running verification checks',
    '/offers': 'Card Offers - Showing personalized card options',
    '/terms': 'Terms & Conditions - Reviewing terms and FAQ',
    '/sign': 'OTP Signing - User is signing with OTP verification',
    '/success': 'Success - Application completed successfully'
  };
  return stepMap[pathname] || 'Unknown step';
};

export function ChatPanel({ onOpenSettings }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load persisted messages from localStorage
    const saved = localStorage.getItem('chat_messages');
    if (saved) {
      try {
        return JSON.parse(saved).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch {
        // If parsing fails, return default message
      }
    }
    return [
      {
        id: '1',
        text: 'Hi! I\'m here to help you through your application. Feel free to ask any questions!',
        isUser: false,
        timestamp: new Date()
      }
    ];
  });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const currentStep = getStepContext(location.pathname);
      const response = await openaiService.sendMessage(inputValue, currentStep, messages);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      
      let errorText = 'Sorry, I encountered an error. ';
      
      if (error?.status === 429) {
        errorText = 'API quota exceeded. Please check your OpenAI billing in settings or try again later.';
      } else if (error?.status === 401) {
        errorText = 'Invalid API key. Please check your OpenAI API key in settings.';
      } else if (!openaiService.getApiKey()) {
        errorText = 'Please configure your OpenAI API key in settings to use the chat assistant.';
      } else {
        errorText += 'Please check your OpenAI API key and try again.';
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: 'Chat Error',
        description: errorText,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <aside className="w-96 bg-background border-l shadow-lg flex flex-col h-screen">
      <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              AI Assistant
            </CardTitle>
            <Badge variant="secondary" className="mt-1 text-xs">
              {getStepContext(location.pathname).split(' - ')[0]}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="hover:bg-primary/10"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.isUser
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </aside>
  );
}