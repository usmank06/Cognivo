import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function Footer() {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the banner
    const dismissed = localStorage.getItem('mvpBannerDismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('mvpBannerDismissed', 'true');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-muted/30 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground text-center">
          This is just an MVP. For help: <span className="text-primary">contact@databoard.com</span>
        </p>
        <button
          onClick={handleDismiss}
          className="absolute right-4 flex-shrink-0 p-1 hover:bg-muted rounded transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
