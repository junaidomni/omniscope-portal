import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  FilePlus, Search, Plus, FileText, MoreHorizontal, Clock,
  Loader2, X, Check, Edit3, Trash2, Copy, Send, Sparkles,
  FileSpreadsheet, Presentation, Eye, ChevronRight, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const DOC_TYPE_ICONS: Record<string, typeof FileText> = {
  google_doc: FileText,
  google_sheet: FileSpreadsheet,
  google_slide: Presentation,
};

const SUBCATEGORY_LABELS: Record<string, string> = {
  sppp: "SPPP", ncnda: "NCNDA", jva: "JVA", kyc: "KYC", kyb: "KYB",
  nda: "NDA", commission: "Commission Agreement", engagement: "Engagement Letter",
  intake: "Intake Form", proposal: "Proposal", invoice: "Invoice", other: "Other",
};

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const templates = trpc.templates.list.useQuery({ search: searchQuery || undefined });
  const deleteTemplate = trpc.templates.delete.useMutation({
    onSuccess: () => { toast.success("Template deleted"); templates.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-zinc-800/60">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Template Library</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Master templates for document generation</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-56 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-600"
              />
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium" size="sm">
              <Plus className="h-4 w-4 mr-1.5" /> Register Template
            </Button>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      <div className="flex-1 overflow-auto p-6">
        {templates.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 bg-zinc-900 rounded-xl" />)}
          </div>
        ) : !templates.data?.length ? (
          <div className="text-center py-20">
            <FilePlus className="h-14 w-14 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-400 mb-2">No Templates Yet</h3>
            <p className="text-zinc-600 text-sm max-w-md mx-auto mb-6">
              Register your Google Docs templates here. Add merge fields like {"{{client_name}}"} and OmniScope will auto-fill them when generating documents.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-yellow-600 hover:bg-yellow-700 text-black">
              <Plus className="h-4 w-4 mr-1.5" /> Register First Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.data.map((tmpl: any) => {
              const Icon = DOC_TYPE_ICONS[tmpl.sourceType] || FileText;
              return (
                <div key={tmpl.id} className="rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 transition-all group overflow-hidden">
                  {/* Template Header */}
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">{tmpl.name}</h3>
                          {tmpl.subcategory && (
                            <Badge variant="outline" className="text-[10px] mt-0.5 border-emerald-500/30 text-emerald-400">
                              {SUBCATEGORY_LABELS[tmpl.subcategory] || tmpl.subcategory.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                          <DropdownMenuItem onClick={() => { setSelectedTemplate(tmpl); setGenerateDialogOpen(true); }}>
                            <Send className="h-4 w-4 mr-2" /> Generate Document
                          </DropdownMenuItem>
                          {tmpl.googleFileId && (
                            <DropdownMenuItem onClick={() => window.open(`https://docs.google.com/document/d/${tmpl.googleFileId}/edit`, "_blank")}>
                              <Eye className="h-4 w-4 mr-2" /> Open in Google Docs
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteTemplate.mutate({ id: tmpl.id })} className="text-red-400">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Description */}
                  {tmpl.description && (
                    <div className="px-4 pb-3">
                      <p className="text-xs text-zinc-500 line-clamp-2">{tmpl.description}</p>
                    </div>
                  )}

                  {/* Merge Fields */}
                  {tmpl.mergeFields && tmpl.mergeFields.length > 0 && (
                    <div className="px-4 pb-3">
                      <div className="flex flex-wrap gap-1">
                        {tmpl.mergeFields.slice(0, 5).map((field: string) => (
                          <Badge key={field} variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                            {`{{${field}}}`}
                          </Badge>
                        ))}
                        {tmpl.mergeFields.length > 5 && (
                          <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-500">
                            +{tmpl.mergeFields.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-zinc-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                      <span className="flex items-center gap-1">
                        <Copy className="h-3 w-3" /> {tmpl.usageCount || 0} uses
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatDate(tmpl.updatedAt)}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => { setSelectedTemplate(tmpl); setGenerateDialogOpen(true); }}
                      className="bg-yellow-600/10 text-yellow-500 hover:bg-yellow-600/20 border-0 h-7 text-xs"
                    >
                      <Send className="h-3 w-3 mr-1" /> Generate
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Register Template Dialog */}
      <RegisterTemplateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={() => templates.refetch()}
      />

      {/* Generate Document Dialog */}
      {selectedTemplate && (
        <GenerateDocumentDialog
          open={generateDialogOpen}
          onClose={() => { setGenerateDialogOpen(false); setSelectedTemplate(null); }}
          template={selectedTemplate}
        />
      )}
    </div>
  );
}

// ─── Register Template Dialog ───
function RegisterTemplateDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subcategory, setSubcategory] = useState("other");
  const [googleFileId, setGoogleFileId] = useState("");
  const [mergeFieldsText, setMergeFieldsText] = useState("");

  const createTemplate = trpc.templates.create.useMutation({
    onSuccess: () => {
      toast.success("Template registered");
      onSuccess();
      reset();
    },
    onError: (err) => toast.error(err.message),
  });

  const reset = () => {
    setName(""); setDescription(""); setSubcategory("other");
    setGoogleFileId(""); setMergeFieldsText("");
    onClose();
  };

  const handleSubmit = () => {
    const mergeFields = mergeFieldsText
      .split(/[,\n]/)
      .map(f => f.trim().replace(/[{}]/g, ""))
      .filter(Boolean);

    createTemplate.mutate({
      name,
      description: description || undefined,
      sourceType: "google_doc",
      googleFileId: googleFileId || undefined,
      subcategory: subcategory !== "other" ? subcategory : undefined,
      mergeFields: mergeFields.length > 0 ? mergeFields : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && reset()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Register Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-zinc-400 text-xs">Template Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., OmniScope SPPP 80/20" className="bg-zinc-900 border-zinc-800 text-white mt-1" />
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this template for?" className="bg-zinc-900 border-zinc-800 text-white mt-1" rows={2} />
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Document Type</Label>
            <Select value={subcategory} onValueChange={setSubcategory}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUBCATEGORY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Google Doc ID (from URL)</Label>
            <Input
              value={googleFileId}
              onChange={(e) => setGoogleFileId(e.target.value)}
              placeholder="e.g., 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              className="bg-zinc-900 border-zinc-800 text-white mt-1 font-mono text-xs"
            />
            <p className="text-[10px] text-zinc-600 mt-1">Copy the ID from your Google Docs URL: docs.google.com/document/d/<span className="text-yellow-600">THIS_PART</span>/edit</p>
          </div>
          <div>
            <Label className="text-zinc-400 text-xs">Merge Fields (comma-separated)</Label>
            <Input
              value={mergeFieldsText}
              onChange={(e) => setMergeFieldsText(e.target.value)}
              placeholder="client_name, client_address, company_name, date"
              className="bg-zinc-900 border-zinc-800 text-white mt-1"
            />
            <p className="text-[10px] text-zinc-600 mt-1">These fields will be auto-filled from CRM data when generating documents</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={reset} className="border-zinc-700 text-zinc-400">Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || createTemplate.isPending} className="bg-yellow-600 hover:bg-yellow-700 text-black">
            {createTemplate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Check className="h-4 w-4 mr-1.5" />}
            Register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Generate Document Dialog ───
function GenerateDocumentDialog({ open, onClose, template }: { open: boolean; onClose: () => void; template: any }) {
  const [recipientSearch, setRecipientSearch] = useState("");
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [mergeValues, setMergeValues] = useState<Record<string, string>>({});
  const [step, setStep] = useState<"select" | "review">("select");

  const contacts = trpc.vault.listDocuments.useQuery(
    { search: recipientSearch, limit: 5 },
    { enabled: false }
  );

  const generateDoc = trpc.templates.generate.useMutation({
    onSuccess: () => {
      toast.success("Document generated and filed");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const mergeFields = template.mergeFields || [];

  const handleGenerate = () => {
    generateDoc.mutate({
      templateId: template.id,
      mergeData: mergeValues,
      recipientContactId: selectedContact?.id,
      recipientCompanyId: selectedCompany?.id,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Send className="h-5 w-5 text-yellow-500" />
            Generate from: {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Merge Fields */}
          {mergeFields.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Fill Merge Fields</h4>
              {mergeFields.map((field: string) => (
                <div key={field}>
                  <Label className="text-zinc-400 text-xs capitalize">{field.replace(/_/g, " ")}</Label>
                  <Input
                    value={mergeValues[field] || ""}
                    onChange={(e) => setMergeValues(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={`Enter ${field.replace(/_/g, " ")}`}
                    className="bg-zinc-900 border-zinc-800 text-white mt-1"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-lg p-4 text-center">
              <p className="text-sm text-zinc-400">No merge fields defined for this template</p>
              <p className="text-xs text-zinc-600 mt-1">The document will be generated as-is</p>
            </div>
          )}

          {/* Quick note */}
          <div className="bg-yellow-600/5 border border-yellow-600/20 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-500" />
              <span className="text-xs text-yellow-500">
                In the future, selecting a contact/company will auto-fill these fields from CRM data
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-400">Cancel</Button>
          <Button onClick={handleGenerate} disabled={generateDoc.isPending} className="bg-yellow-600 hover:bg-yellow-700 text-black">
            {generateDoc.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <FilePlus className="h-4 w-4 mr-1.5" />}
            Generate Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
