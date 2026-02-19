import { Link, useLocation } from "wouter";

interface DomainTab {
  id: string;
  label: string;
  path: string;
  matchPaths?: string[]; // additional paths that activate this tab
}

interface DomainLayoutProps {
  title: string;
  tabs: DomainTab[];
  children: React.ReactNode;
  actions?: React.ReactNode; // optional right-side actions in the header
}

function isTabActive(tab: DomainTab, location: string): boolean {
  if (location === tab.path) return true;
  if (tab.matchPaths) {
    return tab.matchPaths.some(p => location === p || location.startsWith(p + '/'));
  }
  return location.startsWith(tab.path + '/');
}

export default function DomainLayout({ title, tabs, children, actions }: DomainLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-screen">
      {/* Domain header with tabs */}
      <div className="shrink-0 bg-zinc-950 border-b border-zinc-800/60">
        <div className="flex items-center justify-between px-6 pt-4 pb-0">
          <h1 className="text-lg font-semibold text-white tracking-tight">{title}</h1>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        
        {/* Tab bar */}
        {tabs.length > 1 && (
          <div className="flex items-center gap-0 px-6 mt-2">
            {tabs.map((tab) => {
              const active = isTabActive(tab, location);
              return (
                <Link key={tab.id} href={tab.path}>
                  <button
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "text-yellow-500"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab.label}
                    {active && (
                      <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-yellow-500 rounded-full" />
                    )}
                  </button>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Domain content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
