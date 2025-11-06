interface MenuItem {
  id: string;
  label: string;
}

interface NavigationProps {
  currentPage: string;
  isLoggedIn: boolean;
  onNavigate: (page: any) => void;
}

export function Navigation({ currentPage, isLoggedIn, onNavigate }: NavigationProps) {
  const menuItems: MenuItem[] = isLoggedIn
    ? [
        { id: 'landing', label: 'Cognivo' },
        { id: 'canvas', label: 'Canvas' },
        { id: 'sources', label: 'Sources' },
        { id: 'settings', label: 'Settings' },
      ]
    : [
        { id: 'landing', label: 'Cognivo' },
      ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="grid grid-cols-4 h-16">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => item.id !== 'placeholder' && onNavigate(item.id)}
            disabled={item.id === 'placeholder'}
            className={`
              relative flex items-center justify-center transition-all duration-200 font-medium
              ${item.id === 'placeholder' ? 'cursor-default' : 'hover:bg-secondary/50'}
              ${currentPage === item.id ? 'bg-secondary/30' : ''}
              ${index > 0 ? 'border-l border-border' : ''}
            `}
          >
            <span className={`
              ${currentPage === item.id ? 'text-primary font-semibold' : 'text-foreground'}
              transition-colors duration-200 text-base
            `}>
              {item.label}
            </span>
            {currentPage === item.id && item.id !== 'placeholder' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
