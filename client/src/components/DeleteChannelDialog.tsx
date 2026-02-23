import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface DeleteChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: number;
  channelName: string;
  onDeleted: () => void;
}

export function DeleteChannelDialog({
  open,
  onOpenChange,
  channelId,
  channelName,
  onDeleted,
}: DeleteChannelDialogProps) {
  const utils = trpc.useUtils();

  const deleteChannelMutation = trpc.communications.deleteChannel.useMutation({
    onSuccess: () => {
      toast.success("Channel deleted successfully");
      utils.communications.listChannels.invalidate();
      utils.communications.listDealRooms.invalidate();
      onOpenChange(false);
      onDeleted();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete channel");
    },
  });

  const handleDelete = () => {
    deleteChannelMutation.mutate({ channelId });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Channel</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{channelName}</strong>?
            <br />
            <br />
            This will permanently delete:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>All messages in this channel</li>
              <li>All sub-channels and their messages</li>
              <li>All member associations</li>
            </ul>
            <br />
            <strong className="text-destructive">This action cannot be undone.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteChannelMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteChannelMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteChannelMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Channel"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
