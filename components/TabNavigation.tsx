type TabType = 'book' | 'mybookings' | 'myperformance' | 'documents' | 'today' | 'tomorrow' | 'allbookings' | 'feedbackanalytics' | 'confirmedslots' | 'candidates' | 'performance' | 'cancelled' | 'admin';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdmin?: boolean;
  isCandidateLoggedIn?: boolean;
  isInactiveCandidate?: boolean;
}

export default function TabNavigation({ activeTab, onTabChange, isAdmin = false, isCandidateLoggedIn = false, isInactiveCandidate = false }: TabNavigationProps) {
  const inactiveCandidateTabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'mybookings', label: 'My Bookings', icon: '📌' },
    { id: 'myperformance', label: 'My Performance', icon: '📊' },
  ];

  const candidateTabs: { id: TabType; label: string; icon: string }[] = isCandidateLoggedIn
    ? [
        { id: 'book', label: 'Book Interview', icon: '📋' },
        { id: 'mybookings', label: 'My Bookings', icon: '📌' },
        { id: 'myperformance', label: 'My Performance', icon: '📊' },
        { id: 'documents', label: 'Offer Status', icon: '💼' },
        { id: 'today', label: "Today's Schedule - Confirmed", icon: '📅' },
        { id: 'tomorrow', label: "Tomorrow's Schedule - Confirmed", icon: '📆' },
        { id: 'allbookings', label: 'All Bookings', icon: '👥' },
      ]
    : [
        { id: 'allbookings', label: 'All Bookings', icon: '👥' },
      ];

  const adminTabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'book', label: 'Book Interview', icon: '📋' },
    { id: 'mybookings', label: 'My Bookings', icon: '📌' },
    { id: 'today', label: "Today's Schedule - Confirmed", icon: '📅' },
    { id: 'tomorrow', label: "Tomorrow's Schedule - Confirmed", icon: '📆' },
    { id: 'allbookings', label: 'All Bookings', icon: '👥' },
    { id: 'feedbackanalytics', label: 'Feedback', icon: '💬' },
    { id: 'confirmedslots', label: 'Confirmed Slots', icon: '✅' },
    { id: 'candidates', label: 'Candidates', icon: '👥' },
    { id: 'performance', label: 'Performance', icon: '📊' },
    { id: 'documents', label: 'Document Requests', icon: '📄' },
    { id: 'cancelled', label: 'Cancelled', icon: '❌' },
    { id: 'admin', label: 'Admin Panel', icon: '⚙️' },
  ];

  const tabs = isAdmin ? adminTabs : isInactiveCandidate ? inactiveCandidateTabs : candidateTabs;

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
