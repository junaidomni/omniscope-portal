import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useOrg } from "@/contexts/OrgContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Palette,
  Globe,
  Briefcase,
  Sparkles,
  Check,
  Loader2,
  Upload,
  X,
} from "lucide-react";

type Step = "name" | "branding" | "details" | "review";
const STEPS: Step[] = ["name", "branding", "details", "review"];
const STEP_LABELS: Record<Step, string> = {
  name: "Company",
  branding: "Branding",
  details: "Details",
  review: "Launch",
};

const INDUSTRIES = [
  "Financial Services",
  "Real Estate",
  "Technology",
  "Commodities & Energy",
  "Legal & Compliance",
  "Consulting",
  "Healthcare",
  "Manufacturing",
  "Retail & E-Commerce",
  "Media & Entertainment",
  "Other",
];

const ACCENT_PRESETS = [
  { label: "Gold", value: "#d4af37" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Emerald", value: "#10b981" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Red", value: "#ef4444" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Orange", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
];

export default function OrgOnboarding() {
  const { user } = useAuth();
  const { refresh } = useOrg();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("name");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [accentColor, setAccentColor] = useState("#d4af37");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [industry, setIndustry] = useState("");
  const [domain, setDomain] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
  );

  const createOrgMutation = trpc.organizations.create.useMutation();
  const updateOrgMutation = trpc.organizations.update.useMutation();
  const slugCheck = trpc.organizations.checkSlug.useQuery(
    { slug: orgSlug },
    { enabled: orgSlug.length >= 2, retry: false }
  );

  // Auto-generate slug from name
  const handleNameChange = useCallback(
    (name: string) => {
      setOrgName(name);
      if (!slugManuallyEdited) {
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 50);
        setOrgSlug(slug || "");
      }
    },
    [slugManuallyEdited]
  );

  const stepIndex = STEPS.indexOf(step);
  const canGoNext = useMemo(() => {
    switch (step) {
      case "name":
        return orgName.trim().length >= 2 && orgSlug.length >= 2 && slugCheck.data?.available !== false;
      case "branding":
        return true; // accent color has default
      case "details":
        return true; // all optional
      case "review":
        return true;
      default:
        return false;
    }
  }, [step, orgName, orgSlug, slugCheck.data]);

  const goNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };
  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const org = await createOrgMutation.mutateAsync({
        name: orgName.trim(),
        slug: orgSlug,
        accentColor,
        logoUrl: logoUrl || undefined,
        industry: industry || undefined,
        domain: domain || undefined,
        timezone,
      });

      if (org?.id) {
        // Mark onboarding as completed
        await updateOrgMutation.mutateAsync({
          orgId: org.id,
          onboardingCompleted: true,
        });
      }

      refresh();
      toast.success(`${orgName} is ready!`, { description: "Your new workspace has been created." });
      setLocation("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared styling
  const accentRgb = useMemo(() => {
    const hex = accentColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `${r},${g},${b}`;
  }, [accentColor]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">New Organization</span>
        </div>
        <button
          onClick={() => setLocation("/")}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-1 py-6">
        {STEPS.map((s, i) => {
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={s} className="flex items-center gap-1">
              <button
                onClick={() => i <= stepIndex && setStep(s)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200"
                style={{
                  background: isActive
                    ? `color-mix(in oklch, ${accentColor} 12%, transparent)`
                    : isDone
                    ? `color-mix(in oklch, ${accentColor} 6%, transparent)`
                    : "transparent",
                  color: isActive ? accentColor : isDone ? accentColor : undefined,
                }}
                disabled={i > stepIndex}
              >
                {isDone ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span
                    className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: isActive ? accentColor : "transparent",
                      color: isActive ? "#000" : undefined,
                      border: isActive ? "none" : "1px solid currentColor",
                      opacity: isActive || isDone ? 1 : 0.3,
                    }}
                  >
                    {i + 1}
                  </span>
                )}
                <span className={`text-xs font-medium ${!isActive && !isDone ? "text-muted-foreground/40" : ""}`}>
                  {STEP_LABELS[s]}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className="w-8 h-px"
                  style={{
                    background: isDone ? accentColor : "var(--border)",
                    opacity: isDone ? 0.4 : 0.2,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 py-4">
        <div className="w-full max-w-lg">
          {step === "name" && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Name your workspace</h1>
                <p className="text-sm text-muted-foreground">This is the company or team this workspace represents.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. OmniScope Group"
                    className="mt-2 w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all"
                    style={{ focusRingColor: accentColor } as any}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    URL Slug
                  </label>
                  <div className="mt-2 flex items-center gap-0 rounded-xl bg-card border border-border overflow-hidden">
                    <span className="px-3 py-3 text-sm text-muted-foreground/50 bg-muted/30 border-r border-border shrink-0">
                      omniscope.app/
                    </span>
                    <input
                      type="text"
                      value={orgSlug}
                      onChange={(e) => {
                        setSlugManuallyEdited(true);
                        setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                      }}
                      placeholder="your-company"
                      className="flex-1 px-3 py-3 bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none text-sm"
                    />
                    {orgSlug.length >= 2 && (
                      <span className="px-3">
                        {slugCheck.isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : slugCheck.data?.available ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </span>
                    )}
                  </div>
                  {orgSlug.length >= 2 && slugCheck.data?.available === false && (
                    <p className="mt-1.5 text-xs text-red-400">This slug is already taken. Try another.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === "branding" && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Brand your workspace</h1>
                <p className="text-sm text-muted-foreground">Choose colors and upload a logo to personalize the experience.</p>
              </div>

              <div className="space-y-6">
                {/* Accent Color */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Accent Color
                  </label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ACCENT_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => setAccentColor(preset.value)}
                        className="relative h-9 w-9 rounded-full transition-all duration-200 hover:scale-110"
                        style={{
                          backgroundColor: preset.value,
                          boxShadow:
                            accentColor === preset.value
                              ? `0 0 0 2px var(--background), 0 0 0 4px ${preset.value}`
                              : "none",
                        }}
                        title={preset.label}
                      >
                        {accentColor === preset.value && (
                          <Check className="h-4 w-4 absolute inset-0 m-auto text-white drop-shadow-md" />
                        )}
                      </button>
                    ))}
                    {/* Custom color */}
                    <div className="relative">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-9 h-9"
                      />
                      <div
                        className="h-9 w-9 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-foreground/30 transition-colors"
                      >
                        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logo Upload placeholder */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Logo (Optional)
                  </label>
                  <div className="mt-3">
                    {logoUrl ? (
                      <div className="relative inline-block">
                        <img
                          src={logoUrl}
                          alt="Logo"
                          className="h-20 w-20 rounded-xl object-cover border border-border"
                        />
                        <button
                          onClick={() => setLogoUrl(null)}
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="h-20 w-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-foreground/30 transition-colors"
                        onClick={() => toast.info("Logo upload available after workspace creation", { description: "You can upload a logo in Settings." })}
                      >
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">Upload</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Preview
                  </label>
                  <div
                    className="mt-3 p-4 rounded-xl border border-border/50"
                    style={{ background: `linear-gradient(135deg, ${accentColor}08, ${accentColor}15)` }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm"
                        style={{
                          background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}55)`,
                          color: accentColor,
                        }}
                      >
                        {orgName ? orgName.split(/[\s-]+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "OS"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{orgName || "Your Organization"}</p>
                        <p className="text-[11px]" style={{ color: accentColor }}>
                          {industry || "Workspace"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Workspace details</h1>
                <p className="text-sm text-muted-foreground">Optional details to help organize your workspace.</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Industry
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 transition-all appearance-none"
                  >
                    <option value="">Select industry...</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Company Domain
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. omniscopex.ae"
                    className="mt-2 w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="mt-2 w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 transition-all appearance-none"
                  >
                    {[
                      "America/New_York",
                      "America/Chicago",
                      "America/Denver",
                      "America/Los_Angeles",
                      "Europe/London",
                      "Europe/Paris",
                      "Asia/Dubai",
                      "Asia/Karachi",
                      "Asia/Singapore",
                      "Asia/Tokyo",
                      "Australia/Sydney",
                      "Pacific/Auckland",
                    ].map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Ready to launch</h1>
                <p className="text-sm text-muted-foreground">Review your workspace configuration before creating it.</p>
              </div>

              <div
                className="rounded-2xl border border-border/50 overflow-hidden"
                style={{ background: `linear-gradient(180deg, ${accentColor}08, transparent)` }}
              >
                {/* Header card */}
                <div className="p-6 flex items-center gap-4">
                  <div
                    className="h-14 w-14 rounded-xl flex items-center justify-center font-bold text-lg"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}55)`,
                      color: accentColor,
                    }}
                  >
                    {orgName.split(/[\s-]+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">{orgName}</h2>
                    <p className="text-xs text-muted-foreground">omniscope.app/{orgSlug}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="border-t border-border/30 divide-y divide-border/20">
                  {[
                    { label: "Industry", value: industry || "Not specified", icon: Briefcase },
                    { label: "Domain", value: domain || "Not specified", icon: Globe },
                    { label: "Timezone", value: timezone.replace(/_/g, " "), icon: Globe },
                    { label: "Accent", value: accentColor, icon: Palette, isColor: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 px-6 py-3">
                      <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground w-20">{item.label}</span>
                      {(item as any).isColor ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: item.value }}
                          />
                          <span className="text-sm text-foreground">{item.value}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-foreground">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pb-10">
            {stepIndex > 0 ? (
              <Button variant="ghost" onClick={goBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2 text-muted-foreground">
                Cancel
              </Button>
            )}

            {step === "review" ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="gap-2 px-6"
                style={{ backgroundColor: accentColor, color: "#000" }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Launch Workspace
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={!canGoNext}
                className="gap-2 px-6"
                style={{ backgroundColor: accentColor, color: "#000", opacity: canGoNext ? 1 : 0.5 }}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
