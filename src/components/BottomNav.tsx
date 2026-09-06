import React from 'react';
import { LayoutDashboard, BarChart2, Network, Code2, BrainCircuit } from 'lucide-react';

export type TabType = 'overview' | 'analysis' | 'architecture' | 'code' | 'mentor';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  securityAlertCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, securityAlertCount = 0 }) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: <BarChart2 className="w-4 h-4" />,
      badge: securityAlertCount,
    },
    {
      id: 'architecture',
      label: 'Architecture',
      icon: <Network className="w-4 h-4" />,
    },
    {
      id: 'code',
      label: 'Code',
      icon: <Code2 className="w-4 h-4" />,
    },
    {
      id: 'mentor',
      label: 'Mentor',
      icon: <BrainCircuit className="w-4 h-4" />,
    },
  ];

  return (
    <>
      {/* Mobile / Tablet Fixed Bottom Nav Bar (Matches JSON & Screenshot) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden justify-around items-center px-3 py-1.5 bg-[#ffffff] border-t border-[#c8c5cb] shadow-lg">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded transition-all relative ${
                isActive ? 'text-[#1c1c18] font-bold' : 'text-[#78767b] hover:text-[#835331]'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-[#5c2434] text-[#ffffff] font-mono text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="font-mono text-[10px] tracking-wider uppercase mt-1">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#835331] mt-0.5" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Desktop Sub-Navigation Rail (Centered below header) */}
      <div className="hidden md:flex items-center justify-center fixed top-14 left-0 right-0 z-30 bg-[#fdf9f2]/90 backdrop-blur-xs border-b border-[#c8c5cb]/60 py-1.5">
        <div className="flex items-center space-x-1 bg-[#f1ede6] p-1 rounded border border-[#c5a880]/40">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1 rounded text-xs font-mono transition-all relative ${
                  isActive
                    ? 'bg-[#ffffff] text-[#1c1c18] font-bold shadow-xs border border-[#c5a880]/40'
                    : 'text-[#47464b] hover:text-[#1c1c18] hover:bg-[#ece8e1]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 ? (
                  <span className="bg-[#5c2434] text-[#ffffff] font-mono text-[9px] px-1 rounded-full">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
