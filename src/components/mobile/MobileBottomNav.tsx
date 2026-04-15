import { Home, BarChart2, ArrowLeftRight, Clock, User } from "lucide-react";
import { useTranslation } from "react-i18next";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  const { t } = useTranslation();
  const tabs = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'market', label: t('market'), icon: BarChart2 },
    { id: 'trade', label: t('trade'), icon: ArrowLeftRight, isCenter: true },
    { id: 'orders', label: t('position'), icon: Clock },
    { id: 'mine', label: t('mine'), icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around h-[70px] px-2 z-50 pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        if (tab.isCenter) {
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange('trade')}
              className="relative -top-5 bg-[#0166fc] text-white p-4 rounded-full shadow-[0_4px_15px_rgba(1,102,252,0.4)] border-4 border-white active:scale-95 transition-transform"
            >
              <Icon className="h-7 w-7" />
            </button>
          );
        }
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors active:opacity-70 ${
              activeTab === tab.id ? 'text-[#0166fc]' : 'text-[#999]'
            }`}
          >
            <Icon className={`h-6 w-6 ${activeTab === tab.id ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} />
            <span className="text-[11px] font-bold">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
