import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { conversationalAgent } from '../lib/conversationalAgent';
import { useOnboardingStore } from '../lib/store';
import { VoiceNavigationProvider } from '../contexts/VoiceNavigationContext';

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
      case 'navigate_to_next_page':
      case 'proceed_to_next_step':
        console.log('VoiceNavigationWrapper: Handling next navigation');
        handleNextPage(currentPage);
        break;
      case 'back':
      case 'previous':
      case 'navigate_to_previous_page':
      case 'go_back':
        console.log('VoiceNavigationWrapper: Handling back navigation');
        handlePreviousPage(currentPage);
        break;
      case 'skip':
      case 'skip_current_step':
      case 'skip_this_page':
        console.log('VoiceNavigationWrapper: Handling skip navigation');
        handleSkipPage(currentPage);
        break;
      case 'restart':
      case 'start_over':
      case 'begin_again':
        console.log('VoiceNavigationWrapper: Handling restart navigation');
        navigate('/');
        break;
      case 'request_missing_info':
      case 'ask_for_clarification':
        console.log('VoiceNavigationWrapper: Handling request for missing info - staying on current page');
        // Don't navigate, just stay on current page for clarification
        break;
      default:
        console.log('VoiceNavigationWrapper: Unknown navigation action:', action);
        // Try to handle common navigation patterns
        if (action.includes('next') || action.includes('continue') || action.includes('proceed') || 
            action.includes('employment') || action.includes('application') || action.includes('start') ||
            action.includes('begin') || action.includes('move') || action.includes('forward')) {
          console.log('VoiceNavigationWrapper: Interpreting as next navigation');
          handleNextPage(currentPage);
        } else if (action.includes('back') || action.includes('previous')) {
          console.log('VoiceNavigationWrapper: Interpreting as back navigation');
          handlePreviousPage(currentPage);
        } else if (action.includes('skip')) {
          console.log('VoiceNavigationWrapper: Interpreting as skip navigation');
          handleSkipPage(currentPage);
        } else if (action.includes('restart')) {
          console.log('VoiceNavigationWrapper: Interpreting as restart navigation');
          navigate('/');
        } else if (action.includes('request') || action.includes('missing') || action.includes('clarification')) {
          console.log('VoiceNavigationWrapper: Interpreting as request for info - staying on current page');
          // Don't navigate, just stay on current page
        } else {
          console.log('VoiceNavigationWrapper: No pattern match found, defaulting to next page');
          handleNextPage(currentPage);
        }
    }
  };

  const handleNextPage = (currentPage: string) => {
    const pageFlow = [
      '/',
      '/start',
      '/pii/pan',
      '/pii/address',
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
        // Skip directly to background checks
        navigate('/checks');
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
      '/', '/start', '/pii/pan', '/pii/address',
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
    console.log('VoiceNavigationWrapper: Page changed to:', location.pathname);
    const formContext = getFormContext();
    console.log('VoiceNavigationWrapper: Form context:', formContext);
    
    conversationalAgent.updateFormContext(formContext);
    
    // Start page-specific conversation
    console.log('VoiceNavigationWrapper: Starting page conversation...');
    conversationalAgent.startPageConversation(location.pathname);
  }, [location.pathname]);

  return (
    <VoiceNavigationProvider
      currentPage={location.pathname}
      currentField={getCurrentField()}
      onFormUpdate={handleFormUpdate}
      onNavigation={handleNavigation}
      formContext={getFormContext()}
    >
      <div className="relative">
        {children}
      </div>
    </VoiceNavigationProvider>
  );
}
