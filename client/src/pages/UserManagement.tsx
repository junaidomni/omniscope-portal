import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  UserPlus, Mail, Shield, User, Trash2, Clock, Check, X, Search, Users
} from "lucide-react";

const PREDEFINED_CATEGORIES = [
  "Little Miracles", "Gold", "BTC", "Private Placement", "Real Estate",
  "Stablecoin", "Oil & Energy", "Payment Rails", "Commodities"
];

export default function UserManagement() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<"user" | "admin">("user");
  const [searchQuery, setSearchQuery] = useState("");

  const utils = trpc.useUtils();
  const { data: allUsers = [], isLoading: usersLoading } = trpc.admin.getAllUsers.useQuery();
  const { data: invitationsList = [], isLoading: invitationsLoading } = trpc.admin.listInvitations.useQuery();

  const inviteUserMutation = trpc.admin.createInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      setInviteEmail("");
      setInviteFullName("");
      setInviteRole("user");
      utils.admin.listInvitations.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteInvitationMutation = trpc.admin.deleteInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitation revoked");
      utils.admin.listInvitations.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated");
      utils.admin.getAllUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User removed");
      utils.admin.getAllUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleInvite = () => {
    if (!inviteEmail || !inviteFullName) {
      toast.error("Please fill in both name and email");
      return;
    }
    inviteUserMutation.mutate({
      email: inviteEmail.toLowerCase().trim(),
      fullName: inviteFullName.trim(),
      role: inviteRole,
    });
  };

  const filteredUsers = allUsers.filter(u =>
    !searchQuery ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingInvitations = invitationsList.filter(inv => !inv.acceptedAt);
  const acceptedInvitations = invitationsList.filter(inv => inv.acceptedAt);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Users className="h-6 w-6 text-yellow-600" />
          User Management
        </h1>
        <p className="text-zinc-400 mt-1">Manage portal access and team invitations</p>
      </div>

      {/* Invite New User */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-yellow-600" />
          Invite New User
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Full Name"
            value={inviteFullName}
            onChange={(e) => setInviteFullName(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <Input
            placeholder="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "user" | "admin")}
            className="bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 py-2 text-sm"
          >
            <option value="user">Team Member</option>
            <option value="admin">Admin</option>
          </select>
          <Button
            onClick={handleInvite}
            disabled={inviteUserMutation.isPending}
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
          >
            {inviteUserMutation.isPending ? "Sending..." : "Send Invite"}
          </Button>
        </div>
        <p className="text-zinc-500 text-xs mt-3">
          Only invited users can access the portal. They must sign in with the email address specified above.
        </p>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Pending Invitations ({pendingInvitations.length})
          </h2>
          <div className="space-y-3">
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-yellow-600/20 border border-yellow-600/30 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{inv.fullName}</p>
                    <p className="text-zinc-400 text-sm">{inv.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    inv.role === 'admin' 
                      ? 'bg-yellow-600/20 text-yellow-500 border border-yellow-600/30' 
                      : 'bg-zinc-700 text-zinc-300'
                  }`}>
                    {inv.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs">
                    Invited {new Date(inv.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteInvitationMutation.mutate({ id: inv.id })}
                    className="border-red-800/50 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Users */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-600" />
            Active Users ({filteredUsers.length})
          </h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white pl-9"
            />
          </div>
        </div>

        {usersLoading ? (
          <div className="text-center py-8 text-zinc-500">Loading users...</div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-3">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                    user.role === 'admin' 
                      ? 'bg-yellow-600 text-black' 
                      : 'bg-zinc-700 text-white'
                  }`}>
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.name || "Unnamed"}</p>
                    <p className="text-zinc-400 text-sm">{user.email || "No email"}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.role === 'admin' 
                      ? 'bg-yellow-600/20 text-yellow-500 border border-yellow-600/30' 
                      : 'bg-zinc-700 text-zinc-300'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'Member'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-xs">
                    Last seen {new Date(user.lastSignedIn).toLocaleDateString()}
                  </span>
                  <select
                    value={user.role}
                    onChange={(e) => updateRoleMutation.mutate({ userId: user.id, role: e.target.value as "user" | "admin" })}
                    className="bg-zinc-800 border border-zinc-700 text-white rounded-md px-2 py-1 text-xs"
                  >
                    <option value="user">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Remove ${user.name || user.email}? They will need a new invitation to access the portal.`)) {
                        deleteUserMutation.mutate({ userId: user.id });
                      }
                    }}
                    className="border-red-800/50 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
