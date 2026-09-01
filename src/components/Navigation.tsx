import type { View } from '../types';

interface NavigationProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

export function Navigation({ activeView, onViewChange }: NavigationProps) {
  const navItems: { view: View; label: string; icon: string }[] = [
    { view: 'table', label: 'Taulukko', icon: '📋' },
    { view: 'calendar', label: 'Kalenteri', icon: '🗓️' },
    { view: 'settings', label: 'Asetukset', icon: '⚙️' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pt-1 z-50 safe-bottom">
      <div className="max-w-4xl mx-auto flex justify-around pb-1">
        {navItems.map(({ view, label, icon }) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
              activeView === view
                ? 'text-violet-600 bg-violet-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-xl">{icon}</span>
            <span className="text-xs mt-1">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
