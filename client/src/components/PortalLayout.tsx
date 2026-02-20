import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Sparkles, 
  LogOut,
  Loader2,
  Shield,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  Mail,
  Radio,
  Target,
  UserCog,
  Palette,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useEffect, createContext, useContext, useMemo } from "react";
import OmniAvatar, { OmniMode } from "./OmniAvatar";
import OmniChatPanel from "./OmniChatPanel";

// ─── Contexts ──────────────────────────────────────────────────────────────
interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}
export const SidebarContext = createContext<SidebarContextType>({ collapsed: false, setCollapsed: () => {} });
export const useSidebar = () => useContext(SidebarContext);

interface OmniContextType {
  omniMode: OmniMode;
  openChat: () => void;
}
export const OmniContext = createContext<OmniContextType>({ omniMode: "sigil", openChat: () => {} });
export const useOmni = () => useContext(OmniContext);

// Design context — lets child pages read the active design preferences
interface DesignContextType {
  theme: string;
  accentColor: string;
  logoUrl: string | null;
  refetch: () => void;
}
export const DesignContext = createContext<DesignContextType>({ theme: "obsidian", accentColor: "#d4af37", logoUrl: null, refetch: () => {} });
export const useDesign = () => useContext(DesignContext);

interface PortalLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_KEY = "omniscope-sidebar-collapsed";
const OMNI_MODE_KEY = "omniscope-omni-mode";
const OMNI_SIDEBAR_KEY = "omniscope-omni-sidebar-visible";

const DEFAULT_LOGO = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663324311854/ydFHlgxGadtyijbJ.png";
const DEFAULT_LOGO_FULL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663324311854/EnEmyoNefHCeqBIl.png";

// ─── Domain Definitions ────────────────────────────────────────────────────
interface DomainItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  matchPaths: string[];
}

const domains: DomainItem[] = [
  { id: "command", icon: LayoutDashboard, label: "Command Center", path: "/", matchPaths: ["/", "/reports/daily", "/reports/weekly"] },
  { id: "intelligence", icon: Radio, label: "Intelligence", path: "/intelligence", matchPaths: ["/intelligence", "/meetings", "/meeting/", "/vault", "/templates", "/pipeline"] },
  { id: "communications", icon: Mail, label: "Communications", path: "/communications", matchPaths: ["/communications", "/mail", "/calendar"] },
  { id: "operations", icon: Target, label: "Operations", path: "/operations", matchPaths: ["/operations", "/tasks"] },
  { id: "relationships", icon: Users, label: "Relationships", path: "/relationships", matchPaths: ["/relationships", "/contacts", "/contact/", "/companies", "/company/"] },
];

function isDomainActive(domain: DomainItem, location: string): boolean {
  return domain.matchPaths.some(p => {
    if (p === "/") return location === "/";
    return location === p || location.startsWith(p);
  });
}

