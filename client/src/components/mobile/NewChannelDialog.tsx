import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Hash } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface NewChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewChannelDialog({ open, onOpenChange }: NewChannelDialogProps) {
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [, setLocation] = useLocation();

  // Create channel mutation
  const createChannel = trpc.communications.createChannel.useMutation({
    onSuccess: (data) => {
      toast.success("Channel created");
      onOpenChange(false);
      setChannelName("");
      setDescription("");
      setLocation(`/mobile/chat/${data.channelId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create channel");
    },
  });

  const handleCreate = () => {
    if (!channelName.trim()) {
      toast.error("Channel name is required");
      return;
    }

    createChannel.mutate({
      type: "announcement",
      name: channelName,
      description: description || undefined,
      memberIds: [], // Public channel, no initial members
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 flex-none">
          <DialogTitle>New Channel</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-4">
          {/* Channel Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Channel Name *</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="general"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Channels are public and anyone in your organization can join
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="What's this channel about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

        </div>
        
        {/* Create Button - Fixed at bottom */}
        <div className="px-6 pb-6 pt-4 flex-none border-t">
          <Button
            onClick={handleCreate}
            disabled={createChannel.isPending || !channelName.trim()}
            className="w-full"
          >
            {createChannel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Channel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
