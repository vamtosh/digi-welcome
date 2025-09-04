import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { VoiceNavigation } from './VoiceNavigation';
import { conversationalAgent } from '../lib/conversationalAgent';
import { useOnboardingStore } from '../lib/store';

interface VoiceNavigationWrapperProps {
  children: React.ReactNode;
}

export function VoiceNavigationWrapper({ children }: VoiceNavigationWrapperProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { pii, profile } = useOnboardingStore();
  const [formUpdates, setFormUpdates] = useState<Record<string, any>>({});

  // Handle form updates from voice navigation
  const handleFormUpdate = (updates: Record<string, any>) => {
    setFormUpdates(updates);
    
    // Apply updates to the store based on current page
    const currentPage = location.pathname;
    
    switch (currentPage) {
      case '/start':
        if (updates.workType) {
          // Update work type in store
          console.log('Voice: Setting work type to', updates.workType);
        }
        if (updates.perk) {
          // Update perk in store
          console.log('Voice: Setting perk to', updates.perk);
        }
        break;
      case '/pii/pan':
        if (updates.panNumber) {
          // Update PAN in store
          console.log('Voice: Setting PAN to', updates.panNumber);
        }
        break;
      case '/pii/address':
        if (updates.currentAddress || updates.permanentAddress) {
          // Update address in store
          console.log('Voice: Setting address', updates);
        }
        break;
      default:
        console.log('Voice: Form updates for', currentPage, updates);
    }
  };

  // Handle navigation actions from voice commands
  const handleNavigation = (action: string) => {
    const currentPage = location.pathname;
    console.log('VoiceNavigationWrapper: Received navigation action:', action, 'from page:', currentPage);
    
    switch (action) {
      case 'continue':
      case 'next':
        console.log('VoiceNavigationWrapper: Handling next navigation');
        handleNextPage(currentPage);
        break;
      case 'back':
      case 'previous':
        console.log('VoiceNavigationWrapper: Handling back navigation');
        handlePreviousPage(currentPage);
        break;
      case 'skip':
        console.log('VoiceNavigationWrapper: Handling skip navigation');
        handleSkipPage(currentPage);
        break;
      case 'restart':
        console.log('VoiceNavigationWrapper: Handling restart navigation');
        navigate('/');
        break;
      default:
        console.log('VoiceNavigationWrapper: Unknown navigation action:', action);
    }
  };

  const handleNextPage = (currentPage: string) => {
    const pageFlow = [
      '/',
      '/start',
      '/pii/pan',
      '/pii/address',
      '/kyc/selfie',
      '/checks',
      '/offers',
      '/terms',
      '/sign',
      '/success'
    ];
    
    const currentIndex = pageFlow.indexOf(currentPage);
    console.log('VoiceNavigationWrapper: Current page index:', currentIndex, 'for page:', currentPage);
    
    if (currentIndex < pageFlow.length - 1) {
      const nextPage = pageFlow[currentIndex + 1];
      console.log('VoiceNavigationWrapper: Navigating to next page:', nextPage);
      navigate(nextPage);
    } else {
      console.log('VoiceNavigationWrapper: Already at last page');
    }
  };

  const handlePreviousPage = (currentPage: string) => {
    const pageFlow = [
      '/',
      '/start',
      '/pii/pan',
      '/pii/address',
      '/kyc/selfie',
      '/checks',
      '/offers',
      '/terms',
      '/sign',
      '/success'
    ];
    
    const currentIndex = pageFlow.indexOf(currentPage);
    if (currentIndex > 0) {
      navigate(pageFlow[currentIndex - 1]);
    }
  };

  const handleSkipPage = (currentPage: string) => {
    // Handle page-specific skip logic
    switch (currentPage) {
      case '/pii/address':
        // Skip to KYC if address is not required
        navigate('/kyc/selfie');
        break;
      default:
        handleNextPage(currentPage);
    }
  };

  // Get current field based on page
  const getCurrentField = () => {
    switch (location.pathname) {
      case '/':
        return 'welcome';
      case '/start':
        return 'workType';
      case '/pii/pan':
        return 'panNumber';
      case '/pii/address':
        return 'currentAddress';
      case '/kyc/selfie':
        return 'selfie';
      case '/checks':
        return 'backgroundChecks';
      case '/offers':
        return 'cardSelection';
      case '/terms':
        return 'termsAcceptance';
      case '/sign':
        return 'otpSigning';
      case '/success':
        return 'completion';
      default:
        return 'unknown';
    }
  };

  // Get form context for voice navigation
  const getFormContext = () => {
    const currentPage = location.pathname;
    const currentField = getCurrentField();
    
    // Calculate form progress
    const pageFlow = [
      '/', '/start', '/pii/pan', '/pii/address', '/kyc/selfie',
      '/checks', '/offers', '/terms', '/sign', '/success'
    ];
    const currentIndex = pageFlow.indexOf(currentPage);
    const formProgress = Math.round((currentIndex / (pageFlow.length - 1)) * 100);
    
    return {
      currentPage,
      currentField,
      formProgress,
      previousAnswers: {
        ...profile,
        ...pii
      },
      expectedInputType: getExpectedInputType(currentPage, currentField)
    };
  };

  const getExpectedInputType = (page: string, field: string) => {
    switch (field) {
      case 'workType':
        return 'work_type_selection';
      case 'perk':
        return 'perk_selection';
      case 'panNumber':
        return 'pan';
      case 'currentAddress':
      case 'permanentAddress':
        return 'address';
      case 'selfie':
        return 'image_capture';
      case 'cardSelection':
        return 'card_selection';
      case 'termsAcceptance':
        return 'terms_acceptance';
      case 'otpSigning':
        return 'otp_input';
      default:
        return 'general';
    }
  };

  // Update conversational agent context when location changes
  useEffect(() => {
    const formContext = getFormContext();
    conversationalAgent.updateFormContext(formContext);
    
    // Start page-specific conversation
    conversationalAgent.startPageConversation(location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative">
      {children}
      
      {/* Voice Navigation Panel */}
      <div className="fixed bottom-4 left-4 z-50">
        <VoiceNavigation
          currentPage={location.pathname}
          currentField={getCurrentField()}
          onFormUpdate={handleFormUpdate}
          onNavigation={handleNavigation}
          formContext={getFormContext()}
        />
      </div>
    </div>
  );
}
