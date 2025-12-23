"use client"

import { useState, useEffect } from "react"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getPatientsAsync, getAppointmentsAsync, getDoctorsAsync, getAllConsultationsAsync } from "@/lib/storage"
import { formatDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import type { Patient, Appointment, Doctor, ConsultationRecord } from "@/lib/types"
import { Search, UserSearch, History, Mail, Phone, ExternalLink, Activity, Calendar, Edit3, ArrowUpDown, ArrowUp, ArrowDown, Trash2, AlertTriangle, Stethoscope, ChevronLeft, ChevronRight, UserPlus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PatientsPage() {
    const { isLoading } = useAdminAuth()
    const [patients, setPatients] = useState<Patient[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [consultations, setConsultations] = useState<ConsultationRecord[]>([])
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [showBulkImport, setShowBulkImport] = useState(false)
    const [showAddPatient, setShowAddPatient] = useState(false)
    const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)
    const [bulkData, setBulkData] = useState("")
    const [newPatient, setNewPatient] = useState<Partial<Patient>>({
        name: "",
        ic: "",
        phone: "",
        email: "",
        medicalAlerts: "",
        type: "existing"
    })
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' })
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 25

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }))
        setCurrentPage(1) // Reset to first page on sort
    }

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsDataLoading(true)
        try {
            const [pts, apts, docs, cons] = await Promise.all([
                getPatientsAsync().catch(() => []),
                getAppointmentsAsync().catch(() => []),
                getDoctorsAsync().catch(() => []),
                getAllConsultationsAsync().catch(() => [])
            ])
            setPatients(pts)
            setAppointments(apts)
            setDoctors(docs)
            setConsultations(cons)
        } catch (e) {
            console.error("Critical error loading registry data", e)
        } finally {
            setIsDataLoading(false)
        }
    }

    const filteredPatients = patients.filter((p: Patient) => {
        const query = searchQuery.toLowerCase();
        const matchesBasic = p.name?.toLowerCase().includes(query) ||
            p.ic?.toLowerCase().includes(query) ||
            p.phone?.includes(searchQuery);

        if (matchesBasic) return true;

        // Check if doctor matches search query
        const getDoctorName = (pt: Patient) => {
            const lastApt = appointments
                .filter(ap => ap.patientIC === pt.ic && (ap.status === 'confirmed' || ap.status === 'completed'))
                .sort((ap1, ap2) => new Date(ap2.appointmentDate).getTime() - new Date(ap1.appointmentDate).getTime())[0];
            if (lastApt) {
                const doc = doctors.find(d => d.id === lastApt.doctorId);
                if (doc) return doc.name;
            }
            const lastCon = consultations
                .filter(c => c.patientIC === pt.ic)
                .sort((c1, c2) => new Date(c2.consultationDate).getTime() - new Date(c1.consultationDate).getTime())[0];
            if (lastCon) {
                const doc = doctors.find(d => d.id === lastCon.doctorId);
                return doc?.name || "";
            }
            return "";
        };

        const docName = getDoctorName(p).toLowerCase();
        return docName.includes(query);
    }
    ).sort((a, b) => {
        const { key, direction } = sortConfig
        let aValue: any = a[key as keyof Patient]
        let bValue: any = b[key as keyof Patient]

        // Handle nested or specific fields
        if (key === 'careStatus') {
            aValue = a.continuedTreatment?.active ? 1 : 0
            bValue = b.continuedTreatment?.active ? 1 : 0
        } else if (key === 'lastVisit') {
            // Ensure proper date comparison
            aValue = a.lastVisit ? new Date(a.lastVisit).getTime() : 0
            bValue = b.lastVisit ? new Date(b.lastVisit).getTime() : 0
        } else if (key === 'nextVisit') {
            aValue = a.continuedTreatment?.nextFollowUpDate ? new Date(a.continuedTreatment.nextFollowUpDate).getTime() : Infinity
            bValue = b.continuedTreatment?.nextFollowUpDate ? new Date(b.continuedTreatment.nextFollowUpDate).getTime() : Infinity
        } else if (key === 'ic') {
            aValue = (a.ic || "").toLowerCase()
            bValue = (b.ic || "").toLowerCase()
        } else if (key === 'doctor') {
            const getDoctorName = (pt: Patient) => {
                // Try to find doctor from appointments first
                const lastApt = appointments
                    .filter(ap => ap.patientIC === pt.ic && (ap.status === 'confirmed' || ap.status === 'completed'))
                    .sort((ap1, ap2) => new Date(ap2.appointmentDate).getTime() - new Date(ap1.appointmentDate).getTime())[0]

                if (lastApt) {
                    const doc = doctors.find(d => d.id === lastApt.doctorId)
                    if (doc) return doc.name
                }

                // Fallback to consultation records
                const lastCon = consultations
                    .filter(c => c.patientIC === pt.ic)
                    .sort((c1, c2) => new Date(c2.consultationDate).getTime() - new Date(c1.consultationDate).getTime())[0]

                if (lastCon) {
                    const doc = doctors.find(d => d.id === lastCon.doctorId)
                    return doc?.name || ""
                }

                return ""
            }
            aValue = getDoctorName(a).toLowerCase()
            bValue = getDoctorName(b).toLowerCase()
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1
        if (aValue > bValue) return direction === 'asc' ? 1 : -1
        return 0
    })

    const totalPages = Math.ceil(filteredPatients.length / itemsPerPage)
    const paginatedPatients = filteredPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handleUpdatePatient = async () => {
        if (!editingPatient) return
        setIsSaving(true)
        try {
            const res = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPatient)
            })
            if (res.ok) {
                await loadData()
                setEditingPatient(null)
                alert("Patient profile updated successfully.")
            } else {
                const err = await res.json()
                alert(`Update failed: ${err.error || 'Server error'}`)
            }
        } catch (e) {
            console.error("Failed to update patient", e)
            alert("Database connection error. Please check your network.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddPatient = async () => {
        if (!newPatient.name || !newPatient.ic || !newPatient.phone) {
            alert("Please fill in Name, IC, and Phone.");
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newPatient, id: `PAT-${Math.random().toString(36).substr(2, 9).toUpperCase()}` })
            });
            if (res.ok) {
                await loadData();
                setShowAddPatient(false);
                setNewPatient({ name: "", ic: "", phone: "", email: "", medicalAlerts: "", type: "existing" });
                alert("Patient added successfully.");
            } else {
                const err = await res.json();
                alert(`Failed to add patient: ${err.error || 'Check for duplicate IC'}`);
            }
        } catch (e) {
            alert("Connection error.");
        } finally {
            setIsSaving(false);
        }
    }

    const handleDeletePatient = async () => {
        if (!patientToDelete) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/patients?ic=${patientToDelete.ic}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                await loadData();
                setPatientToDelete(null);
                alert("Patient deleted successfully.");
            } else {
                const err = await res.json();
                alert(`Delete failed: ${err.error || 'Server error'}`);
            }
        } catch (e) {
            alert("Connection error.");
        } finally {
            setIsSaving(false);
        }
    }

    const handleBulkImport = async () => {
        if (!bulkData.trim()) return;
        setIsSaving(true);
        try {
            // Expected Format: Name, IC, Phone, Email (one per line)
            const lines = bulkData.split('\n');
            const patientsToImport = lines.map(line => {
                const [name, ic, phone, email] = line.split(',').map(s => s.trim());
                if (!name || !ic) return null;
                return {
                    id: `PAT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    name,
                    ic,
                    phone: phone || "",
                    email: email || "",
                    type: "existing" as const
                };
            }).filter(Boolean);

            if (patientsToImport.length === 0) {
                alert("No valid data found. Format: Name, IC, Phone, Email");
                setIsSaving(false);
                return;
            }

            let successCount = 0;
            // We'll send them one by one for simplicity if the API doesn't support bulk
            // In a real app, we'd use a bulk endpoint
            for (const p of patientsToImport) {
                const res = await fetch('/api/patients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(p)
                });
                if (res.ok) successCount++;
            }

            await loadData();
            setShowBulkImport(false);
            setBulkData("");
            alert(`Successfully imported ${successCount} out of ${patientsToImport.length} patients.`);
        } catch (e) {
            alert("Import failed.");
        } finally {
            setIsSaving(false);
        }
    }

    const patientHistory = selectedPatient
        ? appointments.filter((a: Appointment) => a.patientIC === selectedPatient.ic).sort((a: Appointment, b: Appointment) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
        : []

    if (isLoading || isDataLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50/50 min-h-screen">
                <LoadingScreen message="Accessing Patient Records..." />
            </div>
        )
    }

    return (
        <div className="flex-1 bg-slate-50/50">
            <main className="container mx-auto px-6 py-10">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-sans font-bold text-slate-900 tracking-tight">Patient Registry</h1>
                        <p className="text-slate-500 mt-1">Cross-reference clinical records and visit history.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Select
                            value={sortConfig.key}
                            onValueChange={(value) => handleSort(value)}
                        >
                            <SelectTrigger className="h-12 w-[180px] rounded-2xl border-slate-200 font-bold">
                                <SelectValue placeholder="Sort by..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Sort by Name</SelectItem>
                                <SelectItem value="ic">Sort by IC</SelectItem>
                                <SelectItem value="doctor">Sort by Doctor</SelectItem>
                                <SelectItem value="careStatus">Sort by Care Status</SelectItem>
                                <SelectItem value="lastVisit">Sort by Date</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={() => setShowAddPatient(true)}
                            className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-200 gap-2"
                        >
                            <UserPlus className="w-5 h-5" />
                            Add Patient
                        </Button>
                        <div className="relative group max-w-sm w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
                            <Input
                                placeholder="Search by name, IC, or phone..."
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setSearchQuery(e.target.value)
                                    setCurrentPage(1) // Reset to first page on search
                                }}
                                className="h-12 pl-12 rounded-2xl bg-white border-slate-100 shadow-sm transition-all focus:ring-4 focus:ring-blue-100 font-medium"
                            />
                        </div>
                    </div>
                </div>

                <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        {filteredPatients.length === 0 ? (
                            <div className="py-24 text-center opacity-40">
                                <UserSearch className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                <p className="text-xl font-bold text-slate-900">No Patient Records</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="border-slate-50">
                                            <TableHead
                                                className="px-4 h-12 text-[11px] font-black uppercase text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                                                onClick={() => handleSort('name')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Name
                                                    {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="px-4 h-12 text-[11px] font-black uppercase text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                                                onClick={() => handleSort('ic')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    IC Number
                                                    {sortConfig.key === 'ic' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                                </div>
                                            </TableHead>
                                            <TableHead className="px-4 h-12 text-[11px] font-black uppercase text-slate-400 whitespace-nowrap">Contact</TableHead>
                                            <TableHead
                                                className="px-4 h-12 text-[11px] font-black uppercase text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                                                onClick={() => handleSort('careStatus')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Care Status
                                                    {sortConfig.key === 'careStatus' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                                </div>
                                            </TableHead>
                                            <TableHead
                                                className="px-4 h-12 text-[11px] font-black uppercase text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                                                onClick={() => handleSort('lastVisit')}
                                            >
                                                <div className="flex items-center gap-2">
                                                    Clinical Date
                                                    {sortConfig.key === 'lastVisit' && (sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                                                </div>
                                            </TableHead>
                                            <TableHead className="px-4 h-12 text-right text-[11px] font-black uppercase text-slate-400 whitespace-nowrap">Operations</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedPatients.map((patient: Patient) => (
                                            <TableRow key={patient.id} className="border-slate-50 hover:bg-slate-50/50 group transition-colors">
                                                <TableCell className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-slate-600">{patient.name}</span>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-sm font-bold text-slate-600">{patient.ic}</span>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-slate-900">
                                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-sm font-bold">{patient.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {patient.continuedTreatment?.active ? (
                                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                                <span className="text-[10px] font-black uppercase tracking-tighter">Follow-up active</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] font-black text-slate-300 uppercase italic">Registry Only</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 shrink-0" />
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-slate-400 uppercase leading-none">Last Visit</span>
                                                                <span className="text-sm font-medium text-slate-600">{patient.lastVisit ? formatDate(patient.lastVisit) : "Never"}</span>
                                                            </div>
                                                        </div>
                                                        {patient.continuedTreatment?.nextFollowUpDate && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black text-blue-400 uppercase leading-none">Next Visit</span>
                                                                    <span className="text-sm font-bold text-blue-600">{formatDate(patient.continuedTreatment.nextFollowUpDate)}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 py-3 text-right flex justify-end gap-2 whitespace-nowrap">
                                                    <Button
                                                        onClick={() => setEditingPatient(patient)}
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        onClick={() => setPatientToDelete(patient)}
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination Controls */}
                {filteredPatients.length > itemsPerPage && (
                    <div className="mt-8 flex items-center justify-between bg-white px-8 py-4 rounded-[1.5rem] shadow-sm shadow-slate-200/50">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-500">
                                Showing <span className="text-slate-900 font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredPatients.length)}</span> of <span className="text-slate-900 font-bold">{filteredPatients.length}</span> patients
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-10 rounded-xl hover:bg-slate-50 text-slate-600 font-bold gap-2"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                    .map((p, i, arr) => {
                                        return (
                                            <div key={p} className="flex items-center">
                                                {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-slate-400">...</span>}
                                                <Button
                                                    variant={currentPage === p ? 'default' : 'ghost'}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p)}
                                                    className={cn(
                                                        "h-10 w-10 rounded-xl font-bold transition-all",
                                                        currentPage === p ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-600 hover:bg-blue-50 hover:text-blue-600"
                                                    )}
                                                >
                                                    {p}
                                                </Button>
                                            </div>
                                        )
                                    })}
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-10 rounded-xl hover:bg-slate-50 text-slate-600 font-bold gap-2"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </main>

            {/* Edit Patient Dialog */}
            <Dialog open={!!editingPatient} onOpenChange={(open: boolean) => !open && setEditingPatient(null)}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
                    <div className="bg-blue-600 p-10 text-white relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold mb-2">Edit Patient Profile</DialogTitle>
                        </DialogHeader>
                        <p className="text-blue-100 text-sm">Update clinical registry for {editingPatient?.ic}</p>
                    </div>
                    <div className="p-8 space-y-6 bg-white">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <Input
                                value={editingPatient?.name || ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPatient((prev: Patient | null) => prev ? { ...prev, name: e.target.value } : null)}
                                className="h-12 rounded-2xl bg-slate-50 border-slate-100 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                            <Input
                                value={editingPatient?.phone || ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPatient((prev: Patient | null) => prev ? { ...prev, phone: e.target.value } : null)}
                                className="h-12 rounded-2xl bg-slate-50 border-slate-100 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-orange-600">Medical Alerts / Allergies</label>
                            <Input
                                value={editingPatient?.medicalAlerts || ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPatient((prev: Patient | null) => prev ? { ...prev, medicalAlerts: e.target.value } : null)}
                                className="h-12 rounded-2xl bg-orange-50 border-orange-100 focus:ring-4 focus:ring-orange-100 transition-all font-medium text-orange-900 placeholder:text-orange-200"
                                placeholder="e.g. Penicillin Allergy, Diabetes..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address (Optional)</label>
                            <Input
                                value={editingPatient?.email || ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPatient((prev: Patient | null) => prev ? { ...prev, email: e.target.value } : null)}
                                className="h-12 rounded-2xl bg-slate-50 border-slate-100 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                            />
                        </div>

                        <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900 border-b-2 border-slate-200 pb-0.5 mb-1 w-fit">Clinical Follow-up</span>
                                    <span className="text-[10px] text-slate-400 uppercase font-black">Plan subsequent clinical visits</span>
                                </div>
                                <Button
                                    type="button"
                                    onClick={() => setEditingPatient((prev: Patient | null) => {
                                        if (!prev) return null;
                                        const isActive = !prev.continuedTreatment?.active;
                                        return {
                                            ...prev,
                                            continuedTreatment: {
                                                active: isActive,
                                                status: prev.continuedTreatment?.status || 'in-progress',
                                                notes: prev.continuedTreatment?.notes || "",
                                                nextFollowUpDate: prev.continuedTreatment?.nextFollowUpDate || undefined,
                                                preferredChannels: prev.continuedTreatment?.preferredChannels || { sms: true, whatsapp: true, email: true }
                                            }
                                        }
                                    })}
                                    className={`rounded-2xl h-11 px-6 text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm border-2 ${editingPatient?.continuedTreatment?.active
                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400 shadow-emerald-100"
                                        : "bg-slate-200 hover:bg-slate-300 text-slate-500 border-slate-300 shadow-slate-50"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {editingPatient?.continuedTreatment?.active && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                                        {editingPatient?.continuedTreatment?.active ? "Active" : "Inactive"}
                                    </div>
                                </Button>
                            </div>

                            {editingPatient?.continuedTreatment?.active && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Next Follow-up Date</label>
                                        <Input
                                            type="date"
                                            value={editingPatient.continuedTreatment.nextFollowUpDate && !isNaN(new Date(editingPatient.continuedTreatment.nextFollowUpDate).getTime())
                                                ? new Date(editingPatient.continuedTreatment.nextFollowUpDate).toISOString().split('T')[0]
                                                : ""}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPatient((prev: Patient | null) => {
                                                if (!prev) return null;
                                                return {
                                                    ...prev,
                                                    continuedTreatment: {
                                                        ...prev.continuedTreatment!,
                                                        nextFollowUpDate: e.target.value
                                                    }
                                                }
                                            })}
                                            className="h-12 rounded-2xl bg-white border-slate-100"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Follow-up Clinical Notes</label>
                                        <Textarea
                                            value={editingPatient.continuedTreatment.notes || ""}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingPatient((prev: Patient | null) => {
                                                if (!prev) return null;
                                                return {
                                                    ...prev,
                                                    continuedTreatment: {
                                                        ...prev.continuedTreatment!,
                                                        notes: e.target.value
                                                    }
                                                }
                                            })}
                                            className="min-h-[80px] rounded-2xl bg-white border-slate-100 p-4"
                                            placeholder="e.g., Scaling and root planing needed..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="pt-4 flex gap-3">
                            <Button
                                onClick={() => setEditingPatient(null)}
                                variant="ghost"
                                className="flex-1 h-12 rounded-2xl font-bold text-slate-500"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdatePatient}
                                disabled={isSaving}
                                className="flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xl shadow-slate-200"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Patient Dialog */}
            <Dialog open={showAddPatient} onOpenChange={setShowAddPatient}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
                    <div className="bg-blue-600 p-8 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Add New Patient</DialogTitle>
                        </DialogHeader>
                        <p className="text-blue-100 text-sm opacity-80 mt-1">Create a new clinical record manually.</p>
                    </div>
                    <div className="p-8 space-y-4 bg-white">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <Input
                                value={newPatient.name}
                                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                                className="h-12 rounded-2xl bg-slate-50 border-slate-100"
                                placeholder="Patient Full Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NRIC / IC Number</label>
                            <Input
                                value={newPatient.ic}
                                onChange={(e) => setNewPatient({ ...newPatient, ic: e.target.value })}
                                className="h-12 rounded-2xl bg-slate-50 border-slate-100"
                                placeholder="e.g. 900101-01-1234"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                            <Input
                                value={newPatient.phone}
                                onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                                className="h-12 rounded-2xl bg-slate-50 border-slate-100"
                                placeholder="e.g. 0123456789"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest ml-1">Medical Alerts / Allergies</label>
                            <Input
                                value={newPatient.medicalAlerts}
                                onChange={(e) => setNewPatient({ ...newPatient, medicalAlerts: e.target.value })}
                                className="h-12 rounded-2xl bg-orange-50 border-orange-100 focus:ring-4 focus:ring-orange-100 text-orange-900 placeholder:text-orange-200"
                                placeholder="e.g. Hypertension, No allergies..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email (Optional)</label>
                            <Input
                                value={newPatient.email}
                                onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                                className="h-12 rounded-2xl bg-slate-50 border-slate-100"
                                placeholder="patient@example.com"
                            />
                        </div>
                        <div className="pt-4 flex gap-3">
                            <Button onClick={() => setShowAddPatient(false)} variant="ghost" className="flex-1 h-12 rounded-2xl font-bold text-slate-500">Cancel</Button>
                            <Button onClick={handleAddPatient} disabled={isSaving} className="flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xl shadow-slate-200">
                                {isSaving ? "Adding..." : "Add Patient"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Bulk Import Dialog */}
            <Dialog open={showBulkImport} onOpenChange={setShowBulkImport}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
                    <div className="bg-slate-900 p-8 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold italic">Bulk Patient Import</DialogTitle>
                        </DialogHeader>
                        <p className="text-slate-400 text-sm mt-1">Paste your patient list below (CSV format).</p>
                    </div>
                    <div className="p-8 space-y-6 bg-white">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CSV Data (Format: Name, IC, Phone, Email)</label>
                            <Textarea
                                value={bulkData}
                                onChange={(e) => setBulkData(e.target.value)}
                                className="min-h-[250px] rounded-2xl bg-slate-50 border-slate-100 p-4 font-mono text-xs"
                                placeholder="John Doe, 900101-01-1234, 0123456789, john@email.com&#10;Jane Smith, 910202-02-5678, 0198765432, jane@email.com"
                            />
                            <p className="text-[10px] text-slate-400 italic mt-2">Separate each patient with a new line. Name and IC are required.</p>
                        </div>
                        <div className="pt-2 flex gap-3">
                            <Button onClick={() => setShowBulkImport(false)} variant="ghost" className="flex-1 h-12 rounded-2xl font-bold text-slate-500">Cancel</Button>
                            <Button onClick={handleBulkImport} disabled={isSaving || !bulkData.trim()} className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xl shadow-blue-100">
                                {isSaving ? "Processing Import..." : "Import Patients"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!patientToDelete} onOpenChange={(open: boolean) => !open && setPatientToDelete(null)}>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
                    <div className="bg-rose-600 p-8 text-white flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-white" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-white">Delete Patient?</DialogTitle>
                        </DialogHeader>
                        <p className="text-rose-100 text-sm mt-2">
                            This action cannot be undone. All clinical records for <strong>{patientToDelete?.name}</strong> will be permanently removed.
                        </p>
                    </div>
                    <div className="p-8 bg-white flex gap-3">
                        <Button
                            onClick={() => setPatientToDelete(null)}
                            variant="ghost"
                            className="flex-1 h-12 rounded-2xl font-bold text-slate-500"
                        >
                            Keep Record
                        </Button>
                        <Button
                            onClick={handleDeletePatient}
                            disabled={isSaving}
                            className="flex-1 h-12 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-xl shadow-rose-200"
                        >
                            {isSaving ? "Deleting..." : "Confirm Delete"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

