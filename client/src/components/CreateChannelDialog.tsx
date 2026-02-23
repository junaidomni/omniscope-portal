import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Users, Briefcase } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type ChannelType = "dm" | "group" | "deal_room";

interface CreateChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChannelCreated?: (channelId: number) => void;
}

export function CreateChannelDialog({ open, onOpenChange, onChannelCreated }: CreateChannelDialogProps) {
  const [step, setStep] = useState<"select" | "create">("select");
  const [selectedType, setSelectedType] = useState<ChannelType | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const utils = trpc.useUtils();
  const createDealRoom = trpc.communications.createDealRoom.useMutation({
    onSuccess: (data) => {
      toast.success("Deal room created successfully!");
      utils.communications.listChannels.invalidate();
      utils.communications.listDealRooms.invalidate();
      onChannelCreated?.(data.dealRoomId);
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create deal room");
    },
  });

  const handleClose = () => {
    setStep("select");
    setSelectedType(null);
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  const handleSelectType = (type: ChannelType) => {
    setSelectedType(type);
    setStep("create");
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    if (selectedType === "deal_room") {
      createDealRoom.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
        vertical: "general", // Default vertical
      });
    } else if (selectedType === "group") {
      // TODO: Implement group chat creation
      toast.info("Group chat creation coming soon!");
      handleClose();
    } else if (selectedType === "dm") {
      // TODO: Implement DM creation (need user selector)
      toast.info("Direct message creation coming soon!");
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === "select" ? (
          <>
            <DialogHeader>
              <DialogTitle>Create New Channel</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <button
                onClick={() => handleSelectType("dm")}
                className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-amber-500/50 hover:bg-accent/50 transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Direct Message</h3>
                  <p className="text-sm text-muted-foreground">
                    Start a private 1-on-1 conversation with someone
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleSelectType("group")}
                className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-amber-500/50 hover:bg-accent/50 transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Group Chat</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a multi-person group for team discussions
                  </p>
                </div>
              </button>

              <button
                onClick={() => handleSelectType("deal_room")}
                className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-amber-500/50 hover:bg-accent/50 transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                  <Briefcase className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Deal Room</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a secure space for external collaboration with sub-channels
                  </p>
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {selectedType === "dm" && "New Direct Message"}
                {selectedType === "group" && "New Group Chat"}
                {selectedType === "deal_room" && "New Deal Room"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  {selectedType === "deal_room" ? "Deal Room Name" : "Name"} *
                </Label>
                <Input
                  id="name"
                  placeholder={
                    selectedType === "deal_room"
                      ? "e.g., Dubai Gold Q1 2026"
                      : selectedType === "group"
                      ? "e.g., Marketing Team"
                      : "Select a person..."
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={selectedType === "dm"}
                />
              </div>

              {selectedType !== "dm" && (
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder={
                      selectedType === "deal_room"
                        ? "Describe the deal or transaction..."
                        : "Describe the purpose of this group..."
                    }
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {selectedType === "deal_room" && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    A #general channel will be automatically created inside this deal room.
                    You can add more channels later.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createDealRoom.isPending || (selectedType !== "dm" && !name.trim())}
              >
                {createDealRoom.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
