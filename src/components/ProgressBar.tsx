import { useLocation } from 'react-router-dom';

export function ProgressBar() {
  const location = useLocation();
  
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
  
  const currentIndex = pageFlow.indexOf(location.pathname);
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / pageFlow.length) * 100 : 0;
  
  const getStepName = (path: string) => {
    const stepNames: Record<string, string> = {
      '/': 'Welcome',
      '/start': 'Profile',
      '/pii/pan': 'PAN',
      '/pii/address': 'Address',
      '/checks': 'Checks',
      '/offers': 'Offers',
      '/terms': 'Terms',
      '/sign': 'Sign',
      '/success': 'Complete'
    };
    return stepNames[path] || 'Unknown';
  };
  
  return (
    <div className="w-full bg-muted/20 h-1 fixed top-0 left-0 z-50">
      <div 
        className="h-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
      <div className="absolute top-2 left-4 text-xs text-muted-foreground">
        Step {currentIndex + 1} of {pageFlow.length} - {getStepName(location.pathname)}
      </div>
    </div>
  );
}
