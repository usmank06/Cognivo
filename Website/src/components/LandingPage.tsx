import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="pt-16 relative flex flex-col min-h-screen">
      {/* Hero Section with gradient background */}
      <section className="flex-1 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Subtle gradient glow in corner */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(255, 145, 77, 0.15), transparent 60%)' }} />
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
            <span className="text-primary">Cognivo</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
            Transform your data into interactive visual canvases. Connect sources and uncover insights effortlessly.
          </p>
          <div className="flex gap-4 justify-center items-center pt-2">
            <Button 
              onClick={() => onNavigate('login')}
              variant="outline"
              className="px-8 py-4 text-base rounded-lg font-semibold border-2 hover:bg-secondary/50 transition-colors h-auto"
            >
              Login
            </Button>
            <Button 
              onClick={() => onNavigate('register')}
              className="px-8 py-4 text-base rounded-lg font-semibold border-2 border-transparent shadow-md hover:shadow-lg transition-shadow h-auto"
            >
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 px-4 text-center text-sm text-muted-foreground border-t border-border">
        <p>
          This is an MVP. For questions or feedback, contact{' '}
          <a
            href="mailto:usmankhan.06@outlook.com"
            className="text-primary hover:underline"
          >
            usmankhan.06@outlook.com
          </a>
        </p>
      </footer>
    </div>
  );
}
