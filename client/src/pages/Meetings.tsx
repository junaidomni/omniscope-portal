import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Search, 
  Filter, 
  Calendar,
  Users,
  Building2,
  MapPin,
  Briefcase,
  Loader2,
  X
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Meetings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  // Fetch all meetings with filters
  const { data: meetings, isLoading } = trpc.meetings.list.useQuery({
    limit: 100,
  });

  // Fetch tags for filter options
  const { data: sectorTags } = trpc.tags.list.useQuery({ type: "sector" });
  const { data: jurisdictionTags } = trpc.tags.list.useQuery({ type: "jurisdiction" });

  // Filter meetings by search term and date range
  const filteredMeetings = meetings?.filter((meeting) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        meeting.primaryLead?.toLowerCase().includes(searchLower) ||
        meeting.executiveSummary?.toLowerCase().includes(searchLower) ||
        meeting.participants?.toLowerCase().includes(searchLower) ||
        meeting.organizations?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Date range filter
    if (dateRange !== "all") {
      const meetingDate = new Date(meeting.meetingDate);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - meetingDate.getTime()) / (1000 * 60 * 60 * 24));

      switch (dateRange) {
        case "today":
          if (daysDiff > 0) return false;
          break;
        case "week":
          if (daysDiff > 7) return false;
          break;
        case "month":
          if (daysDiff > 30) return false;
          break;
        case "quarter":
          if (daysDiff > 90) return false;
          break;
      }
    }

    return true;
  }) || [];

  const activeFiltersCount = 
    (selectedSector !== "all" ? 1 : 0) +
    (selectedJurisdiction !== "all" ? 1 : 0) +
    (dateRange !== "all" ? 1 : 0);

  const clearFilters = () => {
    setSelectedSector("all");
    setSelectedJurisdiction("all");
    setDateRange("all");
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container max-w-7xl py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Meetings</h1>
          <p className="text-zinc-400">All intelligence reports from your calls and meetings</p>
        </div>

        {/* Filters */}
        <Card className="bg-zinc-900 border-zinc-800 p-6 mb-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <Input
                placeholder="Search by participant, organization, or summary..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date Range */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <Calendar className="h-4 w-4 mr-2 text-zinc-400" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="quarter">Past Quarter</SelectItem>
                </SelectContent>
              </Select>

              {/* Sector Filter */}
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <Briefcase className="h-4 w-4 mr-2 text-zinc-400" />
                  <SelectValue placeholder="All Sectors" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Sectors</SelectItem>
                  {sectorTags?.map((tag) => (
                    <SelectItem key={tag.id} value={tag.name}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Jurisdiction Filter */}
              <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <MapPin className="h-4 w-4 mr-2 text-zinc-400" />
                  <SelectValue placeholder="All Jurisdictions" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">All Jurisdictions</SelectItem>
                  {jurisdictionTags?.map((tag) => (
                    <SelectItem key={tag.id} value={tag.name}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear ({activeFiltersCount})
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-zinc-400 text-sm">
            {isLoading ? (
              "Loading meetings..."
            ) : (
              `${filteredMeetings.length} meeting${filteredMeetings.length !== 1 ? "s" : ""} found`
            )}
          </p>
        </div>

        {/* Meetings List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
          </div>
        ) : filteredMeetings.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800 p-12 text-center">
            <Filter className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No meetings found</h3>
            <p className="text-zinc-400 mb-4">
              {searchTerm || activeFiltersCount > 0
                ? "Try adjusting your filters or search term"
                : "No meetings have been added yet"}
            </p>
            {(searchTerm || activeFiltersCount > 0) && (
              <Button onClick={clearFilters} variant="outline" className="border-zinc-700">
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMeetings.map((meeting) => {
              const participants = meeting.participants ? JSON.parse(meeting.participants) : [];
              const organizations = meeting.organizations ? JSON.parse(meeting.organizations) : [];
              const jurisdictions = meeting.jurisdictions ? JSON.parse(meeting.jurisdictions) : [];
              // Extract sectors from tags if available
              const sectors: string[] = [];

              return (
                <Link key={meeting.id} href={`/meeting/${meeting.id}`}>
                  <Card className="bg-zinc-900 border-zinc-800 p-6 hover:border-yellow-600 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white group-hover:text-yellow-600 transition-colors">
                            {meeting.primaryLead}
                            {participants.length > 1 && (
                              <span className="text-zinc-500 font-normal">
                                {" "}+ {participants.length - 1} other{participants.length > 2 ? "s" : ""}
                              </span>
                            )}
                          </h3>
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                            {meeting.sourceType}
                          </Badge>
                        </div>
                        <p className="text-zinc-400 text-sm line-clamp-2 mb-3">
                          {meeting.executiveSummary}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-zinc-500">
                          {new Date(meeting.meetingDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-zinc-600">
                          {new Date(meeting.meetingDate).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {organizations.length > 0 && (
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Building2 className="h-4 w-4" />
                          <span>{organizations.join(", ")}</span>
                        </div>
                      )}
                      {participants.length > 0 && (
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Users className="h-4 w-4" />
                          <span>{participants.length} participant{participants.length !== 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {(sectors.length > 0 || jurisdictions.length > 0) && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {sectors.map((sector: string, idx: number) => (
                          <Badge key={`sector-${idx}`} className="bg-yellow-600/10 text-yellow-600 border-yellow-600/20">
                            {sector}
                          </Badge>
                        ))}
                        {jurisdictions.map((jurisdiction: string, idx: number) => (
                          <Badge key={`jurisdiction-${idx}`} variant="outline" className="border-zinc-700 text-zinc-400">
                            {jurisdiction}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
