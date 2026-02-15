import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SendRecapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: number;
  meetingTitle: string;
}

export function SendRecapDialog({ open, onOpenChange, meetingId, meetingTitle }: SendRecapDialogProps) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const generateRecapMutation = trpc.recap.generate.useMutation();

  const addRecipient = () => {
    const email = currentEmail.trim();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (recipients.includes(email)) {
      toast.error("Email already added");
      return;
    }

    setRecipients([...recipients, email]);
    setCurrentEmail("");
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email));
  };

  const handleSend = async () => {
    if (recipients.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    try {
      const recap = await generateRecapMutation.mutateAsync({ meetingId });
      
      // In a real implementation, you would send the email here
      // For now, we'll just download the recap and show success
      const blob = new Blob([recap.htmlBody], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meeting-recap-${meetingId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Meeting recap downloaded. Recipients: ${recipients.join(", ")}`);
      onOpenChange(false);
      
      // Reset form
      setRecipients([]);
      setCustomMessage("");
    } catch (error) {
      toast.error("Failed to generate meeting recap");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRecipient();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white">Send Meeting Recap</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Send a professionally branded meeting recap to external contacts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Meeting Info */}
          <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-800">
            <p className="text-sm font-medium text-white">{meetingTitle}</p>
            <p className="text-xs text-zinc-500 mt-1">Meeting ID: {meetingId}</p>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">Recipients</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={currentEmail}
                onChange={(e) => setCurrentEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              <Button
                type="button"
                onClick={addRecipient}
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Add
              </Button>
            </div>
            
            {/* Recipient Tags */}
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {recipients.map((email) => (
                  <Badge
                    key={email}
                    variant="outline"
                    className="border-yellow-600/30 bg-yellow-600/10 text-yellow-500 pr-1"
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    {email}
                    <button
                      onClick={() => removeRecipient(email)}
                      className="ml-2 hover:text-yellow-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-zinc-300">
              Custom Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal note to include with the recap..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[80px]"
            />
          </div>

          {/* Note */}
          <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
            <p className="text-xs text-zinc-400">
              <strong className="text-zinc-300">Note:</strong> The recap will include executive summary, 
              strategic highlights, opportunities, risks, action items, and key quotes with OmniScope branding.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={recipients.length === 0 || generateRecapMutation.isPending}
            className="bg-yellow-600 text-black hover:bg-yellow-500"
          >
            {generateRecapMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Recap
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
