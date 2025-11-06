import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { CanvasPage } from './components/CanvasPage';
import { SourcesPage } from './components/SourcesPage';
import { SettingsPage } from './components/SettingsPage';
import { Footer } from './components/Footer';
import { Toaster } from './components/ui/sonner';

type Page = 'landing' | 'login' | 'register' | 'canvas' | 'sources' | 'settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState<any>(null);

  // Load saved session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setUsername(session.username);
        setUserData(session.userData);
        setIsLoggedIn(true);
        setCurrentPage(session.lastPage || 'canvas');
      } catch (error) {
        localStorage.removeItem('userSession');
      }
    }
  }, []);

  // Save session whenever it changes
  useEffect(() => {
    if (isLoggedIn && username) {
      const session = {
        username,
        userData,
        lastPage: currentPage,
      };
      localStorage.setItem('userSession', JSON.stringify(session));
    }
  }, [isLoggedIn, username, userData, currentPage]);

  const handleLogin = (user: string, data: any) => {
    setUsername(user);
    setUserData(data);
    setIsLoggedIn(true);
    setCurrentPage('canvas');
  };

  const handleRegister = (user: string, data: any) => {
    setUsername(user);
    setUserData(data);
    setIsLoggedIn(true);
    setCurrentPage('canvas');
  };

  const handleLogout = () => {
    setUsername('');
    setUserData(null);
    setIsLoggedIn(false);
    setCurrentPage('landing');
    localStorage.removeItem('userSession');
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
      case 'canvas':
        return <CanvasPage username={username} userId={userData?.id || ''} />;
      case 'sources':
        return <SourcesPage username={username} userId={userData?.id || ''} />;
      case 'settings':
        return <SettingsPage username={username} onLogout={handleLogout} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

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
        <Footer />
      </div>
      <Toaster />
    </div>
  );
}
