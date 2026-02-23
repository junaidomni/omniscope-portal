import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Calendar as CalendarIcon, User, Hash, Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface MessageSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessageClick: (channelId: number, messageId: number) => void;
}

export function MessageSearch({ open, onOpenChange, onMessageClick }: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSenderId, setSelectedSenderId] = useState<number | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Fetch users for sender filter
  const { data: users } = trpc.users.list.useQuery(undefined, { enabled: open });

  // Fetch channels for channel filter
  const { data: channels } = trpc.communications.listChannels.useQuery(undefined, { enabled: open });

  // Search messages
  const { data: searchResults, isLoading } = trpc.communications.searchMessages.useQuery(
    {
      query: searchQuery,
      senderId: selectedSenderId || undefined,
      channelId: selectedChannelId || undefined,
      startDate: dateRange.from?.toISOString(),
      endDate: dateRange.to?.toISOString(),
    },
    { enabled: open && searchQuery.length > 0 }
  );

  const clearFilters = () => {
    setSelectedSenderId(null);
    setSelectedChannelId(null);
    setDateRange({});
  };

  const hasFilters = selectedSenderId || selectedChannelId || dateRange.from || dateRange.to;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {/* Sender Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <User className="h-3 w-3 mr-2" />
                  {selectedSenderId
                    ? users?.find((u) => u.id === selectedSenderId)?.name || "Sender"
                    : "Sender"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2">
                <ScrollArea className="h-[200px]">
                  {users?.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedSenderId(user.id)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent",
                        selectedSenderId === user.id && "bg-accent"
                      )}
                    >
                      {user.name || user.email}
                    </button>
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Channel Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Hash className="h-3 w-3 mr-2" />
                  {selectedChannelId
                    ? channels?.find((c) => c.id === selectedChannelId)?.name || "Channel"
                    : "Channel"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-2">
                <ScrollArea className="h-[200px]">
                  {channels?.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannelId(channel.id)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded text-sm hover:bg-accent",
                        selectedChannelId === channel.id && "bg-accent"
                      )}
                    >
                      {channel.name}
                    </button>
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Date Range Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <CalendarIcon className="h-3 w-3 mr-2" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                      </>
                    ) : (
                      format(dateRange.from, "MMM d, yyyy")
                    )
                  ) : (
                    "Date Range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => setDateRange(range || {})}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-8" onClick={clearFilters}>
                <X className="h-3 w-3 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Results */}
          <ScrollArea className="h-[400px] border rounded-lg">
            {!searchQuery ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Type to search messages across all channels
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !searchResults || searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Search className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No messages found</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      onMessageClick(result.channelId, result.id);
                      onOpenChange(false);
                    }}
                    className="w-full p-3 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={result.user.profilePhotoUrl || undefined} />
                        <AvatarFallback>
                          {result.user.name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{result.user.name}</span>
                          <Badge variant="outline" className="text-xs">
                            #{result.channelName}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatDistanceToNow(new Date(result.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {result.content}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
