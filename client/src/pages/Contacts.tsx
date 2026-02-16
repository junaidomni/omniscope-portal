import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Search, Building2, Mail, Phone, Calendar, ChevronRight
} from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";

function formatRelative(d: string | Date) {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function Contacts() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: contacts, isLoading } = trpc.contacts.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const filtered = useMemo(() => {
    if (!contacts) return [];
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter((c: any) =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.organization?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48 bg-zinc-800/50" />
          <Skeleton className="h-10 w-64 bg-zinc-800/50 rounded-lg" />
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-20 bg-zinc-800/50 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="h-6 w-6 text-yellow-600" />
            Contacts
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {contacts?.length || 0} contacts across all meetings
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-yellow-600/50"
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-zinc-700 mb-3" />
            <p className="text-zinc-400 text-sm">
              {searchQuery ? "No contacts match your search" : "No contacts found"}
            </p>
          </div>
        ) : (
          filtered.map((contact: any) => (
            <Link key={contact.id} href={`/contact/${contact.id}`}>
              <Card className="bg-zinc-900/50 border-zinc-800 hover:border-yellow-600/30 transition-all cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="h-11 w-11 rounded-lg bg-yellow-600/15 flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-600/25 transition-colors">
                      <span className="text-lg font-bold text-yellow-500">
                        {contact.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white group-hover:text-yellow-500 transition-colors truncate">
                          {contact.name}
                        </p>
                        {contact.organization && (
                          <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs hidden sm:inline-flex">
                            <Building2 className="h-3 w-3 mr-1" />
                            {contact.organization}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        {contact.email && (
                          <span className="flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            {contact.phone}
                          </span>
                        )}
                        {contact.title && (
                          <span className="hidden md:inline text-zinc-600">{contact.title}</span>
                        )}
                      </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {contact.createdAt && (
                        <span className="text-xs text-zinc-600 hidden sm:block">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatRelative(contact.createdAt)}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-yellow-600 transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