// ─── Accent Color Utility ──────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// ─── Main Layout ───────────────────────────────────────────────────────────
export default function PortalLayout({ children }: PortalLayoutProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();
  
  // Design preferences
  const designQuery = trpc.design.get.useQuery(undefined, { enabled: isAuthenticated });
  const designPrefs = designQuery.data;
  const accentColor = designPrefs?.accentColor || "#d4af37";
  const customLogo = designPrefs?.logoUrl || null;
  const accentRgb = useMemo(() => hexToRgb(accentColor), [accentColor]);

  const [collapsed, setCollapsedState] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === "true"; } catch { return false; }
  });
  const setCollapsed = (v: boolean) => {
    setCollapsedState(v);
    try { localStorage.setItem(SIDEBAR_KEY, String(v)); } catch {};
  };

  // Omni state
  const [omniChatOpen, setOmniChatOpen] = useState(false);
  const [omniMode, setOmniMode] = useState<OmniMode>(() => {
    try { return (localStorage.getItem(OMNI_MODE_KEY) as OmniMode) || "sigil"; } catch { return "sigil"; }
  });
  const [omniSidebarVisible, setOmniSidebarVisible] = useState(() => {
    try { return localStorage.getItem(OMNI_SIDEBAR_KEY) !== "false"; } catch { return true; }
  });

  // Hover state for sidebar items
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);

  // Persist Omni preferences
  useEffect(() => { try { localStorage.setItem(OMNI_MODE_KEY, omniMode); } catch {} }, [omniMode]);
  useEffect(() => { try { localStorage.setItem(OMNI_SIDEBAR_KEY, String(omniSidebarVisible)); } catch {} }, [omniSidebarVisible]);

  // Listen for settings changes
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === OMNI_MODE_KEY && e.newValue) setOmniMode(e.newValue as OmniMode);
      if (e.key === OMNI_SIDEBAR_KEY && e.newValue) setOmniSidebarVisible(e.newValue === "true");
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // ⌘K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOmniChatOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success("Logged out successfully");
      window.location.href = getLoginUrl();
    } catch { toast.error("Failed to logout"); }
  };

  // Redirect first-time users to onboarding
  useEffect(() => {
    if (isAuthenticated && user && !user.onboardingCompleted && location !== '/onboarding') {
      setLocation('/onboarding');
    }
  }, [isAuthenticated, user, location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: accentColor }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(to right, rgba(${accentRgb}, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(${accentRgb}, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }} />
          <div className="absolute top-0 left-0 right-0 h-96" style={{ background: `linear-gradient(to bottom, rgba(${accentRgb}, 0.06), transparent)` }} />
          <div className="absolute bottom-0 left-0 right-0 h-96" style={{ background: `linear-gradient(to top, rgba(${accentRgb}, 0.06), transparent)` }} />
        </div>
        <div className="text-center relative z-10">
          <img src={customLogo || DEFAULT_LOGO_FULL} alt="OmniScope" className="h-48 mx-auto mb-12" />
          <h1 className="text-3xl font-bold text-white mb-3">Intelligence Portal</h1>
          <p className="text-zinc-400 mb-10 text-lg">Secure access required</p>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            className="text-black font-medium px-8 py-6 text-lg"
            style={{ backgroundColor: accentColor }}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';
  const sidebarWidth = collapsed ? "w-[72px]" : "w-[260px]";
  const mainMargin = collapsed ? "ml-[72px]" : "ml-[260px]";
  const profilePhoto = (user as any)?.profilePhotoUrl;

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
    <OmniContext.Provider value={{ omniMode, openChat: () => setOmniChatOpen(true) }}>
    <DesignContext.Provider value={{ theme: designPrefs?.theme || "obsidian", accentColor, logoUrl: customLogo, refetch: () => designQuery.refetch() }}>
      <div className="min-h-screen bg-black flex">
        {/* ─── Sidebar ─── */}
        <div 
          className={`${sidebarWidth} flex flex-col fixed left-0 top-0 h-screen transition-all duration-300 ease-in-out z-50`}
          style={{
            background: 'linear-gradient(180deg, rgba(15,15,15,0.98) 0%, rgba(10,10,10,0.99) 100%)',
            borderRight: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {/* ─── Logo Section ─── */}
          <div 
            className="relative flex items-center justify-center shrink-0"
            style={{ 
              padding: collapsed ? '16px 8px' : '20px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {collapsed ? (
              <div className="relative">
                <img 
                  src={customLogo || DEFAULT_LOGO} 
                  alt="OmniScope" 
                  className="w-10 h-10 object-contain transition-transform duration-300 hover:scale-105"
                />
                {/* Subtle glow behind logo */}
                <div 
                  className="absolute inset-0 rounded-full blur-lg opacity-20 -z-10"
                  style={{ backgroundColor: accentColor }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 w-full">
                <img 
                  src={customLogo || DEFAULT_LOGO} 
                  alt="OmniScope" 
                  className="w-full object-contain transition-transform duration-300"
                  style={{ maxWidth: '160px', height: 'auto' }}
                />
              </div>
            )}
            
            {/* Collapse Toggle — refined pill */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center transition-all duration-200 z-10 hover:scale-110"
              style={{
                background: 'rgba(30,30,30,0.95)',
                border: `1px solid rgba(${accentRgb}, 0.2)`,
                color: 'rgba(255,255,255,0.5)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `rgba(${accentRgb}, 0.5)`;
                e.currentTarget.style.color = accentColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `rgba(${accentRgb}, 0.2)`;
                e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              }}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
            </button>
          </div>

          {/* ─── Navigation ─── */}
          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
            {/* Section Label */}
            {!collapsed && (
              <div className="px-3 pb-2">
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Workspace
                </span>
              </div>
            )}

            {/* Domain Items */}
            {domains.map((domain) => {
              const Icon = domain.icon;
              const active = isDomainActive(domain, location);
              const hovered = hoveredDomain === domain.id;
              
              return (
                <Link key={domain.id} href={domain.path}>
                  <button
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-2 py-2.5' : 'px-3 py-2.5'} rounded-xl transition-all duration-200 group relative`}
                    style={{
                      background: active 
                        ? `rgba(${accentRgb}, 0.08)` 
                        : hovered 
                          ? 'rgba(255,255,255,0.03)' 
                          : 'transparent',
                      color: active ? accentColor : hovered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)',
                    }}
                    onMouseEnter={() => setHoveredDomain(domain.id)}
                    onMouseLeave={() => setHoveredDomain(null)}
                    title={collapsed ? domain.label : undefined}
                  >
                    {/* Active indicator — refined line */}
                    {active && (
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-5 rounded-r-full transition-all duration-300"
                        style={{ backgroundColor: accentColor }}
                      />
                    )}
                    <Icon 
                      className="h-[18px] w-[18px] shrink-0 transition-all duration-200" 
                      style={{ 
                        color: active ? accentColor : hovered ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                      }}
                    />
                    {!collapsed && (
                      <span className={`text-[13px] truncate transition-all duration-200 ${active ? 'font-medium' : ''}`}>
                        {domain.label}
                      </span>
                    )}
                  </button>
                </Link>
              );
            })}

            {/* Divider */}
            <div className="!my-3 mx-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />

            {/* Ask Omni — premium trigger */}
            {omniSidebarVisible && (
              <>
                {!collapsed && (
                  <div className="px-3 pb-2">
                    <span className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      Tools
                    </span>
                  </div>
                )}

                <button
                  onClick={() => setOmniChatOpen(true)}
                  className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-2 py-2.5' : 'px-3 py-2.5'} rounded-xl transition-all duration-200 group relative`}
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `rgba(${accentRgb}, 0.06)`;
                    e.currentTarget.style.color = accentColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
                  }}
                  title={collapsed ? "Ask Omni (⌘K)" : undefined}
                >
                  <Sparkles className="h-[18px] w-[18px] shrink-0 transition-colors duration-200" />
                  {!collapsed && (
                    <>
                      <span className="text-[13px] truncate flex-1 text-left">Ask Omni</span>
                      <kbd 
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                        style={{ 
                          background: 'rgba(255,255,255,0.04)', 
                          border: '1px solid rgba(255,255,255,0.06)',
                          color: 'rgba(255,255,255,0.3)',
                        }}
                      >
                        ⌘K
                      </kbd>
                    </>
                  )}
                </button>
              </>
            )}
          </nav>

          {/* ─── Footer: Settings + HR + Admin ─── */}
          <div className="px-2 pb-2 space-y-0.5">
            <div className="mx-2 mb-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }} />

            {[
              { path: "/setup", icon: Settings, label: "Settings" },
              { path: "/hr", icon: UserCog, label: "HR Hub" },
              ...(isAdmin ? [{ path: "/admin", icon: Shield, label: "Admin" }] : []),
            ].map((item) => {
              const Icon = item.icon;
              const active = location === item.path || location.startsWith(item.path + '/') || location.startsWith(item.path + '?');
              return (
                <Link key={item.path} href={item.path}>
                  <button
                    className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-2 py-2' : 'px-3 py-2'} rounded-xl transition-all duration-200 group relative`}
                    style={{
                      background: active ? `rgba(${accentRgb}, 0.08)` : 'transparent',
                      color: active ? accentColor : 'rgba(255,255,255,0.35)',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
                      }
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    {active && (
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-r-full"
                        style={{ backgroundColor: accentColor }}
                      />
                    )}
                    <Icon className="h-4 w-4 shrink-0 transition-colors duration-200" />
                    {!collapsed && <span className="text-xs truncate">{item.label}</span>}
                  </button>
                </Link>
              );
            })}
          </div>

          {/* ─── User Section — Premium ─── */}
          <div 
            className="p-3 shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
          >
            {collapsed ? (
              <div className="flex flex-col items-center gap-2">
                {profilePhoto ? (
                  <img 
                    src={profilePhoto} 
                    alt={user?.name || "User"} 
                    className="h-8 w-8 rounded-full object-cover ring-2"
                    style={{ ringColor: `rgba(${accentRgb}, 0.3)` }}
                  />
                ) : (
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center text-black font-bold text-xs"
                    style={{ backgroundColor: accentColor }}
                    title={user?.name || "User"}
                  >
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="transition-colors p-1 rounded-md"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
                  title="Sign Out"
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                {profilePhoto ? (
                  <img 
                    src={profilePhoto} 
                    alt={user?.name || "User"} 
                    className="h-9 w-9 rounded-full object-cover shrink-0 ring-2"
                    style={{ ringColor: `rgba(${accentRgb}, 0.2)` }}
                  />
                ) : (
                  <div 
                    className="h-9 w-9 rounded-full flex items-center justify-center text-black font-bold text-xs shrink-0"
                    style={{ backgroundColor: accentColor }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white truncate">{user?.name || "User"}</p>
                  <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg transition-all duration-200"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                  onMouseEnter={(e) => { 
                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; 
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => { 
                    e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; 
                    e.currentTarget.style.background = 'transparent';
                  }}
                  title="Sign Out"
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <main className={`flex-1 overflow-auto ${mainMargin} transition-all duration-300 ease-in-out`}>
          {children}
        </main>

        {/* Floating Omni Avatar */}
        {omniMode !== "hidden" && !omniChatOpen && location !== "/" && (
          <div className="fixed bottom-6 right-6 z-[80]">
            <OmniAvatar
              mode={omniMode}
              state="idle"
              size={56}
              onClick={() => setOmniChatOpen(true)}
              badge={false}
            />
          </div>
        )}

        {/* Omni Chat Panel */}
        <OmniChatPanel
          open={omniChatOpen}
          onClose={() => setOmniChatOpen(false)}
          omniMode={omniMode === "hidden" ? "sigil" : omniMode}
          currentPage={location}
        />
      </div>
    </DesignContext.Provider>
    </OmniContext.Provider>
    </SidebarContext.Provider>
  );
}

// Export Omni settings for use in Settings page
export type { OmniMode };
export { OMNI_MODE_KEY, OMNI_SIDEBAR_KEY };
