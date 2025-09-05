import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ProgressHeader } from "@/components/ProgressHeader";
import { 
  MapPin, 
  Camera, 
  Upload, 
  CheckCircle, 
  XCircle,
  Loader2 
} from "lucide-react";
import { useOnboardingStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { api } from "@/lib/api";
import { Address } from "@/lib/types";
import { toast } from "sonner";

interface AddressCaptureProps {
  onEscalate: () => void;
}

export default function AddressCapture({ onEscalate }: AddressCaptureProps) {
  const navigate = useNavigate();
  const { pii, setPii } = useOnboardingStore();
  const [currentAddress, setCurrentAddress] = useState<Partial<Address>>({});
  const [permanentAddress, setPermanentAddress] = useState<Partial<Address>>({});
  const [differentAddress, setDifferentAddress] = useState(false);
  const [serviceabilityStatus, setServiceabilityStatus] = useState<{[key: string]: boolean | null}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Address[]>([]);

  const checkServiceability = async (pincode: string, addressType: 'current' | 'permanent') => {
    if (pincode.length === 6) {
      try {
        const response = await api.checkServiceability(pincode);
        if (response.success) {
          setServiceabilityStatus(prev => ({
            ...prev,
            [addressType]: response.data.serviceable
          }));
          
          if (response.data.serviceable) {
            analytics.track('address_serviceable', { pincode, addressType });
          }
        }
      } catch (error) {
        console.error('Serviceability check failed:', error);
      }
    }
  };

  const handleAddressChange = async (field: keyof Address, value: string, type: 'current' | 'permanent') => {
    const setter = type === 'current' ? setCurrentAddress : setPermanentAddress;
    setter(prev => ({ ...prev, [field]: value }));
    
    if (field === 'pincode') {
      await checkServiceability(value, type);
    }
    
    // Get suggestions for line1 field
    if (field === 'line1' && value.length > 2) {
      try {
        const response = await api.getAddressSuggestions(value);
        if (response.success) {
          setSuggestions(response.data || []);
        }
      } catch (error) {
        console.error('Failed to get suggestions:', error);
      }
    }
  };

  const uploadDocument = async () => {
    setIsLoading(true);
    try {
      // Simulate document capture
      const mockImage = "data:image/jpeg;base64,mock";
      const response = await api.ocrAddress(mockImage);
      
      if (response.success && response.data) {
        const address = response.data;
        setCurrentAddress({
          line1: address.address,
          city: address.city,
          state: address.state,
          pincode: address.pincode
        });
        
        await checkServiceability(address.pincode, 'current');
        toast.success("Address captured from document!");
      } else {
        toast.error(response.error || "Failed to read document");
      }
    } catch (error) {
      toast.error("Failed to process document");
    }
    setIsLoading(false);
  };

  const isFormValid = () => {
    const current = currentAddress;
    const hasValidCurrent = current.line1 && current.city && current.state && current.pincode;
    
    if (!differentAddress) return hasValidCurrent;
    
    const permanent = permanentAddress;
    const hasValidPermanent = permanent.line1 && permanent.city && permanent.state && permanent.pincode;
    
    return hasValidCurrent && hasValidPermanent;
  };

  const handleContinue = () => {
    if (!isFormValid()) return;
    
    const addressData = {
      addresses: {
        current: currentAddress as Address,
        permanent: differentAddress ? permanentAddress as Address : undefined
      }
    };
    
    setPii(addressData);
    navigate('/checks');
  };

  const AddressForm = ({ address, onChange, type, title }: {
    address: Partial<Address>;
    onChange: (field: keyof Address, value: string) => void;
    type: 'current' | 'permanent';
    title: string;
  }) => (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h3 className="font-medium">{title}</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${type}-line1`}>Address Line 1</Label>
            <Input
              id={`${type}-line1`}
              value={address.line1 || ''}
              onChange={(e) => onChange('line1', e.target.value)}
              placeholder="House/Flat No., Building Name, Street"
            />
            {suggestions.length > 0 && address.line1 && (
              <div className="border rounded-md max-h-32 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-2 hover:bg-muted cursor-pointer text-sm"
                    onClick={() => {
                      onChange('line1', suggestion.line1);
                      onChange('city', suggestion.city);
                      onChange('state', suggestion.state);
                      onChange('pincode', suggestion.pincode);
                      setSuggestions([]);
                    }}
                  >
                    {suggestion.line1}, {suggestion.city}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${type}-line2`}>Address Line 2 (Optional)</Label>
            <Input
              id={`${type}-line2`}
              value={address.line2 || ''}
              onChange={(e) => onChange('line2', e.target.value)}
              placeholder="Area, Landmark"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${type}-city`}>City</Label>
              <Input
                id={`${type}-city`}
                value={address.city || ''}
                onChange={(e) => onChange('city', e.target.value)}
                placeholder="Mumbai"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`${type}-state`}>State</Label>
              <Input
                id={`${type}-state`}
                value={address.state || ''}
                onChange={(e) => onChange('state', e.target.value)}
                placeholder="Maharashtra"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`${type}-pincode`}>Pincode</Label>
            <div className="flex gap-2">
              <Input
                id={`${type}-pincode`}
                value={address.pincode || ''}
                onChange={(e) => onChange('pincode', e.target.value)}
                placeholder="400001"
                maxLength={6}
              />
              {address.pincode && serviceabilityStatus[type] !== null && (
                <Badge variant={serviceabilityStatus[type] ? "default" : "destructive"}>
                  {serviceabilityStatus[type] ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Serviceable
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Serviceable
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <ProgressHeader
        currentStep={4}
        totalSteps={10}
        title="Address Details"
        subtitle="Verify your address information"
        onEscalate={onEscalate}
      />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Enter your address details</h2>
            <p className="text-muted-foreground text-sm">
              We need this to verify your identity and check serviceability
            </p>
          </div>

          {/* Document Upload Option */}
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Quick Address Capture</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a utility bill to auto-fill your address
              </p>
              <Button 
                onClick={uploadDocument} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isLoading ? "Processing..." : "Upload Document"}
              </Button>
            </CardContent>
          </Card>

          {/* Current Address */}
          <AddressForm
            address={currentAddress}
            onChange={(field, value) => handleAddressChange(field, value, 'current')}
            type="current"
            title="Current Address"
          />

          {/* Different Address Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="different-address"
              checked={differentAddress}
              onCheckedChange={(checked) => setDifferentAddress(checked as boolean)}
            />
            <Label htmlFor="different-address" className="text-sm">
              My current address is different from Aadhaar address
            </Label>
          </div>

          {/* Permanent Address */}
          {differentAddress && (
            <AddressForm
              address={permanentAddress}
              onChange={(field, value) => handleAddressChange(field, value, 'permanent')}
              type="permanent"
              title="Aadhaar/Permanent Address"
            />
          )}

          {/* Continue Button */}
          <div className="sticky bottom-0 bg-background pt-4 border-t">
            <Button
              variant={isFormValid() ? "hero" : "secondary"}
              size="xl"
              className="w-full"
              onClick={handleContinue}
              disabled={!isFormValid()}
            >
              {isFormValid() ? "Continue to Identity Verification" : "Complete address details"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}