import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Edit2, Trash2, Tag as TagIcon } from "lucide-react";
import { toast } from "sonner";

interface Tag {
  name: string;
  color: string;
  count: number;
}

const PRESET_COLORS = [
  "#ef4444", // red
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

interface TagManagementProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagManagement({ selectedTags, onTagsChange }: TagManagementProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const { data: contacts } = trpc.contacts.list.useQuery();
  const utils = trpc.useUtils();

  // Extract all tags from contacts
  const allTags = useMemo(() => {
    if (!contacts) return [];
    
    const tagMap = new Map<string, { color: string; count: number }>();
    
    contacts.forEach((contact) => {
      if (contact.tags) {
        try {
          const tags = JSON.parse(contact.tags);
          if (Array.isArray(tags)) {
            tags.forEach((tag: any) => {
              const tagName = typeof tag === "string" ? tag : tag.name;
              const tagColor = typeof tag === "string" ? PRESET_COLORS[0] : (tag.color || PRESET_COLORS[0]);
              
              if (tagMap.has(tagName)) {
                const existing = tagMap.get(tagName)!;
                tagMap.set(tagName, { color: tagColor, count: existing.count + 1 });
              } else {
                tagMap.set(tagName, { color: tagColor, count: 1 });
              }
            });
          }
        } catch (e) {
          // Invalid JSON, skip
        }
      }
    });

    return Array.from(tagMap.entries())
      .map(([name, data]) => ({ name, color: data.color, count: data.count }))
      .sort((a, b) => b.count - a.count);
  }, [contacts]);

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast.error("Tag name cannot be empty");
      return;
    }

    if (allTags.some(t => t.name.toLowerCase() === newTagName.toLowerCase())) {
      toast.error("Tag already exists");
      return;
    }

    // Add to selected tags
    onTagsChange([...selectedTags, newTagName]);
    
    setNewTagName("");
    setNewTagColor(PRESET_COLORS[0]);
    setIsCreateOpen(false);
    toast.success("Tag created");
  };

  const handleEditTag = () => {
    if (!editingTag || !newTagName.trim()) {
      toast.error("Tag name cannot be empty");
      return;
    }

    // Update tag in all contacts (would need backend support)
    toast.info("Tag editing requires backend implementation");
    setIsEditOpen(false);
    setEditingTag(null);
  };

  const handleDeleteTag = (tagName: string) => {
    if (!confirm(`Delete tag "${tagName}"? This will remove it from all contacts.`)) {
      return;
    }

    // Remove from selected tags
    onTagsChange(selectedTags.filter(t => t !== tagName));
    
    toast.success("Tag deleted");
  };

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter(t => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TagIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Tags</h3>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="tag-name">Tag Name</Label>
                <Input
                  id="tag-name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g., VIP Client"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateTag();
                    }
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        newTagColor === color ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTag}>Create</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tag List */}
      <div className="flex flex-wrap gap-2">
        {allTags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags yet. Create your first tag to organize contacts.</p>
        ) : (
          allTags.map((tag) => (
            <div
              key={tag.name}
              className="group relative"
            >
              <Badge
                variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                className="cursor-pointer pr-8 transition-all"
                style={{
                  backgroundColor: selectedTags.includes(tag.name) ? tag.color : "transparent",
                  borderColor: tag.color,
                  color: selectedTags.includes(tag.name) ? "white" : tag.color,
                }}
                onClick={() => toggleTag(tag.name)}
              >
                {tag.name}
                <span className="ml-1 text-xs opacity-70">({tag.count})</span>
              </Badge>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTag(tag.name);
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Selected Tags Summary */}
      {selectedTags.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            Filtering by {selectedTags.length} tag{selectedTags.length > 1 ? "s" : ""}:
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tagName) => {
              const tag = allTags.find(t => t.name === tagName);
              return (
                <Badge
                  key={tagName}
                  style={{
                    backgroundColor: tag?.color || PRESET_COLORS[0],
                    color: "white",
                  }}
                >
                  {tagName}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
