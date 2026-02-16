import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users, Search, Plus, Building2, Briefcase, UserCheck,
  UserX, DollarSign, FileText, ChevronRight, Loader2
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  inactive: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  terminated: "bg-red-500/20 text-red-400 border-red-500/30",
  on_leave: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const TYPE_LABELS: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contractor: "Contractor",
  intern: "Intern",
};

export default function HRHub() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: employees = [], isLoading, refetch } = trpc.employees.list.useQuery(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const { data: departments = [] } = trpc.employees.departments.useQuery();
  const createMutation = trpc.employees.create.useMutation({
    onSuccess: () => {
      toast.success("Employee added successfully");
      refetch();
      setShowAddDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = useMemo(() => {
    let list = employees;
    if (deptFilter !== "all") {
      list = list.filter((e: any) => e.department === deptFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e: any) =>
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.jobTitle?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [employees, search, deptFilter]);

  const stats = useMemo(() => {
    const active = employees.filter((e: any) => e.status === "active").length;
    const onLeave = employees.filter((e: any) => e.status === "on_leave").length;
    const deptCount = new Set(employees.map((e: any) => e.department).filter(Boolean)).size;
    return { total: employees.length, active, onLeave, deptCount };
  }, [employees]);

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">HR & People</h1>
          </div>
          <p className="text-zinc-400 text-sm">Employee directory, payroll, and document management</p>
        </div>
        <div className="flex gap-3">
          <Link href="/hr/payroll">
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <DollarSign className="h-4 w-4 mr-2" />
              Payroll
            </Button>
          </Link>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-black">
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Employee</DialogTitle>
              </DialogHeader>
              <AddEmployeeForm
                onSubmit={(data) => createMutation.mutate(data)}
                isPending={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Employees", value: stats.total, icon: Users, color: "text-yellow-500" },
          { label: "Active", value: stats.active, icon: UserCheck, color: "text-emerald-400" },
          { label: "On Leave", value: stats.onLeave, icon: UserX, color: "text-amber-400" },
          { label: "Departments", value: stats.deptCount, icon: Building2, color: "text-blue-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-zinc-500">{stat.label}</p>
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
            placeholder="Search employees..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-48 bg-zinc-900 border-zinc-700 text-white">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-700">
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d: any) => (
              <SelectItem key={d.department} value={d.department}>{d.department} ({d.count})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Employee List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg">No employees found</p>
          <p className="text-zinc-600 text-sm mt-1">Add your first employee to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((emp: any) => (
            <Link key={emp.id} href={`/hr/employee/${emp.id}`}>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-yellow-600/30 hover:bg-zinc-900 transition-all cursor-pointer group">
                {/* Avatar */}
                <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {emp.photoUrl ? (
                    <img src={emp.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-yellow-500">
                      {emp.firstName?.[0]}{emp.lastName?.[0]}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{emp.firstName} {emp.lastName}</p>
                    <Badge variant="outline" className={STATUS_COLORS[emp.status] || ""}>
                      {emp.status?.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400">{emp.jobTitle}</p>
                </div>

                {/* Department */}
                <div className="text-right hidden md:block">
                  {emp.department && (
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                      {emp.department}
                    </Badge>
                  )}
                </div>

                {/* Type */}
                <div className="text-right hidden lg:block">
                  <p className="text-xs text-zinc-500">{TYPE_LABELS[emp.employmentType] || emp.employmentType}</p>
                </div>

                {/* Email */}
                <div className="text-right hidden xl:block max-w-[200px]">
                  <p className="text-xs text-zinc-500 truncate">{emp.email}</p>
                </div>

                {/* Hire Date */}
                <div className="text-right hidden xl:block">
                  <p className="text-xs text-zinc-500">Hired {emp.hireDate}</p>
                </div>

                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-yellow-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ADD EMPLOYEE FORM
// ============================================================================

function AddEmployeeForm({ onSubmit, isPending }: { onSubmit: (data: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    hireDate: new Date().toISOString().split("T")[0],
    jobTitle: "", department: "",
    employmentType: "full_time" as const,
    salary: "", payFrequency: "monthly" as const, currency: "USD",
    dateOfBirth: "", address: "", city: "", state: "", country: "",
    emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: "",
    notes: "",
  });

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.jobTitle || !form.hireDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSubmit({
      ...form,
      phone: form.phone || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      country: form.country || undefined,
      department: form.department || undefined,
      salary: form.salary || undefined,
      emergencyContactName: form.emergencyContactName || undefined,
      emergencyContactPhone: form.emergencyContactPhone || undefined,
      emergencyContactRelation: form.emergencyContactRelation || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal */}
      <div>
        <h3 className="text-sm font-medium text-yellow-500 mb-3">Personal Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">First Name *</label>
            <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Last Name *</label>
            <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Email *</label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Phone</label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Date of Birth</label>
            <Input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-sm font-medium text-yellow-500 mb-3">Address</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input placeholder="Street Address" value={form.address} onChange={(e) => update("address", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
          </div>
          <Input placeholder="City" value={form.city} onChange={(e) => update("city", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
          <Input placeholder="State" value={form.state} onChange={(e) => update("state", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
          <Input placeholder="Country" value={form.country} onChange={(e) => update("country", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
        </div>
      </div>

      {/* Employment */}
      <div>
        <h3 className="text-sm font-medium text-yellow-500 mb-3">Employment Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Job Title *</label>
            <Input value={form.jobTitle} onChange={(e) => update("jobTitle", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Department</label>
            <Input value={form.department} onChange={(e) => update("department", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Hire Date *</label>
            <Input type="date" value={form.hireDate} onChange={(e) => update("hireDate", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Type</label>
            <Select value={form.employmentType} onValueChange={(v) => update("employmentType", v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700">
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
                <SelectItem value="intern">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Compensation */}
      <div>
        <h3 className="text-sm font-medium text-yellow-500 mb-3">Compensation</h3>
        <div className="grid grid-cols-3 gap-3">
          <Input placeholder="Salary" value={form.salary} onChange={(e) => update("salary", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
          <Select value={form.payFrequency} onValueChange={(v) => update("payFrequency", v)}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="per_project">Per Project</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Currency" value={form.currency} onChange={(e) => update("currency", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
        </div>
      </div>

      {/* Emergency Contact */}
      <div>
        <h3 className="text-sm font-medium text-yellow-500 mb-3">Emergency Contact</h3>
        <div className="grid grid-cols-3 gap-3">
          <Input placeholder="Name" value={form.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
          <Input placeholder="Phone" value={form.emergencyContactPhone} onChange={(e) => update("emergencyContactPhone", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
          <Input placeholder="Relationship" value={form.emergencyContactRelation} onChange={(e) => update("emergencyContactRelation", e.target.value)} className="bg-zinc-800 border-zinc-700 text-white" />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-3 text-white text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-yellow-600"
        />
      </div>

      <Button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-black" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Employee"}
      </Button>
    </form>
  );
}
