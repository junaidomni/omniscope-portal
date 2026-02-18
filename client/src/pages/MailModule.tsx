import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Mail, Inbox, Send, FileText, Star, Search, RefreshCw, Loader2,
  ChevronDown, ChevronRight, Paperclip, Reply, ReplyAll, Forward,
  Trash2, MailPlus, X, ArrowLeft, AlertCircle,
  StarOff, MoreHorizontal, Archive, PanelLeftClose, PanelLeft,
  Check, Clock, ChevronUp, Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ============================================================================
// TYPES
// ============================================================================

type Folder = "inbox" | "sent" | "drafts" | "starred" | "all";

interface ThreadListItem {
  threadId: string;
  subject: string;
  snippet: string;
  fromName: string;
  fromEmail: string;
  date: number;
  isUnread: boolean;
  isStarred: boolean;
  messageCount: number;
  hasAttachments: boolean;
  labelIds: string[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  from: string;
  fromName: string;
  fromEmail: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  bodyHtml: string;
  isUnread: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments: { filename: string; mimeType: string; size: number; attachmentId: string }[];
}

// ============================================================================
// HELPERS
// ============================================================================

function timeAgo(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(ts: string | number): string {
  const d = new Date(typeof ts === "string" ? parseInt(ts) : ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatFullDate(ts: string | number): string {
  const d = new Date(typeof ts === "string" ? parseInt(ts) : ts);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-amber-700", "bg-blue-700", "bg-emerald-700", "bg-violet-700",
    "bg-rose-700", "bg-cyan-700", "bg-orange-700", "bg-fuchsia-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// ============================================================================
// COMPOSE MODAL (Floating, Gmail-style)
// ============================================================================

function ComposeModal({
  open,
  onClose,
  replyTo,
  replyAll,
  forwardMsg,
}: {
  open: boolean;
  onClose: () => void;
  replyTo?: GmailMessage;
  replyAll?: boolean;
  forwardMsg?: GmailMessage;
}) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const sendMutation = trpc.mail.send.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!open) return;
    if (replyTo) {
      setTo(replyTo.fromEmail);
      if (replyAll) {
        const allRecipients = [...replyTo.to, ...replyTo.cc].filter(e => e !== replyTo.fromEmail);
        setCc(allRecipients.join(", "));
        setShowCc(allRecipients.length > 0);
      }
      setSubject(replyTo.subject.startsWith("Re:") ? replyTo.subject : `Re: ${replyTo.subject}`);
      setBody(`\n\n---\nOn ${formatDate(replyTo.internalDate)}, ${replyTo.fromName} wrote:\n> ${replyTo.body.split("\n").join("\n> ")}`);
    } else if (forwardMsg) {
      setSubject(forwardMsg.subject.startsWith("Fwd:") ? forwardMsg.subject : `Fwd: ${forwardMsg.subject}`);
      setBody(`\n\n--- Forwarded message ---\nFrom: ${forwardMsg.from}\nDate: ${formatDate(forwardMsg.internalDate)}\nSubject: ${forwardMsg.subject}\n\n${forwardMsg.body}`);
    } else {
      setTo("");
      setCc("");
      setSubject("");
      setBody("");
      setShowCc(false);
    }
    setMinimized(false);
  }, [replyTo, replyAll, forwardMsg, open]);

  // Auto-focus body on open
  useEffect(() => {
    if (open && !minimized && bodyRef.current) {
      setTimeout(() => bodyRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  const handleSend = async () => {
    if (!to.trim()) {
      toast.error("Please enter a recipient");
      return;
    }
    try {
      const toList = to.split(",").map(e => e.trim()).filter(Boolean);
      const ccList = cc ? cc.split(",").map(e => e.trim()).filter(Boolean) : undefined;
      await sendMutation.mutateAsync({
        to: toList,
        cc: ccList,
        subject,
        body,
        isHtml: false,
        threadId: replyTo?.threadId,
      });
      toast.success("Email sent");
      utils.mail.listThreads.invalidate();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to send email");
    }
  };

  if (!open) return null;

  const title = replyTo ? "Reply" : forwardMsg ? "Forward" : "New Message";

  // Minimized state — just the title bar
  if (minimized) {
    return (
      <div className="fixed bottom-0 right-8 w-72 z-50">
        <button
          onClick={() => setMinimized(false)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-800 border border-zinc-700 border-b-0 rounded-t-lg hover:bg-zinc-750 transition-colors"
        >
          <span className="text-sm font-medium text-white truncate">{title}</span>
          <div className="flex items-center gap-1">
            <ChevronUp className="h-4 w-4 text-zinc-400" />
            <X className="h-4 w-4 text-zinc-400 hover:text-white" onClick={(e) => { e.stopPropagation(); onClose(); }} />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-8 w-[560px] z-50 flex flex-col shadow-2xl shadow-black/50 rounded-t-xl border border-zinc-700/80 bg-zinc-900" style={{ maxHeight: "75vh" }}>
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-800 rounded-t-xl cursor-default select-none">
        <span className="text-sm font-medium text-white">{title}</span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setMinimized(true)} className="p-1 text-zinc-400 hover:text-white rounded transition-colors">
            <Minus className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="px-4 py-1 space-y-0 border-b border-zinc-800/80">
        <div className="flex items-center gap-3 py-2 border-b border-zinc-800/50">
          <span className="text-xs text-zinc-500 w-6 text-right">To</span>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Recipients"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
          />
          {!showCc && (
            <button onClick={() => setShowCc(true)} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Cc
            </button>
          )}
        </div>
        {showCc && (
          <div className="flex items-center gap-3 py-2 border-b border-zinc-800/50">
            <span className="text-xs text-zinc-500 w-6 text-right">Cc</span>
            <input
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="Cc recipients"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
            />
          </div>
        )}
        <div className="flex items-center gap-3 py-2">
          <span className="text-xs text-zinc-500 w-6 text-right">Sub</span>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <textarea
          ref={bodyRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          className="w-full min-h-[240px] px-4 py-3 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none resize-none"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-800/80">
        <div className="flex items-center gap-1">
          {/* Future: formatting, attachments */}
        </div>
        <Button
          onClick={handleSend}
          disabled={sendMutation.isPending || !to.trim()}
          size="sm"
          className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold text-sm px-5 h-8 rounded-md transition-colors"
        >
          {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// THREAD ROW — Clean, minimal, Superhuman-inspired
// ============================================================================

function ThreadRow({
  thread,
  isSelected,
  onClick,
}: {
  thread: ThreadListItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const toggleStarMut = trpc.mail.toggleStar.useMutation();
  const utils = trpc.useUtils();

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        group w-full text-left px-5 py-3 transition-all duration-150 relative
        ${isSelected
          ? "bg-zinc-800/80"
          : thread.isUnread
            ? "hover:bg-zinc-800/40"
            : "hover:bg-zinc-800/30"
        }
      `}
    >
      {/* Gold accent bar for selected */}
      {isSelected && (
        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-yellow-600 rounded-r" />
      )}

      <div className="flex items-center gap-3">
        {/* Unread dot */}
        <div className="w-2 flex-shrink-0 flex justify-center">
          {thread.isUnread && (
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
          )}
        </div>

        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full ${getAvatarColor(thread.fromName)} flex items-center justify-center flex-shrink-0`}>
          <span className="text-[11px] font-semibold text-white/90">{getInitials(thread.fromName || thread.fromEmail)}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] truncate ${thread.isUnread ? "font-semibold text-white" : "text-zinc-300"}`}>
              {thread.fromName || thread.fromEmail}
            </span>
            {thread.messageCount > 1 && (
              <span className="text-[11px] text-zinc-600">{thread.messageCount}</span>
            )}
            <div className="flex-1" />
            {/* Hover actions or time */}
            {hovered ? (
              <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        toggleStarMut.mutate(
                          { messageId: thread.threadId, starred: !thread.isStarred },
                          { onSuccess: () => utils.mail.listThreads.invalidate() }
                        );
                      }}
                      className="p-1 text-zinc-500 hover:text-yellow-500 rounded transition-colors"
                    >
                      <Star className={`h-3.5 w-3.5 ${thread.isStarred ? "fill-yellow-500 text-yellow-500" : ""}`} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">{thread.isStarred ? "Unstar" : "Star"}</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <span className="text-[11px] text-zinc-500 flex-shrink-0 tabular-nums">{timeAgo(thread.date)}</span>
            )}
          </div>
          <div className={`text-[13px] truncate mt-0.5 ${thread.isUnread ? "text-zinc-200" : "text-zinc-400"}`}>
            {thread.subject || "(No Subject)"}
          </div>
          <div className="text-[12px] text-zinc-600 truncate mt-0.5 flex items-center gap-1.5">
            {thread.hasAttachments && <Paperclip className="h-3 w-3 text-zinc-600 flex-shrink-0" />}
            <span className="truncate">{thread.snippet}</span>
          </div>
        </div>

        {/* Star indicator (when not hovered) */}
        {!hovered && thread.isStarred && (
          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
        )}
      </div>
    </button>
  );
}

// ============================================================================
// THREAD VIEW — Clean reading experience
// ============================================================================

function ThreadView({
  threadId,
  onBack,
  onReply,
  onReplyAll,
  onForward,
}: {
  threadId: string;
  onBack: () => void;
  onReply: (msg: GmailMessage) => void;
  onReplyAll: (msg: GmailMessage) => void;
  onForward: (msg: GmailMessage) => void;
}) {
  const { data, isLoading, error } = trpc.mail.getThread.useQuery({ threadId });
  const toggleStarMut = trpc.mail.toggleStar.useMutation();
  const trashMut = trpc.mail.trash.useMutation();
  const utils = trpc.useUtils();
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-expand last message, collapse others
  useEffect(() => {
    if (data?.messages && data.messages.length > 0) {
      const last = data.messages[data.messages.length - 1];
      setExpandedMessages(new Set([last.id]));
      // Scroll to bottom after render
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
    }
  }, [data?.messages]);

  const toggleExpand = (id: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTrash = async (messageId: string) => {
    try {
      await trashMut.mutateAsync({ messageId });
      toast.success("Moved to trash");
      utils.mail.listThreads.invalidate();
      onBack();
    } catch {
      toast.error("Failed to trash message");
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
          <span className="text-xs text-zinc-500">Loading thread...</span>
        </div>
      </div>
    );
  }

  if (error || !data?.messages?.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span className="text-sm">Failed to load thread</span>
      </div>
    );
  }

  const subject = data.messages[0]?.subject || "(No Subject)";
  const lastMsg = data.messages[data.messages.length - 1];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-black">
      {/* Thread Header — minimal */}
      <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center gap-4">
        <button onClick={onBack} className="text-zinc-500 hover:text-white transition-colors lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-medium text-white truncate">{subject}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-500">{data.messages.length} message{data.messages.length !== 1 ? "s" : ""}</span>
            {lastMsg.isStarred && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleTrash(lastMsg.id)}
                className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800/50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-2">
          {data.messages.map((msg, idx) => {
            const isExpanded = expandedMessages.has(msg.id);
            const isLast = idx === data.messages.length - 1;

            return (
              <div key={msg.id} className="group">
                {/* Collapsed message — just a line */}
                {!isExpanded && (
                  <button
                    onClick={() => toggleExpand(msg.id)}
                    className="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-full ${getAvatarColor(msg.fromName)} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-[10px] font-semibold text-white/90">{getInitials(msg.fromName || msg.fromEmail)}</span>
                    </div>
                    <span className="text-sm text-zinc-300 truncate flex-1">{msg.fromName || msg.fromEmail}</span>
                    <span className="text-[11px] text-zinc-600">{formatDate(msg.internalDate)}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                  </button>
                )}

                {/* Expanded message — full card */}
                {isExpanded && (
                  <div className={`rounded-xl border ${isLast ? "border-zinc-700/60 bg-zinc-900/50" : "border-zinc-800/50 bg-zinc-900/30"} overflow-hidden`}>
                    {/* Header */}
                    <button
                      onClick={() => !isLast && toggleExpand(msg.id)}
                      className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-zinc-800/20 transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-full ${getAvatarColor(msg.fromName)} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <span className="text-[11px] font-semibold text-white/90">{getInitials(msg.fromName || msg.fromEmail)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{msg.fromName || msg.fromEmail}</span>
                          <span className="text-[11px] text-zinc-600">&lt;{msg.fromEmail}&gt;</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">
                          To: {msg.to.join(", ")}
                          {msg.cc.length > 0 && <span className="ml-2">Cc: {msg.cc.join(", ")}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] text-zinc-500">{formatFullDate(msg.internalDate)}</span>
                        {!isLast && <ChevronDown className="h-3.5 w-3.5 text-zinc-600" />}
                      </div>
                    </button>

                    {/* Body */}
                    <div className="px-5 pb-5">
                      <div className="ml-12">
                        {msg.bodyHtml ? (
                          <div
                            className="text-sm text-zinc-200 leading-relaxed prose prose-invert prose-sm max-w-none
                              [&_a]:text-yellow-500 [&_a]:no-underline [&_a:hover]:underline
                              [&_img]:max-w-full [&_img]:rounded-lg
                              [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-700 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-400
                              [&_pre]:bg-zinc-800 [&_pre]:rounded-lg [&_pre]:p-3
                              [&_table]:border-collapse [&_td]:border [&_td]:border-zinc-700 [&_td]:px-3 [&_td]:py-1.5
                              [&_th]:border [&_th]:border-zinc-700 [&_th]:px-3 [&_th]:py-1.5 [&_th]:bg-zinc-800"
                            dangerouslySetInnerHTML={{ __html: msg.bodyHtml }}
                          />
                        ) : (
                          <pre className="text-sm text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">{msg.body}</pre>
                        )}

                        {/* Attachments */}
                        {msg.hasAttachments && msg.attachments.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {msg.attachments.map((att, i) => (
                              <div key={i} className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-xs">
                                <Paperclip className="h-3.5 w-3.5 text-zinc-500" />
                                <span className="text-zinc-300 truncate max-w-[200px]">{att.filename}</span>
                                <span className="text-zinc-600">{formatFileSize(att.size)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Quick reply actions */}
                        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-zinc-800/60">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onReply(msg); }}
                            className="text-xs h-8 border-zinc-700/60 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 rounded-lg transition-all"
                          >
                            <Reply className="h-3.5 w-3.5 mr-1.5" /> Reply
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onReplyAll(msg); }}
                            className="text-xs h-8 border-zinc-700/60 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 rounded-lg transition-all"
                          >
                            <ReplyAll className="h-3.5 w-3.5 mr-1.5" /> Reply All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onForward(msg); }}
                            className="text-xs h-8 border-zinc-700/60 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-600 rounded-lg transition-all"
                          >
                            <Forward className="h-3.5 w-3.5 mr-1.5" /> Forward
                          </Button>
                          <div className="flex-1" />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 text-zinc-600 hover:text-zinc-300 rounded transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-700 min-w-[140px]">
                              <DropdownMenuItem
                                onClick={() => {
                                  toggleStarMut.mutate({ messageId: msg.id, starred: !msg.isStarred }, {
                                    onSuccess: () => { utils.mail.getThread.invalidate({ threadId }); utils.mail.listThreads.invalidate(); },
                                  });
                                }}
                                className="text-zinc-300 hover:text-white text-xs"
                              >
                                {msg.isStarred ? <StarOff className="h-3.5 w-3.5 mr-2" /> : <Star className="h-3.5 w-3.5 mr-2" />}
                                {msg.isStarred ? "Unstar" : "Star"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-zinc-800" />
                              <DropdownMenuItem
                                onClick={() => handleTrash(msg.id)}
                                className="text-red-400 hover:text-red-300 text-xs"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONNECT GMAIL PROMPT
// ============================================================================

function ConnectGmailPrompt({ needsReauth }: { needsReauth?: boolean }) {
  const getAuthUrl = trpc.mail.getAuthUrl.useMutation();

  const handleConnect = async () => {
    try {
      const { url } = await getAuthUrl.mutateAsync({ origin: window.location.origin, returnPath: "/mail" });
      window.location.href = url;
    } catch {
      toast.error("Failed to get Google auth URL");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-black">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-6">
          <Mail className="h-7 w-7 text-yellow-600" />
        </div>
        <h2 className="text-lg font-medium text-white mb-2">
          {needsReauth ? "Gmail Permissions Required" : "Connect Gmail"}
        </h2>
        <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
          {needsReauth
            ? "Your Google account is connected, but Gmail read permissions are missing. Re-authenticate to grant full access."
            : "Connect your Gmail account to view, send, and manage emails directly from OmniScope."
          }
        </p>
        <Button
          onClick={handleConnect}
          disabled={getAuthUrl.isPending}
          className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold px-6 transition-colors"
        >
          {getAuthUrl.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
          {needsReauth ? "Re-authenticate" : "Connect Gmail"}
        </Button>
        {needsReauth && (
          <p className="text-[11px] text-zinc-600 mt-4">
            Ensure the redirect URI is registered in{" "}
            <a href="/setup?tab=integrations" className="text-yellow-600 hover:text-yellow-500">Setup → Integrations</a>.
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY STATE — Inbox Zero
// ============================================================================

function EmptyInbox({ folder }: { folder: Folder }) {
  const messages: Record<Folder, { icon: React.ElementType; title: string; sub: string }> = {
    inbox: { icon: Check, title: "You're all caught up", sub: "No new messages in your inbox" },
    sent: { icon: Send, title: "No sent messages", sub: "Messages you send will appear here" },
    drafts: { icon: FileText, title: "No drafts", sub: "Saved drafts will appear here" },
    starred: { icon: Star, title: "No starred messages", sub: "Star important messages to find them here" },
    all: { icon: Mail, title: "No messages", sub: "Your mailbox is empty" },
  };

  const msg = messages[folder];
  const Icon = msg.icon;

  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
          <Icon className="h-6 w-6 text-zinc-600" />
        </div>
        <p className="text-sm font-medium text-zinc-400">{msg.title}</p>
        <p className="text-xs text-zinc-600 mt-1">{msg.sub}</p>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN MAIL MODULE
// ============================================================================

export default function MailModule() {
  const [folder, setFolder] = useState<Folder>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<GmailMessage | undefined>();
  const [replyAll, setReplyAll] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<GmailMessage | undefined>();
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Check connection
  const connectionQuery = trpc.mail.connectionStatus.useQuery();
  const isConnected = connectionQuery.data?.connected;
  const hasGmailScopes = connectionQuery.data?.hasGmailScopes;

  // Unread count
  const unreadQuery = trpc.mail.getUnreadCount.useQuery(undefined, {
    enabled: !!isConnected && !!hasGmailScopes,
    refetchInterval: 60000,
  });

  // Thread list
  const threadsQuery = trpc.mail.listThreads.useQuery(
    { folder, search: searchQuery || undefined, maxResults: 30, pageToken },
    { enabled: !!isConnected && !!hasGmailScopes }
  );

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setSelectedThreadId(null);
    setPageToken(undefined);
  };

  const handleRefresh = () => {
    threadsQuery.refetch();
    unreadQuery.refetch();
  };

  const openCompose = () => {
    setReplyTo(undefined);
    setReplyAll(false);
    setForwardMsg(undefined);
    setComposeOpen(true);
  };

  const openReply = (msg: GmailMessage) => {
    setReplyTo(msg);
    setReplyAll(false);
    setForwardMsg(undefined);
    setComposeOpen(true);
  };

  const openReplyAll = (msg: GmailMessage) => {
    setReplyTo(msg);
    setReplyAll(true);
    setForwardMsg(undefined);
    setComposeOpen(true);
  };

  const openForward = (msg: GmailMessage) => {
    setReplyTo(undefined);
    setReplyAll(false);
    setForwardMsg(msg);
    setComposeOpen(true);
  };

  // Keyboard shortcut: Cmd/Ctrl+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // Escape to deselect
      if (e.key === "Escape" && selectedThreadId) {
        setSelectedThreadId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedThreadId]);

  // Loading state
  if (connectionQuery.isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <Loader2 className="h-6 w-6 animate-spin text-yellow-600" />
      </div>
    );
  }

  // Not connected or missing Gmail scopes
  if (!isConnected) return <ConnectGmailPrompt />;
  if (!hasGmailScopes) return <ConnectGmailPrompt needsReauth />;

  const folders: { id: Folder; icon: React.ElementType; label: string; count?: number }[] = [
    { id: "inbox", icon: Inbox, label: "Inbox", count: unreadQuery.data?.count },
    { id: "sent", icon: Send, label: "Sent" },
    { id: "drafts", icon: FileText, label: "Drafts" },
    { id: "starred", icon: Star, label: "Starred" },
    { id: "all", icon: Mail, label: "All Mail" },
  ];

  const activeFolder = folders.find(f => f.id === folder);

  return (
    <div className="h-[calc(100vh)] flex flex-col bg-black overflow-hidden">

      {/* ═══════════════════════════════════════════════════════════════════
          TOP COMMAND BAR — Full width, always visible
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="h-14 border-b border-zinc-800/80 flex items-center gap-3 px-4 bg-black flex-shrink-0">
        {/* Sidebar toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{sidebarOpen ? "Hide folders" : "Show folders"}</TooltipContent>
        </Tooltip>

        {/* Current folder label */}
        <div className="flex items-center gap-2">
          {activeFolder && <activeFolder.icon className="h-4 w-4 text-yellow-600" />}
          <span className="text-sm font-medium text-white">{activeFolder?.label || "Mail"}</span>
          {activeFolder?.count && activeFolder.count > 0 ? (
            <span className="text-[11px] bg-yellow-600/20 text-yellow-500 font-semibold px-1.5 py-0.5 rounded-md">
              {activeFolder.count > 99 ? "99+" : activeFolder.count}
            </span>
          ) : null}
        </div>

        {/* Search — centered, prominent */}
        <div className="flex-1 flex justify-center max-w-xl mx-auto">
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
            <input
              ref={searchRef}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search mail..."
              className={`w-full h-9 pl-9 pr-16 rounded-lg text-sm text-white placeholder:text-zinc-600 outline-none transition-all
                ${searchFocused
                  ? "bg-zinc-800 border border-zinc-600 ring-1 ring-yellow-600/20"
                  : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700"
                }
              `}
            />
            {!searchFocused && !searchInput && (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 font-mono">
                ⌘K
              </kbd>
            )}
            {searchInput && (
              <button
                type="button"
                onClick={() => { setSearchInput(""); setSearchQuery(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleRefresh}
                disabled={threadsQuery.isFetching}
                className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800/50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${threadsQuery.isFetching ? "animate-spin" : ""}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>Refresh</TooltipContent>
          </Tooltip>

          <Button
            onClick={openCompose}
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-500 text-black font-semibold h-8 px-4 text-xs rounded-lg transition-colors ml-1"
          >
            <MailPlus className="h-3.5 w-3.5 mr-1.5" /> Compose
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA — Sidebar + Thread List + Reading Pane
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* Folder Sidebar — collapsible */}
        {sidebarOpen && (
          <div className="w-48 border-r border-zinc-800/60 bg-zinc-950/50 flex-shrink-0 py-3 px-2">
            <nav className="space-y-0.5">
              {folders.map((f) => {
                const Icon = f.icon;
                const isActive = folder === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      setFolder(f.id);
                      setSelectedThreadId(null);
                      setPageToken(undefined);
                      setSearchQuery("");
                      setSearchInput("");
                    }}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all
                      ${isActive
                        ? "bg-zinc-800/80 text-white font-medium"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-yellow-600" : ""}`} />
                    <span className="flex-1 text-left">{f.label}</span>
                    {f.count && f.count > 0 ? (
                      <span className={`text-[11px] font-semibold tabular-nums ${isActive ? "text-yellow-500" : "text-zinc-600"}`}>
                        {f.count > 99 ? "99+" : f.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Thread List */}
        <div
          className={`
            ${selectedThreadId ? "hidden lg:flex" : "flex"} flex-col border-r border-zinc-800/60
            ${sidebarOpen ? "w-[360px] min-w-[360px]" : "w-[400px] min-w-[400px]"}
          `}
        >
          {/* Thread list content */}
          <div className="flex-1 overflow-y-auto">
            {threadsQuery.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
              </div>
            ) : threadsQuery.data?.error ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                <AlertCircle className="h-5 w-5 mb-2" />
                <span className="text-xs">{threadsQuery.data.error}</span>
              </div>
            ) : !threadsQuery.data?.threads?.length ? (
              <EmptyInbox folder={folder} />
            ) : (
              <>
                {threadsQuery.data.threads.map((thread) => (
                  <ThreadRow
                    key={thread.threadId}
                    thread={thread}
                    isSelected={selectedThreadId === thread.threadId}
                    onClick={() => setSelectedThreadId(thread.threadId)}
                  />
                ))}

                {/* Load More */}
                {threadsQuery.data.nextPageToken && (
                  <div className="p-4 flex justify-center">
                    <button
                      onClick={() => setPageToken(threadsQuery.data?.nextPageToken)}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-2 px-4 rounded-lg hover:bg-zinc-800/30"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Thread list footer — count */}
          {threadsQuery.data?.resultSizeEstimate && (
            <div className="px-4 py-2 border-t border-zinc-800/40 text-[11px] text-zinc-600 text-center">
              {threadsQuery.data.resultSizeEstimate} conversations
            </div>
          )}
        </div>

        {/* Reading Pane */}
        <div className={`flex-1 flex flex-col ${!selectedThreadId ? "hidden lg:flex" : "flex"}`}>
          {selectedThreadId ? (
            <ThreadView
              threadId={selectedThreadId}
              onBack={() => setSelectedThreadId(null)}
              onReply={openReply}
              onReplyAll={openReplyAll}
              onForward={openForward}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 text-zinc-700" />
                </div>
                <p className="text-sm text-zinc-500">Select a conversation</p>
                <p className="text-[11px] text-zinc-700 mt-1">
                  {threadsQuery.data?.resultSizeEstimate
                    ? `${threadsQuery.data.resultSizeEstimate} conversations in ${activeFolder?.label || folder}`
                    : `Viewing ${activeFolder?.label || folder}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        replyTo={replyTo}
        replyAll={replyAll}
        forwardMsg={forwardMsg}
      />
    </div>
  );
}
