import { ArrowRight, Grid3x3, Database, FileText, Mail } from 'lucide-react';
import { Button } from './ui/button';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="pt-16 relative">
      {/* Hero Section with gradient background */}
      <section className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden">
        {/* Subtle gradient glow in corner */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(255, 145, 77, 0.15), transparent 60%)' }} />
        
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
            <span className="text-primary">Cognivo</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
            Transform your data into interactive visual boards. Connect sources, analyze insights, and collaborate seamlessly.
          </p>
          <div className="flex gap-4 justify-center pt-6">
            <Button 
              onClick={() => onNavigate('login')}
              className="px-8 py-6 text-base rounded-lg font-semibold shadow-md hover:shadow-lg transition-shadow"
            >
              Login
            </Button>
            <Button 
              onClick={() => onNavigate('register')}
              variant="outline"
              className="px-8 py-6 text-base rounded-lg font-semibold border-2 hover:bg-secondary/50 transition-colors"
            >
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
            {/* About Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">About Cognivo</h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Cognivo is a minimalist platform designed for data-driven teams who need to visualize, 
            analyze, and collaborate on complex information. Whether you're a researcher, data scientist, or business analyst, 
            Cognivo provides an infinite canvas to build your perfect workspace.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-4 p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FFE5D1] to-white rounded-2xl flex items-center justify-center mx-auto border border-primary/20 shadow-sm">
                <Grid3x3 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Boards</h3>
              <p className="text-muted-foreground leading-relaxed">
                Create infinite canvas workspaces or structured PDF reports. Organize your data visually with drag-and-drop simplicity.
              </p>
            </div>
            <div className="text-center space-y-4 p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FFE5D1] to-white rounded-2xl flex items-center justify-center mx-auto border border-primary/20 shadow-sm">
                <Database className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Sources</h3>
              <p className="text-muted-foreground leading-relaxed">
                Connect to MongoDB, REST APIs, or upload CSV and Excel files. All your data sources in one unified platform.
              </p>
            </div>
            <div className="text-center space-y-4 p-6 rounded-2xl bg-white border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FFE5D1] to-white rounded-2xl flex items-center justify-center mx-auto border border-primary/20 shadow-sm">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Reports</h3>
              <p className="text-muted-foreground leading-relaxed">
                Export your boards as PDFs or images. Share insights with your team or clients in the format that works best.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 px-4 relative">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Get In Touch</h2>
          <p className="text-lg text-muted-foreground">
            Have questions or need help? We're here for you.
          </p>
          <a
            className="text-primary hover:underline"
            href="mailto:contact@cognivo.com"
          >
            <Mail className="w-5 h-5 inline mr-2" />
            contact@cognivo.com
          </a>
        </div>
      </section>
    </div>
  );
}
