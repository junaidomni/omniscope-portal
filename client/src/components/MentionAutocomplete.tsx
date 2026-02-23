import { useEffect, useState, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Calendar, Users, CheckSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface MentionAutocompleteProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (mention: MentionItem) => void;
  onClose: () => void;
}

export interface MentionItem {
  type: "user" | "meeting" | "contact" | "task";
  id: number;
  name: string;
  avatar?: string;
  subtitle?: string;
}

export function MentionAutocomplete({ query, position, onSelect, onClose }: MentionAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Search for users (team members)
  const { data: users } = trpc.users.list.useQuery(
    { search: query, limit: 5 },
    { enabled: query.length > 0 }
  );

  // Search for meetings
  const { data: meetings } = trpc.meetings.list.useQuery(
    { search: query, limit: 5 },
    { enabled: query.length > 0 }
  );

  // Search for contacts
  const { data: contacts } = trpc.contacts.list.useQuery(
    { search: query, limit: 5 },
    { enabled: query.length > 0 }
  );

  // Search for tasks
  const { data: tasks } = trpc.tasks.list.useQuery(
    { search: query, limit: 5 },
    { enabled: query.length > 0 }
  );

  // Combine all results
  const allResults: MentionItem[] = [
    ...(users?.map((u) => ({
      type: "user" as const,
      id: u.id,
      name: u.name || u.email,
      avatar: u.profilePhotoUrl || undefined,
      subtitle: u.email,
    })) || []),
    ...(meetings?.meetings.map((m) => ({
      type: "meeting" as const,
      id: m.id,
      name: m.title,
      subtitle: new Date(m.meetingDate).toLocaleDateString(),
    })) || []),
    ...(contacts?.map((c) => ({
      type: "contact" as const,
      id: c.id,
      name: c.name,
      subtitle: c.company || c.email || undefined,
    })) || []),
    ...(tasks?.tasks.map((t) => ({
      type: "task" as const,
      id: t.id,
      name: t.title,
      subtitle: t.status,
    })) || []),
  ];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (allResults[selectedIndex]) {
          onSelect(allResults[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, allResults, onSelect, onClose]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (allResults.length === 0) {
    return (
      <div
        className="absolute z-50 w-80 bg-popover border rounded-md shadow-lg"
        style={{ top: position.top, left: position.left }}
      >
        <div className="p-4 text-sm text-muted-foreground text-center">
          No results found for "{query}"
        </div>
      </div>
    );
  }

  const getIcon = (type: MentionItem["type"]) => {
    switch (type) {
      case "user":
        return <User className="h-4 w-4" />;
      case "meeting":
        return <Calendar className="h-4 w-4" />;
      case "contact":
        return <Users className="h-4 w-4" />;
      case "task":
        return <CheckSquare className="h-4 w-4" />;
    }
  };

  return (
    <div
      className="absolute z-50 w-80 bg-popover border rounded-md shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <ScrollArea className="max-h-64">
        <div ref={listRef} className="p-1">
          {allResults.map((item, index) => (
            <div
              key={`${item.type}-${item.id}`}
              data-index={index}
              onClick={() => onSelect(item)}
              className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-accent ${
                index === selectedIndex ? "bg-accent" : ""
              }`}
            >
              {item.type === "user" && item.avatar ? (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={item.avatar} />
                  <AvatarFallback>{item.name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  {getIcon(item.type)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{item.name}</div>
                {item.subtitle && (
                  <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                )}
              </div>
              <div className="text-xs text-muted-foreground capitalize">{item.type}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
