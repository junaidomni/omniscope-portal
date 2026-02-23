import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AddSubChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealRoomId: number;
  dealRoomName: string;
  onChannelCreated?: (channelId: number) => void;
}

export function AddSubChannelDialog({
  open,
  onOpenChange,
  dealRoomId,
  dealRoomName,
  onChannelCreated,
}: AddSubChannelDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const utils = trpc.useUtils();
  const createSubChannel = trpc.communications.createSubChannel.useMutation({
    onSuccess: (data) => {
      toast.success("Channel created successfully!");
      utils.communications.listChannels.invalidate();
      utils.communications.getDealRoomChannels.invalidate({ dealRoomId });
      onChannelCreated?.(data.channelId);
      handleClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create channel");
    },
  });

  const handleClose = () => {
    setName("");
    setDescription("");
    onOpenChange(false);
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Please enter a channel name");
      return;
    }

    createSubChannel.mutate({
      parentChannelId: dealRoomId,
      name: name.trim().toLowerCase().replace(/\s+/g, "-"),
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Add Channel to {dealRoomName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Channel Name *</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">#</span>
              <Input
                id="name"
                placeholder="e.g., documents, legal, finance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Channel names will be lowercase with hyphens
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe the purpose of this channel..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              All members of this deal room will automatically have access to the new channel.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createSubChannel.isPending || !name.trim()}
          >
            {createSubChannel.isPending ? "Creating..." : "Create Channel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
