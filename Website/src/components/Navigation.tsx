interface NavigationProps {
  currentPage: string;
  isLoggedIn: boolean;
  onNavigate: (page: any) => void;
}

export function Navigation({ currentPage, isLoggedIn, onNavigate }: NavigationProps) {
  const navItems = isLoggedIn
    ? [
        { id: 'landing', label: 'DataBoard' },
        { id: 'board', label: 'Board' },
        { id: 'sources', label: 'Sources' },
        { id: 'settings', label: 'Settings' },
      ]
    : [
        { id: 'landing', label: 'DataBoard' },
        { id: 'login', label: 'Login' },
        { id: 'register', label: 'Register' },
        { id: 'placeholder', label: '' },
      ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => item.id !== 'placeholder' && onNavigate(item.id)}
            disabled={item.id === 'placeholder'}
            className={`
              relative flex items-center justify-center transition-colors duration-200
              ${item.id === 'placeholder' ? 'cursor-default' : 'hover:bg-muted'}
              ${currentPage === item.id ? 'bg-muted' : ''}
              ${index > 0 ? 'border-l border-border' : ''}
            `}
          >
            <span className={`
              ${currentPage === item.id ? 'text-primary' : 'text-foreground'}
              transition-colors duration-200
            `}>
              {item.label}
            </span>
            {currentPage === item.id && item.id !== 'placeholder' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
