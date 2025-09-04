import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Upload, Key, FileText, Save } from 'lucide-react';
import { openaiService } from '@/lib/openai';
import { useToast } from '@/hooks/use-toast';

interface ChatSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function ChatSettings({ open, onClose }: ChatSettingsProps) {
  const [apiKey, setApiKey] = useState(openaiService.getApiKey());
  const [knowledgeBase, setKnowledgeBase] = useState(openaiService.getKnowledgeBase());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSave = () => {
    openaiService.setApiKey(apiKey);
    openaiService.setKnowledgeBase(knowledgeBase);
    
    // Save to localStorage for persistence
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.setItem('knowledge_base', knowledgeBase);
    
    toast({
      title: 'Settings saved',
      description: 'Your OpenAI API key and knowledge base have been updated.'
    });
    
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setKnowledgeBase(content);
      toast({
        title: 'File uploaded',
        description: `${file.name} has been loaded into the knowledge base.`
      });
    };
    reader.readAsText(file);
  };

  // Load saved settings on mount
  useState(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    const savedKnowledgeBase = localStorage.getItem('knowledge_base');
    
    if (savedApiKey) {
      setApiKey(savedApiKey);
      openaiService.setApiKey(savedApiKey);
    }
    
    if (savedKnowledgeBase) {
      setKnowledgeBase(savedKnowledgeBase);
      openaiService.setKnowledgeBase(savedKnowledgeBase);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            AI Assistant Settings
          </DialogTitle>
          <DialogDescription>
            Configure your OpenAI API key and upload knowledge base content to customize the assistant's responses.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* API Key Section */}
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              OpenAI API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored locally in your browser and used only for chat requests.
            </p>
          </div>

          {/* Knowledge Base Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Knowledge Base
            </Label>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="text-xs text-muted-foreground flex items-center">
                Supports .txt, .md, .json files
              </span>
            </div>

            <Textarea
              placeholder="Paste or upload your knowledge base content here. This will be used to provide context-specific answers about your financial products and processes..."
              value={knowledgeBase}
              onChange={(e) => setKnowledgeBase(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {knowledgeBase.length} characters. This content will be used to provide more accurate and specific answers.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}