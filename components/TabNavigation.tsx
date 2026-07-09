type TabType = 'book' | 'mybookings' | 'view' | 'admin';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'book', label: 'Book Interview', icon: '📋' },
    { id: 'mybookings', label: 'My Bookings', icon: '📌' },
    { id: 'view', label: 'View All Slots', icon: '👀' },
    { id: 'admin', label: 'Admin Panel', icon: '⚙️' },
  ];

  return (
    <div className="flex border-b border-slate-700 bg-slate-800/50">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`tab-button flex-1 py-4 border-b-2 transition-all ${
            activeTab === tab.id
              ? 'border-purple-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="mr-2">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
}
