import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users, UserPlus, DollarSign, Search, Building2, Briefcase,
  ChevronRight, Clock, CheckCircle2, AlertTriangle,
  FileText, Loader2, ArrowUpRight, MapPin, Mail,
  Wallet, CreditCard, BarChart3
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  active: { label: "Active", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", dot: "bg-emerald-400" },
  inactive: { label: "Inactive", color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20", dot: "bg-zinc-400" },
  terminated: { label: "Terminated", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", dot: "bg-red-400" },
  on_leave: { label: "On Leave", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", dot: "bg-amber-400" },
};

const TYPE_LABELS: Record<string, string> = {
  full_time: "Full-Time", part_time: "Part-Time", contractor: "Contractor", intern: "Intern",
};

export default function HRHub() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const { data: employees = [], isLoading, refetch } = trpc.employees.list.useQuery(
    statusFilter !== "all" || deptFilter !== "all"
      ? { status: statusFilter !== "all" ? statusFilter : undefined, department: deptFilter !== "all" ? deptFilter : undefined }
      : undefined
  );
  const { data: departments = [] } = trpc.employees.departments.useQuery();
  const { data: payrollRecords = [] } = trpc.payroll.list.useQuery();

  const createMutation = trpc.employees.create.useMutation({
    onSuccess: (data) => {
      toast.success("Employee added successfully");
      setShowAddModal(false);
      refetch();
      navigate(`/hr/employee/${data.id}`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const stats = useMemo(() => {
    const active = employees.filter((e: any) => e.status === "active").length;
    const onLeave = employees.filter((e: any) => e.status === "on_leave").length;
    const contractors = employees.filter((e: any) => e.employmentType === "contractor").length;
    const totalPayroll = payrollRecords.filter((r: any) => r.status === "paid").reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    const pendingPayroll = payrollRecords.filter((r: any) => r.status === "pending").reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0);
    const overduePayroll = payrollRecords.filter((r: any) => r.status === "overdue").length;
    return { total: employees.length, active, onLeave, contractors, totalPayroll, pendingPayroll, overduePayroll };
  }, [employees, payrollRecords]);

  const filtered = useMemo(() => {
    let list = employees;
    if (deptFilter !== "all") list = list.filter((e: any) => e.department === deptFilter);
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((e: any) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
      e.email?.toLowerCase().includes(q) ||
      e.department?.toLowerCase().includes(q) ||
      e.jobTitle?.toLowerCase().includes(q)
    );
  }, [employees, search, deptFilter]);

  const deptBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e: any) => { const dept = e.department || "Unassigned"; map[dept] = (map[dept] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/5 via-transparent to-emerald-600/3" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-600/3 rounded-full blur-3xl" />
        <div className="relative px-8 pt-8 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-600 to-yellow-700 flex items-center justify-center">
                <Users className="h-5 w-5 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">People & Payroll</h1>
                <p className="text-sm text-zinc-500">Manage your team, compensation, and compliance</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/hr/payroll">
                <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600 bg-transparent">
                  <Wallet className="h-4 w-4 mr-2" /> Payroll
                </Button>
              </Link>
              <Button onClick={() => setShowAddModal(true)} className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium">
                <UserPlus className="h-4 w-4 mr-2" /> Add Employee
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="px-8 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Team", value: stats.total, icon: Users, color: "text-white", accent: "from-zinc-800 to-zinc-900" },
            { label: "Active", value: stats.active, icon: CheckCircle2, color: "text-emerald-400", accent: "from-emerald-950/40 to-zinc-900" },
            { label: "On Leave", value: stats.onLeave, icon: Clock, color: "text-amber-400", accent: "from-amber-950/40 to-zinc-900" },
            { label: "Contractors", value: stats.contractors, icon: Briefcase, color: "text-blue-400", accent: "from-blue-950/40 to-zinc-900" },
            { label: "Paid (Total)", value: `$${(stats.totalPayroll / 1000).toFixed(0)}k`, icon: DollarSign, color: "text-emerald-400", accent: "from-emerald-950/30 to-zinc-900" },
            { label: "Pending", value: stats.overduePayroll > 0 ? `${stats.overduePayroll} overdue` : `$${stats.pendingPayroll.toLocaleString()}`, icon: stats.overduePayroll > 0 ? AlertTriangle : CreditCard, color: stats.overduePayroll > 0 ? "text-red-400" : "text-yellow-500", accent: stats.overduePayroll > 0 ? "from-red-950/30 to-zinc-900" : "from-yellow-950/30 to-zinc-900" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl bg-gradient-to-br ${stat.accent} border border-zinc-800/60 p-4 hover:border-zinc-700/60 transition-all`}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">{stat.label}</span>
              </div>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-8 pb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input placeholder="Search by name, email, department, or title..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-zinc-900/60 border-zinc-800 text-white placeholder:text-zinc-600 h-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 bg-zinc-900/60 border-zinc-800 text-zinc-300 h-10"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-44 bg-zinc-900/60 border-zinc-800 text-zinc-300 h-10"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d: any) => (
                <SelectItem key={d.department || d} value={d.department || d}>{d.department || d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 rounded-lg p-1">
            <button onClick={() => setView("grid")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "grid" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>Grid</button>
            <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "list" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>List</button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-8 pb-8">
        <div className="flex gap-6">
          {/* Main Employee Grid/List */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-yellow-600" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4"><Users className="h-8 w-8 text-zinc-600" /></div>
                <p className="text-zinc-400 text-lg font-medium">No employees found</p>
                <p className="text-zinc-600 text-sm mt-1">Add your first team member to get started</p>
                <Button onClick={() => setShowAddModal(true)} className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-black font-medium"><UserPlus className="h-4 w-4 mr-2" /> Add Employee</Button>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map((emp: any) => {
                  const status = STATUS_CONFIG[emp.status] || STATUS_CONFIG.active;
                  return (
                    <Link key={emp.id} href={`/hr/employee/${emp.id}`}>
                      <div className="group rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-5 hover:border-yellow-600/30 hover:bg-zinc-900/60 transition-all cursor-pointer">
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            {emp.photoUrl ? (
                              <img src={emp.photoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                            ) : (
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white font-semibold text-sm">
                                {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                              </div>
                            )}
                            <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 ${status.dot}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-white truncate group-hover:text-yellow-500 transition-colors">{emp.firstName} {emp.lastName}</h3>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${status.bg} ${status.color} border`}>{status.label}</Badge>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5 truncate">{emp.jobTitle}</p>
                            <div className="flex items-center gap-3 mt-2">
                              {emp.department && <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Building2 className="h-3 w-3" /> {emp.department}</span>}
                              <span className="text-[10px] text-zinc-600">{TYPE_LABELS[emp.employmentType] || emp.employmentType}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-zinc-700 group-hover:text-yellow-600 transition-colors flex-shrink-0 mt-1" />
                        </div>
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-zinc-800/40">
                          {emp.email && <span className="text-[10px] text-zinc-500 flex items-center gap-1 truncate"><Mail className="h-3 w-3 flex-shrink-0" /> {emp.email}</span>}
                          {emp.country && <span className="text-[10px] text-zinc-500 flex items-center gap-1"><MapPin className="h-3 w-3 flex-shrink-0" /> {emp.country}</span>}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-800/60 overflow-hidden">
                <div className="bg-zinc-900/40 px-5 py-3 border-b border-zinc-800/40 grid grid-cols-12 gap-4 text-[10px] uppercase tracking-widest text-zinc-500 font-medium">
                  <div className="col-span-4">Employee</div>
                  <div className="col-span-2">Department</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Hired</div>
                </div>
                {filtered.map((emp: any) => {
                  const status = STATUS_CONFIG[emp.status] || STATUS_CONFIG.active;
                  return (
                    <Link key={emp.id} href={`/hr/employee/${emp.id}`}>
                      <div className="group px-5 py-3.5 border-b border-zinc-800/30 grid grid-cols-12 gap-4 items-center hover:bg-zinc-900/40 transition-colors cursor-pointer">
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="relative">
                            {emp.photoUrl ? (
                              <img src={emp.photoUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-white font-medium text-xs">{emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}</div>
                            )}
                            <div className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-black ${status.dot}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white group-hover:text-yellow-500 transition-colors">{emp.firstName} {emp.lastName}</p>
                            <p className="text-xs text-zinc-500">{emp.jobTitle}</p>
                          </div>
                        </div>
                        <div className="col-span-2 text-sm text-zinc-400">{emp.department || "—"}</div>
                        <div className="col-span-2 text-sm text-zinc-400">{TYPE_LABELS[emp.employmentType] || emp.employmentType}</div>
                        <div className="col-span-2"><Badge variant="outline" className={`text-[10px] ${status.bg} ${status.color} border`}>{status.label}</Badge></div>
                        <div className="col-span-2 text-sm text-zinc-500">{emp.hireDate || "—"}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          {employees.length > 0 && (
            <div className="w-72 flex-shrink-0 space-y-4 hidden xl:block">
              <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-5">
                <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-4 flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5" /> Departments</h3>
                <div className="space-y-3">
                  {deptBreakdown.slice(0, 8).map(([dept, count]) => (
                    <div key={dept}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-300">{dept}</span>
                        <span className="text-xs text-zinc-500">{count}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-full transition-all" style={{ width: `${(count / stats.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-5">
                <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: "Run Payroll", icon: DollarSign, href: "/hr/payroll", color: "text-emerald-400" },
                    { label: "Add Employee", icon: UserPlus, action: () => setShowAddModal(true), color: "text-yellow-500" },
                    { label: "View Reports", icon: FileText, href: "/hr/payroll", color: "text-blue-400" },
                  ].map((action) => (
                    action.href ? (
                      <Link key={action.label} href={action.href}>
                        <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                          <action.icon className={`h-4 w-4 ${action.color}`} />
                          <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{action.label}</span>
                          <ArrowUpRight className="h-3 w-3 text-zinc-600 ml-auto" />
                        </div>
                      </Link>
                    ) : (
                      <div key={action.label} onClick={action.action} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                        <action.icon className={`h-4 w-4 ${action.color}`} />
                        <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{action.label}</span>
                        <ArrowUpRight className="h-3 w-3 text-zinc-600 ml-auto" />
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-5">
                <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-4 flex items-center gap-2"><Wallet className="h-3.5 w-3.5" /> Payroll Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Total Paid</span>
                    <span className="text-sm font-bold text-emerald-400">${stats.totalPayroll.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Pending</span>
                    <span className="text-sm font-bold text-amber-400">${stats.pendingPayroll.toLocaleString()}</span>
                  </div>
                  {stats.overduePayroll > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Overdue</span>
                      <span className="text-sm font-bold text-red-400">{stats.overduePayroll} records</span>
                    </div>
                  )}
                  <Link href="/hr/payroll">
                    <Button variant="outline" size="sm" className="w-full mt-2 border-zinc-700 text-zinc-300 hover:text-white bg-transparent text-xs">View All Payroll <ArrowUpRight className="h-3 w-3 ml-1" /></Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal open={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={(data: any) => createMutation.mutate(data)} isPending={createMutation.isPending} />
    </div>
  );
}

function AddEmployeeModal({ open, onClose, onSubmit, isPending }: { open: boolean; onClose: () => void; onSubmit: (data: any) => void; isPending: boolean }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    hireDate: new Date().toISOString().split("T")[0],
    jobTitle: "", department: "", employmentType: "full_time" as const,
    salary: "", currency: "USD", payFrequency: "monthly" as const,
    country: "", city: "", notes: "",
  });

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.jobTitle) {
      toast.error("Please fill in required fields (name, email, job title)");
      return;
    }
    onSubmit({ ...form, phone: form.phone || undefined, department: form.department || undefined, salary: form.salary || undefined, country: form.country || undefined, city: form.city || undefined, notes: form.notes || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-yellow-600/20 flex items-center justify-center"><UserPlus className="h-4 w-4 text-yellow-500" /></div>
            Add New Employee
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-3">Personal Information</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-zinc-400 mb-1 block">First Name *</label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="First name" /></div>
              <div><label className="text-xs text-zinc-400 mb-1 block">Last Name *</label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Last name" /></div>
              <div><label className="text-xs text-zinc-400 mb-1 block">Email *</label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="email@company.com" type="email" /></div>
              <div><label className="text-xs text-zinc-400 mb-1 block">Phone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="+1 234 567 8900" /></div>
              <div><label className="text-xs text-zinc-400 mb-1 block">Country</label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Country" /></div>
              <div><label className="text-xs text-zinc-400 mb-1 block">City</label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="City" /></div>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-3">Employment Details</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-zinc-400 mb-1 block">Job Title *</label><Input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="e.g. Operations Manager" /></div>
              <div><label className="text-xs text-zinc-400 mb-1 block">Department</label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="e.g. Operations" /></div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Employment Type</label>
                <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v as any })}><SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="full_time">Full-Time</SelectItem><SelectItem value="part_time">Part-Time</SelectItem><SelectItem value="contractor">Contractor</SelectItem><SelectItem value="intern">Intern</SelectItem></SelectContent></Select>
              </div>
              <div><label className="text-xs text-zinc-400 mb-1 block">Hire Date</label><Input type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-3">Compensation</h4>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-zinc-400 mb-1 block">Salary</label><Input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="bg-zinc-800 border-zinc-700 text-white" placeholder="e.g. 5000" /></div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Currency</label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}><SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="USD">USD</SelectItem><SelectItem value="AED">AED</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem><SelectItem value="PKR">PKR</SelectItem></SelectContent></Select>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Pay Frequency</label>
                <Select value={form.payFrequency} onValueChange={(v) => setForm({ ...form, payFrequency: v as any })}><SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-zinc-800 border-zinc-700"><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="biweekly">Bi-Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="per_project">Per Project</SelectItem></SelectContent></Select>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm p-3 min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-yellow-600/50" placeholder="Any additional notes..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
          <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300 bg-transparent">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium">
            {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding...</> : <><UserPlus className="h-4 w-4 mr-2" /> Add Employee</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
