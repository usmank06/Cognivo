import { useState } from 'react';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { BoardPage } from './components/BoardPage';
import { SourcesPage } from './components/SourcesPage';
import { SettingsPage } from './components/SettingsPage';
import { Footer } from './components/Footer';
import { Toaster } from './components/ui/sonner';

type Page = 'landing' | 'login' | 'register' | 'board' | 'sources' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  const handleLogin = (user: string) => {
    setUsername(user);
    setIsLoggedIn(true);
    setCurrentPage('board');
  };

  const handleRegister = (user: string) => {
    setUsername(user);
    setIsLoggedIn(true);
    setCurrentPage('board');
  };

  const handleLogout = () => {
    setUsername('');
    setIsLoggedIn(false);
    setCurrentPage('landing');
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onLogin={handleLogin} onNavigate={handleNavigate} />;
      case 'register':
        return <RegisterPage onRegister={handleRegister} onNavigate={handleNavigate} />;
      case 'board':
        return <BoardPage />;
      case 'sources':
        return <SourcesPage />;
      case 'settings':
        return <SettingsPage username={username} onLogout={handleLogout} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  const showFooter = currentPage !== 'login' && currentPage !== 'register';

  return (
    <div className="min-h-screen flex flex-col relative">
      <div className="relative z-10">
        <Navigation 
          currentPage={currentPage} 
          isLoggedIn={isLoggedIn} 
          onNavigate={handleNavigate}
        />
        <main className="flex-1">
          {renderPage()}
        </main>
        {showFooter && <Footer />}
      </div>
      <Toaster />
    </div>
  );
}
