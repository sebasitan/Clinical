"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getPatientsAsync, getAppointmentsAsync, getDoctorsAsync } from "@/lib/storage"
import { formatDate } from "@/lib/date-utils"
import type { Patient, Appointment, Doctor } from "@/lib/types"
import { Search, UserSearch, History, Mail, Phone, ExternalLink, Activity, Calendar } from "lucide-react"

export default function PatientsPage() {
    const { isLoading } = useAdminAuth()
    const [patients, setPatients] = useState<Patient[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        const [pts, apts, docs] = await Promise.all([
            getPatientsAsync(),
            getAppointmentsAsync(),
            getDoctorsAsync()
        ])
        setPatients(pts)
        setAppointments(apts)
        setDoctors(docs)
    }

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.ic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery)
    )

    const patientHistory = selectedPatient
        ? appointments.filter(a => a.patientIC === selectedPatient.ic).sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
        : []

    if (isLoading) return null

    return (
        <div className="flex-1 bg-slate-50/50">
            <main className="container mx-auto px-6 py-10">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-sans font-bold text-slate-900 tracking-tight">Patient Registry</h1>
                        <p className="text-slate-500 mt-1">Cross-reference clinical records and visit history.</p>
                    </div>
                    <div className="relative group max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
                        <Input
                            placeholder="Search by name, IC, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 pl-12 rounded-2xl bg-white border-slate-100 shadow-sm transition-all focus:ring-4 focus:ring-blue-100 font-medium"
                        />
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
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Last Clinical Visit</TableHead>
                                        <TableHead className="px-8 h-16 text-[10px] font-black uppercase text-slate-400">Registry Type</TableHead>
                                        <TableHead className="px-8 h-16 text-right text-[10px] font-black uppercase text-slate-400">Operations</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPatients.map(patient => (
                                        <TableRow key={patient.id} className="border-slate-50 hover:bg-slate-50/50 group transition-colors">
                                            <TableCell className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 text-lg">{patient.name}</span>
                                                    <span className="text-xs font-medium text-slate-400">NRIC: {patient.ic}</span>
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
                                            <TableCell className="px-8 py-6 text-right">
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

            <Dialog open={!!selectedPatient} onOpenChange={(open) => !open && setSelectedPatient(null)}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
                    <div className="bg-slate-900 p-10 text-white relative">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <h3 className="text-2xl font-bold mb-2 italic">Clinical Timeline</h3>
                        <p className="text-slate-400 text-sm">Full visit history for {selectedPatient?.name}</p>
                    </div>
                    <div className="p-8 max-h-[500px] overflow-y-auto no-scrollbar bg-white">
                        {patientHistory.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 italic">No historical data available.</div>
                        ) : (
                            <div className="space-y-6">
                                {patientHistory.map((apt, i) => {
                                    const doctor = doctors.find(d => d.id === apt.doctorId);
                                    return (
                                        <div key={apt.id} className="flex gap-6 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-3 h-3 rounded-full bg-blue-600 shadow-[0_0_0_4px_rgba(37,99,235,0.1)] shrink-0" />
                                                {i < patientHistory.length - 1 && <div className="w-px h-full bg-slate-100 mt-2" />}
                                            </div>
                                            <div className="flex-1 pb-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-black text-slate-900">{formatDate(apt.appointmentDate)}</span>
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${apt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                                        apt.status === 'cancelled' ? 'bg-rose-100 text-rose-600' : 'bg-amber-50 text-amber-600'
                                                        }`}>
                                                        {apt.status}
                                                    </span>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm">
                                                            {doctor?.photo ? (
                                                                <img src={doctor.photo} alt={doctor.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <History className="w-5 h-5 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-black text-slate-900 leading-tight">Consultation with {doctor?.name || "Unassigned Provider"}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">{apt.timeSlot}</span>
                                                                <span className="text-slate-200">|</span>
                                                                <span className="text-[10px] text-blue-500 font-bold tracking-tight">{doctor?.specialization || "General Dentistry"}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
