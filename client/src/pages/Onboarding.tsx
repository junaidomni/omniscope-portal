import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Circle, ExternalLink, ArrowRight, Mic, Video,
  Calendar, Mail, Shield, Sparkles, ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface StepStatus {
  fathom: boolean;
  google: boolean;
  plaud: boolean;
}

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<StepStatus>({
    fathom: false,
    google: false,
    plaud: false,
  });
  const [isCheckingGoogle, setIsCheckingGoogle] = useState(true);

  // Check Google connection status
  useEffect(() => {
    fetch('/api/google/status')
      .then(r => r.json())
      .then(data => {
        setStatus(prev => ({ ...prev, google: data.connected }));
      })
      .catch(() => {})
      .finally(() => setIsCheckingGoogle(false));

    // Check URL params for Google connection callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('google') === 'connected') {
      setStatus(prev => ({ ...prev, google: true }));
      toast.success('Google account connected successfully!');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Fathom is connected if we have the API key configured (admin-level)
  // For onboarding, we just guide them to install Fathom
  useEffect(() => {
    // Check if Fathom meetings exist (proxy for "Fathom is working")
    fetch('/api/trpc/ingestion.syncFathom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).then(r => r.json())
      .then(data => {
        if (data?.result?.data) {
          setStatus(prev => ({ ...prev, fathom: true }));
        }
      })
      .catch(() => {});
  }, []);

  const connectGoogle = async () => {
    try {
      const response = await fetch(`/api/google/auth?origin=${encodeURIComponent(window.location.origin)}`);
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error('Failed to start Google authorization');
      }
    } catch {
      toast.error('Failed to connect to Google');
    }
  };

  const completedCount = Object.values(status).filter(Boolean).length;
  const totalSteps = 3;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome to OmniScope</h1>
        <p className="text-zinc-400">
          Connect your tools to unlock the full intelligence pipeline. Each integration enables
          automatic meeting capture, analysis, and actionable intelligence.
        </p>
      </div>

      {/* Progress */}
      <Card className="bg-zinc-900/80 border-zinc-800 mb-6 overflow-hidden">
        <div className="h-1 bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-500 transition-all duration-500"
            style={{ width: `${(completedCount / totalSteps) * 100}%` }}
          />
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-white">
                {completedCount === totalSteps
                  ? "All integrations connected!"
                  : `${completedCount} of ${totalSteps} integrations connected`}
              </span>
            </div>
            {completedCount === totalSteps && (
              <Button
                onClick={() => setLocation("/")}
                className="bg-yellow-600 hover:bg-yellow-500 text-black font-medium"
                size="sm"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Integration Steps */}
      <div className="space-y-4">
        {/* Step 1: Fathom */}
        <IntegrationCard
          step={1}
          title="Fathom AI Notetaker"
          description="Fathom records and transcribes your video calls. OmniScope automatically imports recordings and generates intelligence reports."
          icon={<Video className="h-5 w-5" />}
          connected={status.fathom}
          instructions={[
            "Install Fathom from fathom.video and create an account",
            "Enable Fathom to join your Google Meet / Zoom calls",
            "After your first call, OmniScope will automatically detect and import it",
            "Intelligence reports are generated within minutes of each call",
          ]}
          action={
            <a href="https://fathom.video" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-yellow-600/50 text-yellow-600 hover:bg-yellow-600/10">
                <ExternalLink className="h-4 w-4 mr-2" />
                Install Fathom
              </Button>
            </a>
          }
        />

        {/* Step 2: Google Account */}
        <IntegrationCard
          step={2}
          title="Google Calendar & Gmail"
          description="Connect your Google account to sync calendar events, send meeting recaps via Gmail, and see your schedule in the portal."
          icon={<Calendar className="h-5 w-5" />}
          connected={status.google}
          isLoading={isCheckingGoogle}
          instructions={[
            "Click 'Connect Google' below to authorize OmniScope",
            "Grant access to Calendar (view & create events) and Gmail (send recaps)",
            "Your calendar events will sync automatically every time you open the portal",
            "You can send branded meeting recaps directly from any intelligence report",
          ]}
          action={
            status.google ? (
              <Badge variant="outline" className="border-green-600/50 text-green-500 py-1.5 px-3">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Connected
              </Badge>
            ) : (
              <Button
                onClick={connectGoogle}
                className="bg-yellow-600 hover:bg-yellow-500 text-black font-medium"
              >
                <Mail className="h-4 w-4 mr-2" />
                Connect Google
              </Button>
            )
          }
        />

        {/* Step 3: Plaud */}
        <IntegrationCard
          step={3}
          title="Plaud AI Recorder"
          description="Plaud captures in-person meetings and phone calls. Upload recordings to OmniScope for the same intelligence pipeline as video calls."
          icon={<Mic className="h-5 w-5" />}
          connected={status.plaud}
          instructions={[
            "Get a Plaud AI recorder device from plaud.ai",
            "Record your in-person meetings and phone calls",
            "Export recordings from the Plaud app",
            "Upload to OmniScope via the Meetings page → 'Upload Recording' button",
          ]}
          action={
            <a href="https://www.plaud.ai" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-yellow-600/50 text-yellow-600 hover:bg-yellow-600/10">
                <ExternalLink className="h-4 w-4 mr-2" />
                Get Plaud
              </Button>
            </a>
          }
        />
      </div>

      {/* Security Note */}
      <Card className="bg-zinc-900/30 border-zinc-800/50 mt-8">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-zinc-300">Enterprise-Grade Security</p>
            <p className="text-xs text-zinc-500 mt-1">
              All data is encrypted in transit and at rest. OmniScope never shares your meeting data with third parties.
              Google OAuth tokens are stored securely and can be revoked at any time from your Google Account settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Skip for now */}
      <div className="text-center mt-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="text-zinc-500 hover:text-zinc-300"
        >
          Skip for now — I'll set up later
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function IntegrationCard({
  step,
  title,
  description,
  icon,
  connected,
  isLoading,
  instructions,
  action,
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  isLoading?: boolean;
  instructions: string[];
  action: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(!connected);

  return (
    <Card className={`border transition-all ${
      connected
        ? "bg-zinc-900/30 border-green-600/20"
        : "bg-zinc-900/50 border-zinc-800 hover:border-yellow-600/30"
    }`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Step indicator */}
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            connected ? "bg-green-600/20 text-green-500" : "bg-yellow-600/20 text-yellow-500"
          }`}>
            {connected ? <CheckCircle2 className="h-5 w-5" /> : icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <Badge variant="outline" className={`text-xs ${
                  connected ? "border-green-600/30 text-green-500" : "border-zinc-700 text-zinc-500"
                }`}>
                  Step {step}
                </Badge>
              </div>
              {action}
            </div>
            <p className="text-sm text-zinc-400 mb-3">{description}</p>

            {/* Instructions (collapsible) */}
            {!connected && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-yellow-600 hover:text-yellow-500 mb-2 flex items-center gap-1"
              >
                {expanded ? "Hide" : "Show"} setup instructions
                <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
              </button>
            )}
            {expanded && !connected && (
              <div className="space-y-2 mt-2">
                {instructions.map((instruction, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="h-5 w-5 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-zinc-400">{i + 1}</span>
                    </div>
                    <p className="text-sm text-zinc-400">{instruction}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
