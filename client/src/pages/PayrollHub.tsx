import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, DollarSign, Search, Clock, CheckCircle2,
  AlertCircle, XCircle, Loader2, Upload, FileText, Download, Trash2,
  Wallet, TrendingUp, ArrowUpRight, CreditCard, Receipt, MoreHorizontal,
  ChevronDown, ChevronUp, Eye, Calendar
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; icon: any }> = {
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400", icon: Clock },
  paid: { label: "Paid", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400", icon: CheckCircle2 },
  overdue: { label: "Overdue", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", dot: "bg-red-400", icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20", dot: "bg-zinc-400", icon: XCircle },
};

export default function PayrollHub() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: records = [], isLoading, refetch } = trpc.payroll.list.useQuery(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );

  const updateMutation = trpc.payroll.update.useMutation({
    onSuccess: () => { toast.success("Updated"); refetch(); },
  });
  const deleteMutation = trpc.payroll.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); refetch(); },
  });
  const uploadReceiptMutation = trpc.payroll.uploadReceipt.useMutation({
    onSuccess: () => { toast.success("Receipt uploaded"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });
  const uploadInvoiceMutation = trpc.payroll.uploadInvoice.useMutation({
    onSuccess: () => { toast.success("Invoice uploaded"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = useMemo(() => {
    if (!search) return records;
    const q = search.toLowerCase();
    return records.filter((r: any) => r.employeeName?.toLowerCase().includes(q) || r.notes?.toLowerCase().includes(q));
  }, [records, search]);

  const stats = useMemo(() => {
    const pending = records.filter((r: any) => r.status === "pending");
    const paid = records.filter((r: any) => r.status === "paid");
    const overdue = records.filter((r: any) => r.status === "overdue");
    const totalPaid = paid.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    const totalPending = pending.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    const totalOverdue = overdue.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    return { pendingCount: pending.length, paidCount: paid.length, overdueCount: overdue.length, totalPaid, totalPending, totalOverdue };
  }, [records]);

  const handleFileUpload = (recordId: number, type: "receipt" | "invoice") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10MB)"); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        if (type === "receipt") {
          uploadReceiptMutation.mutate({ id: recordId, base64, fileName: file.name, mimeType: file.type });
        } else {
          uploadInvoiceMutation.mutate({ id: recordId, base64, fileName: file.name, mimeType: file.type });
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-transparent to-yellow-600/3" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/3 rounded-full blur-3xl" />

        <div className="relative px-8 pt-6 pb-6">
          <Link href="/hr">
            <button className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm mb-4 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to People & Payroll
            </button>
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Payroll & Compensation</h1>
                <p className="text-sm text-zinc-500">Track payments, receipts, invoices, and compensation history</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="px-8 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Paid", value: `$${stats.totalPaid.toLocaleString()}`, sub: `${stats.paidCount} payments`, icon: CheckCircle2, color: "text-emerald-400", accent: "from-emerald-950/40 to-zinc-900", border: "border-emerald-800/30" },
            { label: "Pending", value: `$${stats.totalPending.toLocaleString()}`, sub: `${stats.pendingCount} records`, icon: Clock, color: "text-amber-400", accent: "from-amber-950/40 to-zinc-900", border: "border-amber-800/30" },
            { label: "Overdue", value: stats.overdueCount > 0 ? `$${stats.totalOverdue.toLocaleString()}` : "$0", sub: `${stats.overdueCount} records`, icon: AlertCircle, color: stats.overdueCount > 0 ? "text-red-400" : "text-zinc-500", accent: stats.overdueCount > 0 ? "from-red-950/40 to-zinc-900" : "from-zinc-800 to-zinc-900", border: stats.overdueCount > 0 ? "border-red-800/30" : "border-zinc-800/60" },
            { label: "All Records", value: records.length, sub: "all time", icon: DollarSign, color: "text-yellow-500", accent: "from-yellow-950/30 to-zinc-900", border: "border-yellow-800/20" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl bg-gradient-to-br ${stat.accent} border ${stat.border} p-5 hover:border-zinc-600/40 transition-all`}>
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-zinc-600 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="px-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input placeholder="Search by employee name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-zinc-900/60 border-zinc-800 text-white placeholder:text-zinc-600 h-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-zinc-900/60 border-zinc-800 text-zinc-300 h-10"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Records */}
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-yellow-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4"><Wallet className="h-8 w-8 text-zinc-600" /></div>
            <p className="text-zinc-400 text-lg font-medium">No payroll records found</p>
            <p className="text-zinc-600 text-sm mt-1">Add payroll records from employee profiles</p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800/60 overflow-hidden">
            {/* Table Header */}
            <div className="bg-zinc-900/60 px-5 py-3 border-b border-zinc-800/40 grid grid-cols-12 gap-4 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
              <div className="col-span-3">Employee</div>
              <div className="col-span-2">Period</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1">Method</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Docs</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {filtered.map((rec: any) => {
              const status = STATUS_CONFIG[rec.status] || STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const isExpanded = expandedId === rec.id;

              return (
                <div key={rec.id} className="border-b border-zinc-800/30 last:border-0">
                  <div
                    className="px-5 py-4 grid grid-cols-12 gap-4 items-center hover:bg-zinc-900/40 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                  >
                    {/* Employee */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${rec.status === "paid" ? "bg-emerald-500/10" : rec.status === "overdue" ? "bg-red-500/10" : "bg-amber-500/10"}`}>
                        <StatusIcon className={`h-4 w-4 ${status.color}`} />
                      </div>
                      <div>
                        <Link href={`/hr/employee/${rec.employeeId}`}>
                          <p className="text-sm font-medium text-white hover:text-yellow-500 transition-colors">{rec.employeeName}</p>
                        </Link>
                        {rec.paymentDate && <p className="text-[10px] text-zinc-600">Paid {rec.paymentDate}</p>}
                      </div>
                    </div>

                    {/* Period */}
                    <div className="col-span-2">
                      <p className="text-xs text-zinc-300">{rec.payPeriodStart}</p>
                      <p className="text-[10px] text-zinc-600">to {rec.payPeriodEnd}</p>
                    </div>

                    {/* Amount */}
                    <div className="col-span-2 text-right">
                      <p className="text-sm font-bold text-white">{rec.currency} {Number(rec.amount).toLocaleString()}</p>
                    </div>

                    {/* Method */}
                    <div className="col-span-1">
                      <span className="text-xs text-zinc-400 capitalize">{rec.paymentMethod?.replace("_", " ") || "—"}</span>
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${status.bg} ${status.color} border`}>{status.label}</Badge>
                    </div>

                    {/* Docs */}
                    <div className="col-span-1 flex gap-1">
                      {rec.receiptUrl && (
                        <button onClick={(e) => { e.stopPropagation(); window.open(rec.receiptUrl, "_blank"); }} className="h-7 w-7 rounded-md bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-500/20 transition-colors" title="View Receipt">
                          <Receipt className="h-3.5 w-3.5 text-emerald-400" />
                        </button>
                      )}
                      {rec.invoiceUrl && (
                        <button onClick={(e) => { e.stopPropagation(); window.open(rec.invoiceUrl, "_blank"); }} className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center hover:bg-blue-500/20 transition-colors" title="View Invoice">
                          <FileText className="h-3.5 w-3.5 text-blue-400" />
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      {rec.status === "pending" && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ id: rec.id, status: "paid", paymentDate: new Date().toISOString().split("T")[0] }); }} className="text-emerald-400 hover:text-emerald-300 text-xs h-7 px-2">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Paid
                        </Button>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-5 pb-4 bg-zinc-900/20">
                      <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/40">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Attachments</p>
                          <div className="space-y-2">
                            <button onClick={() => handleFileUpload(rec.id, "receipt")} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors p-2 rounded-md hover:bg-zinc-800/50 w-full">
                              <Upload className="h-3.5 w-3.5" /> {rec.receiptUrl ? "Replace Receipt" : "Upload Receipt"}
                            </button>
                            <button onClick={() => handleFileUpload(rec.id, "invoice")} className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors p-2 rounded-md hover:bg-zinc-800/50 w-full">
                              <Upload className="h-3.5 w-3.5" /> {rec.invoiceUrl ? "Replace Invoice" : "Upload Invoice"}
                            </button>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Notes</p>
                          <p className="text-xs text-zinc-400">{rec.notes || "No notes"}</p>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Actions</p>
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this payroll record?")) deleteMutation.mutate({ id: rec.id }); }} className="text-zinc-500 hover:text-red-400 text-xs h-7 px-2">
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
