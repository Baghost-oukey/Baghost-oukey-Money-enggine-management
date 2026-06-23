import React from "react";
import { TrendingUp, ArrowUpRight, Sparkles, CreditCard } from "lucide-react";

interface BudgetTabSwitcherProps {
  activeTab: "needs" | "wants" | "savings" | "debts";
  setActiveTab: (tab: "needs" | "wants" | "savings" | "debts") => void;
}

export function BudgetTabSwitcher({
  activeTab,
  setActiveTab,
}: BudgetTabSwitcherProps) {
  const tabThemes = {
    needs: {
      label: "Wajib",
      icon: <TrendingUp size={14} />,
      activeClass: "bg-card/45 border-t-2 border-t-zinc-500 border-x-muted-foreground/15 border-b-transparent text-zinc-900 dark:text-zinc-100 shadow-sm",
      hoverClass: "hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-muted/5",
    },
    wants: {
      label: "Gaya Hidup",
      icon: <ArrowUpRight size={14} />,
      activeClass: "bg-card/45 border-t-2 border-t-zinc-500 border-x-muted-foreground/15 border-b-transparent text-zinc-900 dark:text-zinc-100 shadow-sm",
      hoverClass: "hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-muted/5",
    },
    savings: {
      label: "Tabungan",
      icon: <Sparkles size={14} />,
      activeClass: "bg-card/45 border-t-2 border-t-zinc-500 border-x-muted-foreground/15 border-b-transparent text-zinc-900 dark:text-zinc-100 shadow-sm",
      hoverClass: "hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-muted/5",
    },
    debts: {
      label: "Hutang",
      icon: <CreditCard size={14} />,
      activeClass: "bg-card/45 border-t-2 border-t-rose-500 border-x-muted-foreground/15 border-b-transparent text-rose-600 dark:text-rose-400 shadow-sm",
      hoverClass: "hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/5",
    },
  };

  return (
    <div className="flex gap-1 items-end border-b border-muted-foreground/15 w-full mt-3 mb-4.5 z-10 relative">
      {(["needs", "wants", "savings", "debts"] as const).map((tabKey) => {
        const isActive = activeTab === tabKey;
        const config = tabThemes[tabKey];
        return (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            className={`py-2 px-4 sm:px-6 rounded-t-2xl text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer flex items-center gap-2 border-t border-x -mb-[1px] ${
              isActive
                ? config.activeClass
                : `bg-muted/10 border-transparent text-muted-foreground hover:text-foreground ${config.hoverClass}`
            }`}
          >
            {config.icon}
            {config.label}
          </button>
        );
      })}
    </div>
  );
}
