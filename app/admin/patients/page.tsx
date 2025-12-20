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
import { getPatientsAsync, getAppointmentsAsync, getDoctorsAsync } from "@/lib/storage"
import { formatDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import type { Patient, Appointment, Doctor } from "@/lib/types"
import { Search, UserSearch, History, Mail, Phone, ExternalLink, Activity, Calendar, Edit3 } from "lucide-react"

export default function PatientsPage() {
    const { isLoading } = useAdminAuth()
    const [patients, setPatients] = useState<Patient[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [showBulkImport, setShowBulkImport] = useState(false)
    const [showAddPatient, setShowAddPatient] = useState(false)
    const [bulkData, setBulkData] = useState("")
    const [newPatient, setNewPatient] = useState<Partial<Patient>>({
        name: "",
        ic: "",
        phone: "",
        email: "",
        type: "existing"
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const [pts, apts, docs] = await Promise.all([
            getPatientsAsync(),
            getAppointmentsAsync(),
            getDoctorsAsync()
        ])
        setPatients(pts.filter((p: Patient) => p.name))
        setAppointments(apts)
        setDoctors(docs)
        setIsDataLoading(false)
    }

    const filteredPatients = patients.filter((p: Patient) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone?.includes(searchQuery)
    )

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
                setNewPatient({ name: "", ic: "", phone: "", email: "", type: "existing" });
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
                        <Button
                            onClick={() => setShowAddPatient(true)}
                            className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-200 gap-2"
                        >
                            <UserSearch className="w-5 h-5" />
                            Add Patient
                        </Button>
                        <Button
                            onClick={() => setShowBulkImport(true)}
                            variant="outline"
                            className="h-12 px-6 rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-600 font-bold transition-all gap-2"
                        >
                            <Search className="w-5 h-5" />
                            Bulk Import
                        </Button>
                        <div className="relative group max-w-sm w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
                            <Input
                                placeholder="Search by name, IC, or phone..."
                                value={searchQuery}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
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
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-slate-50">
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Identification</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Care Status</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Last Clinical Visit</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Registry Type</TableHead>
                                        <TableHead className="px-8 h-16 text-right text-[10px] font-black uppercase text-slate-400">Operations</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPatients.map((patient: Patient) => (
                                        <TableRow key={patient.id} className="border-slate-50 hover:bg-slate-50/50 group transition-colors">
                                            <TableCell className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-lg">{patient.name}</span>
                                                    <span className="text-xs font-medium text-slate-400">NRIC: {patient.ic}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-6">
                                                <div className="flex items-center gap-2">
                                                    {patient.continuedTreatment?.active ? (
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                                            <span className="text-[10px] font-black uppercase">Care Active</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-slate-300 uppercase">Registry Only</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-8 py-6 text-sm font-medium text-slate-600">
                                                {patient.lastVisit ? formatDate(patient.lastVisit) : "No visit logged"}
                                            </TableCell>
                                            <TableCell className="px-8 py-6">
                                                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${patient.type === 'new' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {patient.type} Profile
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-8 py-6 text-right flex justify-end gap-2">
                                                <Button
                                                    onClick={() => setEditingPatient(patient)}
                                                    variant="ghost"
                                                    className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </Button>
                                                <Button onClick={() => setSelectedPatient(patient)} variant="ghost" className="h-10 rounded-xl px-4 text-xs font-bold gap-2 text-slate-500 hover:text-blue-600 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all">
                                                    <History className="w-4 h-4" />
                                                    Medical Timeline
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>

            <Dialog open={!!selectedPatient} onOpenChange={(open: boolean) => !open && setSelectedPatient(null)}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
                    <div className="bg-slate-900 p-10 text-white relative">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold mb-2 italic">Clinical Timeline</DialogTitle>
                        </DialogHeader>
                        <p className="text-slate-400 text-sm">Full visit history for {selectedPatient?.name}</p>
                    </div>
                    <div className="p-8 max-h-[500px] overflow-y-auto no-scrollbar bg-white">
                        {patientHistory.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 italic">No historical data available.</div>
                        ) : (
                            <div className="space-y-6">
                                {patientHistory.map((apt: Appointment, i: number) => (
                                    <div key={i} className="flex gap-6 relative">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                                {new Date(apt.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}
                                            </div>
                                            <div className="text-lg font-black text-slate-900">
                                                {new Date(apt.appointmentDate).getDate()}
                                            </div>
                                            {i < patientHistory.length - 1 && <div className="w-0.5 h-full bg-slate-100 mt-2" />}
                                        </div>
                                        <div className="flex-1 pb-10">
                                            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 group-hover:border-blue-100 transition-colors">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-lg">{apt.status === 'completed' ? 'Clinical Visit' : 'Scheduled Appointment'}</h4>
                                                        <p className="text-xs text-slate-500 font-medium">Doctor: {doctors.find((d: Doctor) => d.id === apt.doctorId)?.name || 'Clinic'}</p>
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${apt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                        apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {apt.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
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
                                    <span className="text-sm font-bold text-slate-900">Continued Treatment</span>
                                    <span className="text-[10px] text-slate-400 uppercase font-black">Mark for clinical follow-up</span>
                                </div>
                                <Button
                                    type="button"
                                    variant={editingPatient?.continuedTreatment?.active ? "default" : "outline"}
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
                                    className="rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-widest"
                                >
                                    {editingPatient?.continuedTreatment?.active ? "Active" : "Inactive"}
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
        </div>
    )
}

