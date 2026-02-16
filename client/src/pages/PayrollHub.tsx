import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, DollarSign, Search, Clock, CheckCircle2,
  AlertCircle, XCircle, Loader2, Upload, FileText, Download, Trash2
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  overdue: "bg-red-500/20 text-red-400 border-red-500/30",
  cancelled: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  paid: CheckCircle2,
  overdue: AlertCircle,
  cancelled: XCircle,
};

export default function PayrollHub() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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
    onError: (err) => toast.error(err.message),
  });
  const uploadInvoiceMutation = trpc.payroll.uploadInvoice.useMutation({
    onSuccess: () => { toast.success("Invoice uploaded"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const filtered = useMemo(() => {
    if (!search) return records;
    const q = search.toLowerCase();
    return records.filter((r: any) =>
      r.employeeName?.toLowerCase().includes(q) ||
      r.notes?.toLowerCase().includes(q)
    );
  }, [records, search]);

  const stats = useMemo(() => {
    const pending = records.filter((r: any) => r.status === "pending");
    const paid = records.filter((r: any) => r.status === "paid");
    const overdue = records.filter((r: any) => r.status === "overdue");
    const totalPaid = paid.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    const totalPending = pending.reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    return { pendingCount: pending.length, paidCount: paid.length, overdueCount: overdue.length, totalPaid, totalPending };
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
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/hr">
          <Button variant="ghost" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" /> HR Hub
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Payroll</h1>
          </div>
          <p className="text-zinc-400 text-sm">Track payments, upload receipts and invoices</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Pending", value: `$${stats.totalPending.toLocaleString()}`, sub: `${stats.pendingCount} records`, color: "text-amber-400", icon: Clock },
          { label: "Paid", value: `$${stats.totalPaid.toLocaleString()}`, sub: `${stats.paidCount} records`, color: "text-emerald-400", icon: CheckCircle2 },
          { label: "Overdue", value: stats.overdueCount, sub: "records", color: "text-red-400", icon: AlertCircle },
          { label: "Total Records", value: records.length, sub: "all time", color: "text-yellow-500", icon: DollarSign },
        ].map((stat) => (
          <Card key={stat.label} className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-zinc-500">{stat.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search by employee name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-900 border-zinc-700 text-white"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-zinc-900 border-zinc-700 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Records */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <DollarSign className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg">No payroll records found</p>
          <p className="text-zinc-600 text-sm mt-1">Add payroll records from employee profiles</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((rec: any) => {
            const StatusIcon = STATUS_ICONS[rec.status] || Clock;
            return (
              <div key={rec.id} className="flex items-center gap-4 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all">
                <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <StatusIcon className={`h-5 w-5 ${rec.status === "paid" ? "text-emerald-400" : rec.status === "overdue" ? "text-red-400" : "text-amber-400"}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/hr/employee/${rec.employeeId}`}>
                    <p className="text-white font-medium text-sm hover:text-yellow-500 cursor-pointer">{rec.employeeName}</p>
                  </Link>
                  <p className="text-xs text-zinc-500">{rec.payPeriodStart} — {rec.payPeriodEnd}</p>
                </div>

                <div className="text-right">
                  <p className="text-white font-bold">{rec.currency} {Number(rec.amount).toLocaleString()}</p>
                  <p className="text-xs text-zinc-500">{rec.paymentMethod?.replace("_", " ")}</p>
                </div>

                <Badge variant="outline" className={STATUS_COLORS[rec.status] || ""}>{rec.status}</Badge>

                {rec.paymentDate && <span className="text-xs text-zinc-500">{rec.paymentDate}</span>}

                {/* Attachments */}
                <div className="flex gap-1">
                  {rec.receiptUrl ? (
                    <Button variant="ghost" size="sm" onClick={() => window.open(rec.receiptUrl, "_blank")} className="text-emerald-400 hover:text-emerald-300" title="View Receipt">
                      <FileText className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => handleFileUpload(rec.id, "receipt")} className="text-zinc-500 hover:text-zinc-300" title="Upload Receipt">
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
                  {rec.invoiceUrl ? (
                    <Button variant="ghost" size="sm" onClick={() => window.open(rec.invoiceUrl, "_blank")} className="text-blue-400 hover:text-blue-300" title="View Invoice">
                      <Download className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => handleFileUpload(rec.id, "invoice")} className="text-zinc-500 hover:text-zinc-300" title="Upload Invoice">
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  {rec.status === "pending" && (
                    <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate({ id: rec.id, status: "paid", paymentDate: new Date().toISOString().split("T")[0] })} className="text-emerald-400 hover:text-emerald-300 text-xs">
                      Mark Paid
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => {
                    if (confirm("Delete this payroll record?")) deleteMutation.mutate({ id: rec.id });
                  }} className="text-zinc-400 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
