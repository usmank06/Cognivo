import { ArrowRight, Grid3x3, Database, FileText } from 'lucide-react';
import { Button } from './ui/button';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-6xl tracking-tight text-foreground">
            DataBoard
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your data into interactive visual boards. Connect sources, analyze insights, and collaborate seamlessly.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button 
              onClick={() => onNavigate('login')}
              className="px-8"
            >
              Login
            </Button>
            <Button 
              onClick={() => onNavigate('register')}
              variant="outline"
              className="px-8"
            >
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 px-4 bg-muted/30 border-y border-border">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl text-foreground">About DataBoard</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            DataBoard is a minimalist platform designed for data-driven teams who need to visualize, 
            analyze, and share insights. Whether you're working with databases, APIs, or uploaded files, 
            DataBoard provides an infinite canvas to build your perfect workspace.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl text-center text-foreground mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                <Grid3x3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl text-foreground">Boards</h3>
              <p className="text-muted-foreground">
                Create infinite canvas workspaces or structured PDF reports. Organize your data visually with drag-and-drop simplicity.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl text-foreground">Sources</h3>
              <p className="text-muted-foreground">
                Connect to MongoDB, REST APIs, or upload CSV and Excel files. All your data sources in one unified platform.
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl text-foreground">Reports</h3>
              <p className="text-muted-foreground">
                Export your boards as PDFs or images. Share insights with your team or clients in the format that works best.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 px-4 bg-muted/30 border-t border-border">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl text-foreground">Get In Touch</h2>
          <p className="text-lg text-muted-foreground">
            Have questions or need help? We're here for you.
          </p>
          <a 
            href="mailto:contact@databoard.com"
            className="inline-block text-lg text-primary hover:underline"
          >
            contact@databoard.com
          </a>
        </div>
      </section>
    </div>
  );
}
