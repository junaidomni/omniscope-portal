import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Search, User, Check, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface NewGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewGroupDialog({ open, onOpenChange }: NewGroupDialogProps) {
  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [, setLocation] = useLocation();

  // Load contacts
  const { data: contacts, isLoading } = trpc.contacts.list.useQuery(
    { search, limit: 50 },
    { enabled: open }
  );

  // Create group mutation
  const createGroup = trpc.communications.createGroupChat.useMutation({
    onSuccess: (data) => {
      toast.success("Group created");
      onOpenChange(false);
      setGroupName("");
      setDescription("");
      setSelectedIds(new Set());
      setLocation(`/mobile/chat/${data.channelId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create group");
    },
  });

  const toggleContact = (contactId: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedIds(newSelected);
  };

  const handleCreate = () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (selectedIds.size === 0) {
      toast.error("Select at least one member");
      return;
    }

    createGroup.mutate({
      name: groupName,
      description: description || undefined,
      memberIds: Array.from(selectedIds),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>New Group Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Group Name */}
          <Input
            placeholder="Group name *"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          {/* Description */}
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />

          {/* Search Contacts */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected Count */}
          {selectedIds.size > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedIds.size} member{selectedIds.size !== 1 ? "s" : ""} selected
            </div>
          )}

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && contacts && contacts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No contacts found
              </div>
            )}

            {contacts?.map((contact: any) => {
              const isSelected = selectedIds.has(contact.id);
              return (
                <button
                  key={contact.id}
                  onClick={() => toggleContact(contact.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                    isSelected ? "bg-primary/10" : "hover:bg-accent"
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {isSelected ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{contact.name}</div>
                    {contact.email && (
                      <div className="text-sm text-muted-foreground truncate">
                        {contact.email}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={createGroup.isPending || !groupName.trim() || selectedIds.size === 0}
            className="w-full"
          >
            {createGroup.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
