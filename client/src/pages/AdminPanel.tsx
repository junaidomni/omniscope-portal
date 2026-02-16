import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, UserPlus, Trash2, Crown, Zap, Download, Webhook, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminPanel() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [importLimit, setImportLimit] = useState("10");
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: number;
  } | null>(null);

  const { data: users, isLoading, refetch } = trpc.admin.getAllUsers.useQuery();
  
  const inviteUser = trpc.admin.inviteUser.useMutation({
    onSuccess: () => {
      toast.success("User invited successfully");
      setInviteEmail("");
      setInviteRole("user");
      setIsInviteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateUserRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User removed");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const importFathom = trpc.admin.importFathomMeetings.useMutation({
    onSuccess: (data) => {
      setImportResult(data);
      if (data.imported > 0) {
        toast.success(`Imported ${data.imported} meeting(s) from Fathom`);
      } else if (data.skipped > 0) {
        toast.info(`All ${data.skipped} meeting(s) already imported`);
      }
      if (data.errors > 0) {
        toast.error(`${data.errors} meeting(s) failed to import`);
      }
    },
    onError: (error) => {
      toast.error(`Fathom import failed: ${error.message}`);
    },
  });

  const registerWebhook = trpc.admin.registerFathomWebhook.useMutation({
    onSuccess: (data) => {
      toast.success("Fathom webhook registered successfully");
      console.log("Webhook registered:", data);
    },
    onError: (error) => {
      toast.error(`Webhook registration failed: ${error.message}`);
    },
  });

  const handleInvite = () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    inviteUser.mutate({ email: inviteEmail, role: inviteRole });
  };

  const handleImportFathom = () => {
    const limit = parseInt(importLimit) || 10;
    setImportResult(null);
    importFathom.mutate({ limit });
  };

  const handleRegisterWebhook = () => {
    // Use the current origin for the webhook URL
    const webhookUrl = `${window.location.origin}/api/webhook/fathom`;
    registerWebhook.mutate({ webhookUrl });
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-zinc-400">Manage users, integrations, and system settings</p>
          </div>
          
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-black">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-white">Invite New User</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Add a new user to the Intelligence Portal
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm text-zinc-300 mb-2 block">Email Address</label>
                  <Input
                    type="email"
                    placeholder="user@omniscopex.ae"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-300 mb-2 block">Role</label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "user" | "admin")}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="user" className="text-white">User - View meetings and tasks</SelectItem>
                      <SelectItem value="admin" className="text-white">Admin - Full access + user management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleInvite}
                  disabled={inviteUser.isPending}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black"
                >
                  {inviteUser.isPending ? "Inviting..." : "Send Invite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Fathom Integration Card */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Fathom Integration
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Import meetings from Fathom and configure automatic ingestion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Import Section */}
            <div className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-700/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Download className="h-4 w-4 text-yellow-600" />
                    Import Meetings
                  </h3>
                  <p className="text-zinc-400 text-sm mt-1">
                    Pull existing meetings from your Fathom account. Each meeting is analyzed by AI to extract intelligence data.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-zinc-400">Meetings to import:</label>
                  <Select value={importLimit} onValueChange={setImportLimit}>
                    <SelectTrigger className="w-24 h-9 bg-zinc-800 border-zinc-700 text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="5" className="text-white">5</SelectItem>
                      <SelectItem value="10" className="text-white">10</SelectItem>
                      <SelectItem value="20" className="text-white">20</SelectItem>
                      <SelectItem value="50" className="text-white">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleImportFathom}
                  disabled={importFathom.isPending}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black"
                >
                  {importFathom.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Import from Fathom
                    </>
                  )}
                </Button>
              </div>

              {/* Import Results */}
              {importResult && (
                <div className="mt-4 p-3 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
                  <div className="flex items-center gap-4 text-sm">
                    {importResult.imported > 0 && (
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        {importResult.imported} imported
                      </span>
                    )}
                    {importResult.skipped > 0 && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <AlertCircle className="h-4 w-4" />
                        {importResult.skipped} already existed
                      </span>
                    )}
                    {importResult.errors > 0 && (
                      <span className="flex items-center gap-1 text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        {importResult.errors} errors
                      </span>
                    )}
                  </div>
                </div>
              )}

              {importFathom.isPending && (
                <div className="mt-4 p-3 rounded-lg bg-zinc-900/50 border border-yellow-600/20">
                  <p className="text-sm text-yellow-600/80 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing meetings through AI analysis. This may take 30-60 seconds per meeting...
                  </p>
                </div>
              )}
            </div>

            {/* Webhook Section */}
            <div className="bg-zinc-800/50 rounded-lg p-5 border border-zinc-700/50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-yellow-600" />
                    Automatic Webhook
                  </h3>
                  <p className="text-zinc-400 text-sm mt-1">
                    Register a webhook with Fathom to automatically ingest new meetings as they happen.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-400">Webhook URL:</span>
                  <code className="bg-zinc-900 px-2 py-1 rounded text-yellow-600 text-xs font-mono">
                    {window.location.origin}/api/webhook/fathom
                  </code>
                </div>
                <Button
                  onClick={handleRegisterWebhook}
                  disabled={registerWebhook.isPending}
                  variant="outline"
                  className="border-yellow-600/30 text-yellow-600 hover:bg-yellow-600/10"
                >
                  {registerWebhook.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Webhook className="h-4 w-4 mr-2" />
                      Register Webhook with Fathom
                    </>
                  )}
                </Button>
                {registerWebhook.isSuccess && (
                  <p className="text-sm text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Webhook registered. New meetings will be automatically ingested.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Management Card */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-600" />
              User Management
            </CardTitle>
            <CardDescription className="text-zinc-400">
              {users?.length || 0} total users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Name</TableHead>
                  <TableHead className="text-zinc-400">Email</TableHead>
                  <TableHead className="text-zinc-400">Role</TableHead>
                  <TableHead className="text-zinc-400">Last Sign In</TableHead>
                  <TableHead className="text-zinc-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id} className="border-zinc-800">
                    <TableCell className="text-white font-medium">
                      {user.name || "—"}
                    </TableCell>
                    <TableCell className="text-zinc-300">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "admin" ? "default" : "outline"}
                        className={
                          user.role === "admin"
                            ? "bg-yellow-600 text-black hover:bg-yellow-700"
                            : "border-zinc-700 text-zinc-400"
                        }
                      >
                        {user.role === "admin" && <Crown className="h-3 w-3 mr-1" />}
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {new Date(user.lastSignedIn).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          value={user.role}
                          onValueChange={(newRole) =>
                            updateUserRole.mutate({ userId: user.id, role: newRole as "user" | "admin" })
                          }
                        >
                          <SelectTrigger className="w-32 h-8 bg-zinc-800 border-zinc-700 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="user" className="text-white text-xs">User</SelectItem>
                            <SelectItem value="admin" className="text-white text-xs">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Remove ${user.email} from the portal?`)) {
                              deleteUser.mutate({ userId: user.id });
                            }
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {users?.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No users yet. Invite your first user to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
