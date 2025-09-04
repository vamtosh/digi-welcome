import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, MessageCircle, Phone, Mail } from "lucide-react";
import { analytics } from "@/lib/analytics";

interface EscalationModalProps {
  open: boolean;
  onClose: () => void;
}

export function EscalationModal({ open, onClose }: EscalationModalProps) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    issue: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analytics.track('escalation_requested', formData);
    setStep('success');
  };

  const ticketId = `TKT-${Date.now().toString().slice(-6)}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Need Human Help?
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="issue">What can we help you with?</Label>
                <Textarea
                  id="issue"
                  value={formData.issue}
                  onChange={(e) => setFormData(prev => ({ ...prev, issue: e.target.value }))}
                  placeholder="Describe the issue you're facing..."
                  required
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Request Callback
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-success">
                <CheckCircle className="h-5 w-5" />
                Request Submitted!
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-success-light/20 border border-success-light rounded-lg p-4">
                <p className="font-medium">Ticket ID: {ticketId}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Our team will contact you within 2 business hours.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>Call back on {formData.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>Updates sent to {formData.email}</span>
                </div>
              </div>
              
              <Button onClick={onClose} className="w-full">
                Continue Application
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}