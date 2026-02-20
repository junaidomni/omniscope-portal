import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Shield, UserPlus, Trash2, Crown, Zap, Download, Webhook, Loader2,
  CheckCircle, AlertCircle, Mail, Clock, X, Users, ScrollText, Search,
  ChevronRight, ArrowUpRight, Settings, Key, Activity, UserCheck
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminPanel() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");
  const [importLimit, setImportLimit] = useState("10");
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);
  const [activeSection, setActiveSection] = useState<"users" | "invitations" | "fathom" | "tools">("users");

  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.admin.getAllUsers.useQuery();
  const { data: invitationsList = [] } = trpc.admin.listInvitations.useQuery();

  const createInvitation = trpc.admin.createInvitation.useMutation({
    onSuccess: () => { toast.success("Invitation created successfully"); setInviteEmail(""); setInviteFullName(""); setInviteRole("user"); utils.admin.listInvitations.invalidate(); },
    onError: (error: { message: string }) => toast.error(error.message),
  });
  const deleteInvitation = trpc.admin.deleteInvitation.useMutation({
    onSuccess: () => { toast.success("Invitation revoked"); utils.admin.listInvitations.invalidate(); },
    onError: (error: { message: string }) => toast.error(error.message),
  });
  const updateUserRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { toast.success("User role updated"); utils.admin.getAllUsers.invalidate(); },
    onError: (error: { message: string }) => toast.error(error.message),
  });
  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { toast.success("User removed"); utils.admin.getAllUsers.invalidate(); },
    onError: (error: { message: string }) => toast.error(error.message),
  });
  const importFathom = trpc.admin.importFathomMeetings.useMutation({
    onSuccess: (data) => {
      setImportResult(data);
      if (data.imported > 0) toast.success(`Imported ${data.imported} meeting(s) from Fathom`);
      else if (data.skipped > 0) toast.info(`All ${data.skipped} meeting(s) already imported`);
      if (data.errors > 0) toast.error(`${data.errors} meeting(s) failed to import`);
    },
    onError: (error: { message: string }) => toast.error(`Fathom import failed: ${error.message}`),
  });
  const registerWebhook = trpc.admin.registerFathomWebhook.useMutation({
    onSuccess: () => toast.success("Fathom webhook registered successfully"),
    onError: (error: { message: string }) => toast.error(`Webhook registration failed: ${error.message}`),
  });

  const handleInvite = () => {
    if (!inviteEmail || !inviteEmail.includes("@")) { toast.error("Please enter a valid email"); return; }
    if (!inviteFullName.trim()) { toast.error("Please enter the person's full name"); return; }
    createInvitation.mutate({ email: inviteEmail.toLowerCase().trim(), fullName: inviteFullName.trim(), role: inviteRole });
  };

  const pendingInvitations = invitationsList.filter((inv: any) => !inv.acceptedAt);

  const sections = [
    { id: "users" as const, label: "Team Members", icon: Users, count: users?.length || 0 },
    { id: "invitations" as const, label: "Invitations", icon: Mail, count: pendingInvitations.length },
    { id: "fathom" as const, label: "Fathom Import", icon: Zap, count: null },
    { id: "tools" as const, label: "Admin Tools", icon: Settings, count: null },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/5 via-transparent to-red-600/3" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-600/3 rounded-full blur-3xl" />
        <div className="relative px-8 pt-8 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-600 to-yellow-700 flex items-center justify-center">
                <Shield className="h-5 w-5 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Administration</h1>
                <p className="text-sm text-zinc-500">User management, access control, and system tools</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Strip */}
      <div className="px-8 pb-6">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Team Members", value: users?.length || 0, icon: Users, color: "text-white", accent: "from-zinc-800 to-zinc-900" },
            { label: "Admins", value: users?.filter((u: any) => u.role === "admin").length || 0, icon: Crown, color: "text-yellow-500", accent: "from-yellow-950/30 to-zinc-900" },
            { label: "Pending Invites", value: pendingInvitations.length, icon: Mail, color: pendingInvitations.length > 0 ? "text-amber-400" : "text-zinc-500", accent: pendingInvitations.length > 0 ? "from-amber-950/30 to-zinc-900" : "from-zinc-800 to-zinc-900" },
            { label: "Active", value: users?.length || 0, icon: UserCheck, color: "text-emerald-400", accent: "from-emerald-950/30 to-zinc-900" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl bg-gradient-to-br ${stat.accent} border border-zinc-800/60 p-4 hover:border-zinc-700/60 transition-all`}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">{stat.label}</span>
              </div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="px-8 pb-6">
        <div className="flex items-center gap-1 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-1.5 w-fit">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeSection === s.id
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
              {s.count !== null && s.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeSection === s.id ? "bg-yellow-600/20 text-yellow-500" : "bg-zinc-800 text-zinc-500"
                }`}>{s.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 pb-8">
        {/* ── TEAM MEMBERS ── */}
        {activeSection === "users" && (
          <div className="space-y-4">
            {/* Invite Bar */}
            <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-5">
              <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-3 flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5" /> Invite New Member
              </h3>
              <p className="text-xs text-zinc-600 mb-4">Only invited users can access the portal. They must sign in with the email specified below.</p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Input placeholder="Full Name" value={inviteFullName} onChange={(e) => setInviteFullName(e.target.value)} className="bg-zinc-800/60 border-zinc-700 text-white md:col-span-1 h-10" />
                <Input placeholder="Email Address" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="bg-zinc-800/60 border-zinc-700 text-white md:col-span-2 h-10" />
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "user" | "admin")}>
                  <SelectTrigger className="bg-zinc-800/60 border-zinc-700 text-white h-10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="user">Team Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={createInvitation.isPending} className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium h-10">
                  {createInvitation.isPending ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </div>

            {/* User List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-yellow-600" /></div>
            ) : (
              <div className="rounded-xl border border-zinc-800/60 overflow-hidden">
                <div className="bg-zinc-900/60 px-5 py-3 border-b border-zinc-800/40 grid grid-cols-12 gap-4 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
                  <div className="col-span-4">Member</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-1">Last Sign In</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                {users?.map((user: any) => (
                  <div key={user.id} className="px-5 py-3.5 border-b border-zinc-800/30 grid grid-cols-12 gap-4 items-center hover:bg-zinc-900/40 transition-colors">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white font-medium text-xs">
                        {user.name ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2) : "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name || "—"}</p>
                        {user.role === "admin" && <span className="text-[10px] text-yellow-500">Administrator</span>}
                      </div>
                    </div>
                    <div className="col-span-3 text-sm text-zinc-400 truncate">{user.email}</div>
                    <div className="col-span-2">
                      <Badge variant="outline" className={user.role === "admin" ? "bg-yellow-600/10 border-yellow-600/20 text-yellow-500 text-[10px]" : "bg-zinc-500/10 border-zinc-500/20 text-zinc-400 text-[10px]"}>
                        {user.role === "admin" && <Crown className="h-3 w-3 mr-1" />}
                        {user.role}
                      </Badge>
                    </div>
                    <div className="col-span-1 text-xs text-zinc-500">
                      {new Date(user.lastSignedIn).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <Select value={user.role} onValueChange={(newRole) => updateUserRole.mutate({ userId: user.id, role: newRole as "user" | "admin" })}>
                        <SelectTrigger className="w-28 h-7 bg-zinc-800/60 border-zinc-700 text-white text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="user">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <button onClick={() => { if (confirm(`Remove ${user.name || user.email}?`)) deleteUser.mutate({ userId: user.id }); }} className="h-7 w-7 rounded-md flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INVITATIONS ── */}
        {activeSection === "invitations" && (
          <div className="space-y-4">
            {pendingInvitations.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4"><Mail className="h-7 w-7 text-zinc-600" /></div>
                <p className="text-zinc-400 text-lg font-medium">No pending invitations</p>
                <p className="text-zinc-600 text-sm mt-1">All invitations have been accepted</p>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800/60 overflow-hidden">
                <div className="bg-zinc-900/60 px-5 py-3 border-b border-zinc-800/40 grid grid-cols-12 gap-4 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
                  <div className="col-span-4">Invitee</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Invited</div>
                  <div className="col-span-1 text-right">Revoke</div>
                </div>
                {pendingInvitations.map((inv: any) => (
                  <div key={inv.id} className="px-5 py-3.5 border-b border-zinc-800/30 grid grid-cols-12 gap-4 items-center hover:bg-zinc-900/40 transition-colors">
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-yellow-600/10 border border-yellow-600/20 flex items-center justify-center">
                        <Mail className="h-4 w-4 text-yellow-500" />
                      </div>
                      <p className="text-sm font-medium text-white">{inv.fullName}</p>
                    </div>
                    <div className="col-span-3 text-sm text-zinc-400">{inv.email}</div>
                    <div className="col-span-2">
                      <Badge variant="outline" className={inv.role === "admin" ? "bg-yellow-600/10 border-yellow-600/20 text-yellow-500 text-[10px]" : "bg-zinc-500/10 border-zinc-500/20 text-zinc-400 text-[10px]"}>
                        {inv.role}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-xs text-zinc-500">{new Date(inv.createdAt).toLocaleDateString()}</div>
                    <div className="col-span-1 flex justify-end">
                      <button onClick={() => deleteInvitation.mutate({ id: inv.id })} className="h-7 w-7 rounded-md flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FATHOM IMPORT ── */}
        {activeSection === "fathom" && (
          <div className="space-y-4 max-w-3xl">
            <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Download className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Import Meetings</h3>
                  <p className="text-xs text-zinc-500">Pull existing meetings from your Fathom account for AI analysis</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Select value={importLimit} onValueChange={setImportLimit}>
                  <SelectTrigger className="w-24 bg-zinc-800/60 border-zinc-700 text-white h-10"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => { setImportResult(null); importFathom.mutate({ limit: parseInt(importLimit) || 10 }); }} disabled={importFathom.isPending} className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium h-10">
                  {importFathom.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</> : <><Download className="h-4 w-4 mr-2" />Import from Fathom</>}
                </Button>
              </div>
              {importResult && (
                <div className="mt-4 p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/40 flex items-center gap-4 text-sm">
                  {importResult.imported > 0 && <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="h-4 w-4" />{importResult.imported} imported</span>}
                  {importResult.skipped > 0 && <span className="flex items-center gap-1 text-zinc-400"><AlertCircle className="h-4 w-4" />{importResult.skipped} already existed</span>}
                  {importResult.errors > 0 && <span className="flex items-center gap-1 text-red-400"><AlertCircle className="h-4 w-4" />{importResult.errors} errors</span>}
                </div>
              )}
            </div>

            <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Webhook className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Automatic Webhook</h3>
                  <p className="text-xs text-zinc-500">Register a webhook to automatically ingest new meetings</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm mb-4 p-3 rounded-lg bg-zinc-800/40 border border-zinc-700/40">
                <span className="text-zinc-500 text-xs">Endpoint:</span>
                <code className="text-yellow-500 text-xs font-mono">{window.location.origin}/api/webhook/fathom</code>
              </div>
              <Button onClick={() => registerWebhook.mutate({ webhookUrl: `${window.location.origin}/api/webhook/fathom` })} disabled={registerWebhook.isPending} variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white bg-transparent">
                {registerWebhook.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Registering...</> : <><Webhook className="h-4 w-4 mr-2" />Register Webhook</>}
              </Button>
              {registerWebhook.isSuccess && <p className="text-sm text-emerald-400 flex items-center gap-1 mt-3"><CheckCircle className="h-4 w-4" /> Webhook registered. New meetings will be automatically ingested.</p>}
            </div>
          </div>
        )}

        {/* ── ADMIN TOOLS ── */}
        {activeSection === "tools" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <Link href="/admin/activity-log">
              <div className="group rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-5 hover:border-yellow-600/30 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-yellow-500 transition-colors">Activity Log</h3>
                    <p className="text-xs text-zinc-500">View system activity and audit trail</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-700 group-hover:text-yellow-600 ml-auto" />
                </div>
              </div>
            </Link>
            <Link href="/admin/dedup">
              <div className="group rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-5 hover:border-yellow-600/30 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Search className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-yellow-500 transition-colors">Dedup Sweep</h3>
                    <p className="text-xs text-zinc-500">Find and merge duplicate records</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-700 group-hover:text-yellow-600 ml-auto" />
                </div>
              </div>
            </Link>
            <Link href="/setup?tab=integrations">
              <div className="group rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-5 hover:border-yellow-600/30 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Key className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-yellow-500 transition-colors">Integration Hub</h3>
                    <p className="text-xs text-zinc-500">Manage API keys and integrations</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-700 group-hover:text-yellow-600 ml-auto" />
                </div>
              </div>
            </Link>
            <Link href="/setup?tab=features">
              <div className="group rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-5 hover:border-yellow-600/30 transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-yellow-500 transition-colors">Feature Controls</h3>
                    <p className="text-xs text-zinc-500">Enable or disable platform features</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-zinc-700 group-hover:text-yellow-600 ml-auto" />
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
