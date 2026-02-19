import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Send, Clock, Eye, CheckCircle2, XCircle, AlertCircle,
  FileText, Search, MoreHorizontal, Loader2, Settings,
  Plus, Trash2, ExternalLink, Shield, RefreshCw, User,
  Building2, ChevronRight, Download, Mail, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

// ─── Constants ───
const PIPELINE_STAGES = [
  { id: "draft", label: "Draft", icon: FileText, color: "text-zinc-400", bgColor: "bg-zinc-800/40" },
  { id: "sent", label: "Sent", icon: Send, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { id: "viewed", label: "Viewed", icon: Eye, color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  { id: "signed", label: "Signed", icon: CheckCircle2, color: "text-green-400", bgColor: "bg-green-500/10" },
  { id: "declined", label: "Declined", icon: XCircle, color: "text-red-400", bgColor: "bg-red-500/10" },
];

const PROVIDER_INFO: Record<string, { name: string; description: string; costLabel: string }> = {
  firma: { name: "Firma.dev", description: "Ultra-low cost API-first signing", costLabel: "$0.029/envelope" },
  signatureapi: { name: "SignatureAPI", description: "Developer-friendly REST API", costLabel: "$0.25/envelope" },
  docuseal: { name: "DocuSeal", description: "Open-source, self-hostable", costLabel: "Free (self-hosted)" },
  pandadoc: { name: "PandaDocs", description: "Full document automation suite", costLabel: "$19-65/user/mo" },
  docusign: { name: "DocuSign", description: "Enterprise-grade e-signature", costLabel: "$10-65/user/mo" },
  boldsign: { name: "BoldSign", description: "Syncfusion's signing platform", costLabel: "$0.10/envelope" },
  esignly: { name: "eSignly", description: "Affordable e-signature solution", costLabel: "$0.50/envelope" },
};

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Pipeline() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [filterStage, setFilterStage] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);

  // Queries
  const envelopes = trpc.signing.listEnvelopes.useQuery({
    status: filterStage !== "all" ? filterStage : undefined,
  });
  const providers = trpc.signing.listProviders.useQuery();

  // Group envelopes by stage for Kanban view
  const stageGroups = useMemo(() => {
    const items = envelopes.data || [];
    const groups: Record<string, any[]> = {};
    PIPELINE_STAGES.forEach(s => { groups[s.id] = []; });
    items.forEach((env: any) => {
      const stage = groups[env.status] ? env.status : "draft";
      groups[stage].push(env);
    });
    return groups;
  }, [envelopes.data]);

  const totalEnvelopes = envelopes.data?.length || 0;
  const activeProvider = providers.data?.find((p: any) => p.isActive);

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-zinc-800/60">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Document Pipeline</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {totalEnvelopes} document{totalEnvelopes !== 1 ? "s" : ""} in pipeline
              {activeProvider && (
                <> · Signing via <span className="text-yellow-500">{PROVIDER_INFO[activeProvider.provider]?.name || activeProvider.provider}</span></>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setProviderDialogOpen(true)} className="border-zinc-700 text-zinc-400">
              <Settings className="h-4 w-4 mr-1.5" /> Providers
            </Button>
            <Button onClick={() => setSendDialogOpen(true)} className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium" size="sm">
              <Send className="h-4 w-4 mr-1.5" /> Send for Signature
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs: Pipeline / List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="shrink-0 px-6 border-b border-zinc-800/40">
          <TabsList className="bg-transparent border-0 h-auto p-0 gap-4">
            <TabsTrigger value="pipeline" className="bg-transparent border-0 px-0 pb-2.5 pt-2 text-sm data-[state=active]:text-yellow-500 data-[state=active]:shadow-none relative data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-yellow-500 data-[state=active]:after:rounded-full">
              Pipeline View
            </TabsTrigger>
            <TabsTrigger value="list" className="bg-transparent border-0 px-0 pb-2.5 pt-2 text-sm data-[state=active]:text-yellow-500 data-[state=active]:shadow-none relative data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-yellow-500 data-[state=active]:after:rounded-full">
              List View
            </TabsTrigger>
            <TabsTrigger value="providers" className="bg-transparent border-0 px-0 pb-2.5 pt-2 text-sm data-[state=active]:text-yellow-500 data-[state=active]:shadow-none relative data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-yellow-500 data-[state=active]:after:rounded-full">
              Signing Providers
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Pipeline (Kanban) View */}
        <TabsContent value="pipeline" className="flex-1 overflow-auto p-6 mt-0">
          {envelopes.isLoading ? (
            <div className="grid grid-cols-5 gap-4">
              {PIPELINE_STAGES.map(s => (
                <div key={s.id} className="space-y-2">
                  <Skeleton className="h-8 bg-zinc-900" />
                  <Skeleton className="h-24 bg-zinc-900" />
                  <Skeleton className="h-24 bg-zinc-900" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-4 min-h-[400px]">
              {PIPELINE_STAGES.map(stage => {
                const Icon = stage.icon;
                const items = stageGroups[stage.id] || [];
                return (
                  <div key={stage.id} className="flex flex-col">
                    {/* Column Header */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${stage.bgColor} mb-3`}>
                      <Icon className={`h-4 w-4 ${stage.color}`} />
                      <span className={`text-sm font-medium ${stage.color}`}>{stage.label}</span>
                      <Badge variant="outline" className="ml-auto text-[10px] border-zinc-700 text-zinc-500">{items.length}</Badge>
                    </div>

                    {/* Cards */}
                    <div className="space-y-2 flex-1">
                      {items.length === 0 ? (
                        <div className="text-center py-8 text-zinc-700 text-xs">No documents</div>
                      ) : (
                        items.map((env: any) => (
                          <div key={env.id} className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 transition-all group">
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-sm font-medium text-white line-clamp-2">{env.documentTitle || `Document #${env.documentId}`}</p>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1 rounded text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                                  <DropdownMenuItem><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                                  <DropdownMenuItem><RefreshCw className="h-4 w-4 mr-2" /> Resend</DropdownMenuItem>
                                  {env.signedDocumentUrl && (
                                    <DropdownMenuItem onClick={() => window.open(env.signedDocumentUrl, "_blank")}>
                                      <Download className="h-4 w-4 mr-2" /> Download Signed
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {env.recipientEmail && (
                              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1.5">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{env.recipientEmail}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-zinc-600">{formatDate(env.sentAt || env.createdAt)}</span>
                              {env.provider && (
                                <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-600">
                                  {PROVIDER_INFO[env.provider]?.name || env.provider}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="flex-1 overflow-auto p-6 mt-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search envelopes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800 text-sm">
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {PIPELINE_STAGES.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {envelopes.isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 bg-zinc-900" />)}
            </div>
          ) : !envelopes.data?.length ? (
            <div className="text-center py-16">
              <Send className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No documents in the pipeline</p>
              <p className="text-zinc-600 text-sm mt-1">Send a document for signature to see it here</p>
            </div>
          ) : (
            <div className="space-y-1">
              {envelopes.data.map((env: any) => {
                const stage = PIPELINE_STAGES.find(s => s.id === env.status) || PIPELINE_STAGES[0];
                const Icon = stage.icon;
                return (
                  <div key={env.id} className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-zinc-900/80 transition-all group">
                    <div className={`h-9 w-9 rounded-lg ${stage.bgColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${stage.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{env.documentTitle || `Document #${env.documentId}`}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {env.recipientEmail && <span className="text-xs text-zinc-600">{env.recipientEmail}</span>}
                        {env.recipientName && (
                          <>
                            <span className="text-zinc-700">·</span>
                            <span className="text-xs text-zinc-500">{env.recipientName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${stage.color} border-current/30`}>{stage.label}</Badge>
                    <span className="text-xs text-zinc-600 shrink-0 w-16 text-right">{formatDate(env.sentAt || env.createdAt)}</span>
                    {env.provider && (
                      <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-600 shrink-0">
                        {PROVIDER_INFO[env.provider]?.name || env.provider}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Signing Providers Tab */}
        <TabsContent value="providers" className="flex-1 overflow-auto p-6 mt-0">
          <div className="max-w-3xl">
            <div className="mb-6">
              <h3 className="text-base font-semibold text-white mb-1">E-Signature Providers</h3>
              <p className="text-sm text-zinc-500">Connect your preferred signing provider. OmniScope supports multiple providers — switch anytime without losing your pipeline history.</p>
            </div>

            {providers.isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 bg-zinc-900 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(PROVIDER_INFO).map(([key, info]) => {
                  const configured = providers.data?.find((p: any) => p.provider === key);
                  const isActive = configured?.isActive;
                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-xl border transition-all ${
                        isActive
                          ? "bg-yellow-600/5 border-yellow-600/30"
                          : configured
                          ? "bg-zinc-900/60 border-zinc-700"
                          : "bg-zinc-900/30 border-zinc-800/60 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isActive ? "bg-yellow-600/20" : "bg-zinc-800"}`}>
                            <Shield className={`h-5 w-5 ${isActive ? "text-yellow-500" : "text-zinc-500"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-white">{info.name}</h4>
                              {isActive && <Badge className="bg-yellow-600/20 text-yellow-500 border-0 text-[10px]">Active</Badge>}
                              {configured && !isActive && <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">Configured</Badge>}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">{info.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-zinc-600 font-mono">{info.costLabel}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setProviderDialogOpen(true)}
                            className={isActive ? "border-yellow-600/30 text-yellow-500" : "border-zinc-700 text-zinc-400"}
                          >
                            {configured ? "Configure" : "Connect"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cost comparison note */}
            <div className="mt-6 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Cost Comparison at 50 docs/month</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between text-zinc-500"><span>Firma.dev</span><span className="text-emerald-400 font-mono">$1.45/mo</span></div>
                <div className="flex justify-between text-zinc-500"><span>BoldSign</span><span className="text-emerald-400 font-mono">$5.00/mo</span></div>
                <div className="flex justify-between text-zinc-500"><span>SignatureAPI</span><span className="text-zinc-400 font-mono">$12.50/mo</span></div>
                <div className="flex justify-between text-zinc-500"><span>eSignly</span><span className="text-zinc-400 font-mono">$25.00/mo</span></div>
                <div className="flex justify-between text-zinc-500"><span>DocuSeal (cloud)</span><span className="text-zinc-400 font-mono">$30.00/mo</span></div>
                <div className="flex justify-between text-zinc-500"><span>PandaDocs</span><span className="text-orange-400 font-mono">$57-195/mo</span></div>
                <div className="flex justify-between text-zinc-500"><span>DocuSign</span><span className="text-orange-400 font-mono">$30-195/mo</span></div>
                <div className="flex justify-between text-zinc-500"><span>DocuSeal (self)</span><span className="text-emerald-400 font-mono">Free</span></div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Send for Signature Dialog */}
      <SendForSignatureDialog
        open={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        onSuccess={() => envelopes.refetch()}
      />

      {/* Provider Configuration Dialog */}
      <ProviderConfigDialog
        open={providerDialogOpen}
        onClose={() => setProviderDialogOpen(false)}
        onSuccess={() => providers.refetch()}
      />
    </div>
  );
}

// ─── Send for Signature Dialog ───
function SendForSignatureDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [documentId, setDocumentId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");

  const sendForSigning = trpc.signing.sendForSignature.useMutation({
    onSuccess: () => {
      toast.success("Document sent for signature");
      onSuccess();
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const reset = () => {
    setDocumentId(""); setRecipientName(""); setRecipientEmail(""); setMessage("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && reset()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Send className="h-5 w-5 text-yellow-500" /> Send for Signature
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-zinc-400 text-xs">Document ID</Label>
            <Input value={documentId} onChange={(e) => setDocumentId(e.target.value)} placeholder="Enter document ID" className="bg-zinc-900 border-zinc-800 text-white mt-1" />
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Recipient Name</Label>
            <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="John Smith" className="bg-zinc-900 border-zinc-800 text-white mt-1" />
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Recipient Email</Label>
            <Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="john@company.com" className="bg-zinc-900 border-zinc-800 text-white mt-1" type="email" />
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Message (optional)</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Please review and sign..." className="bg-zinc-900 border-zinc-800 text-white mt-1" rows={2} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={reset} className="border-zinc-700 text-zinc-400">Cancel</Button>
          <Button
            onClick={() => sendForSigning.mutate({
              documentId: parseInt(documentId),
              recipientName,
              recipientEmail,
              message: message || undefined,
            })}
            disabled={!documentId || !recipientEmail || sendForSigning.isPending}
            className="bg-yellow-600 hover:bg-yellow-700 text-black"
          >
            {sendForSigning.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Send className="h-4 w-4 mr-1.5" />}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Provider Configuration Dialog ───
function ProviderConfigDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [provider, setProvider] = useState("firma");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");

  const configureProvider = trpc.signing.configureProvider.useMutation({
    onSuccess: () => {
      toast.success("Provider configured and activated");
      onSuccess();
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const reset = () => {
    setApiKey(""); setApiSecret(""); setWebhookUrl("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && reset()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5 text-yellow-500" /> Configure Signing Provider
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-zinc-400 text-xs">Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROVIDER_INFO).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.name} — {v.costLabel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">API Key</Label>
            <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter API key" className="bg-zinc-900 border-zinc-800 text-white mt-1 font-mono text-xs" type="password" />
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">API Secret (if required)</Label>
            <Input value={apiSecret} onChange={(e) => setApiSecret(e.target.value)} placeholder="Optional" className="bg-zinc-900 border-zinc-800 text-white mt-1 font-mono text-xs" type="password" />
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Webhook URL (auto-configured on deploy)</Label>
            <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-domain.com/api/webhooks/signing" className="bg-zinc-900 border-zinc-800 text-white mt-1 font-mono text-xs" />
          </div>

          <div className="bg-yellow-600/5 border border-yellow-600/20 rounded-lg p-3">
            <p className="text-xs text-zinc-400">
              Setting this provider as active will route all new signing requests through it. Existing envelopes will continue using their original provider.
            </p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={reset} className="border-zinc-700 text-zinc-400">Cancel</Button>
          <Button
            onClick={() => configureProvider.mutate({
              provider: provider as any,
              apiKey,
              apiSecret: apiSecret || undefined,
              webhookUrl: webhookUrl || undefined,
            })}
            disabled={!apiKey || configureProvider.isPending}
            className="bg-yellow-600 hover:bg-yellow-700 text-black"
          >
            {configureProvider.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Check className="h-4 w-4 mr-1.5" />}
            Activate Provider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
