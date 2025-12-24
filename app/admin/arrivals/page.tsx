"use client"

import { useState, useEffect } from "react"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getDoctorsAsync, getAppointmentsAsync, updateAppointmentStatusAsync } from "@/lib/storage"
import type { Doctor, Appointment } from "@/lib/types"
import {
    Clock,
    CheckCircle2,
    Calendar,
    MapPin,
    UserMinus,
    AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function ArrivalsPage() {
    const { admin, isLoading } = useAdminAuth()
    const { toast } = useToast()
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [isDataLoading, setIsDataLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [selectedDate])

    const loadData = async () => {
        const [docs, apts] = await Promise.all([
            getDoctorsAsync(),
            getAppointmentsAsync()
        ])
        setDoctors(docs)
        setAppointments(apts)
        setIsDataLoading(false)
    }

    const handleStatusUpdate = async (appointmentId: string, status: Appointment['status']) => {
        try {
            // Pass the current admin user as the manager of this action
            const managerOfAction = {
                id: admin?.id || 'unknown',
                name: admin?.username || 'System',
                role: admin?.role || 'admin'
            }

            await updateAppointmentStatusAsync(appointmentId, status, managerOfAction)
            toast({
                title: status === 'arrived' ? "Patient Checked In" : "Status Updated",
                description: status === 'arrived' ? "Patient has been marked as arrived." : `Patient marked as ${status}.`
            })
            loadData()
        } catch (e) {
            toast({ title: "Failed to update", variant: "destructive" })
        }
    }

    if (isLoading || isDataLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50/50 min-h-screen">
                <LoadingScreen message="Loading Arrivals..." />
            </div>
        )
    }

    // Filter appointments for the selected date
    const todaysAppointments = appointments.filter(a => a.appointmentDate === selectedDate)

    // Group by status context
    const expectedArrivals = todaysAppointments.filter(a => a.status === 'confirmed')
    const checkedIn = todaysAppointments.filter(a => a.status === 'arrived')
    const completedOrNoShow = todaysAppointments.filter(a => ['completed', 'no-show', 'cancelled'].includes(a.status || ''))

    return (
        <div className="flex-1 bg-slate-50/50 flex flex-col h-screen overflow-hidden text-slate-900">
            <header className="bg-white border-b border-slate-100 px-8 py-6 shrink-0 z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-sans font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            Patient Arrivals
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">
                            Manage patient check-ins for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto space-y-12">

                    {/* Expected Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-8 bg-blue-500 rounded-full" />
                                Expected Arrivals
                            </h2>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700 font-bold px-3 py-1">
                                {expectedArrivals.length} PENDING
                            </Badge>
                        </div>

                        {expectedArrivals.length === 0 ? (
                            <div className="bg-white rounded-[2rem] border border-dashed border-slate-200 p-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900">No pending arrivals</h3>
                                <p className="text-slate-500">All scheduled patients have been processed.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Time</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patient Details</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Doctor</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {expectedArrivals.map(apt => {
                                            const doc = doctors.find(d => d.id === apt.doctorId)
                                            return (
                                                <tr key={apt.id} className="hover:bg-slate-50/40 transition-colors group">
                                                    <td className="px-8 py-6 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4 text-blue-500" />
                                                            <span className="text-lg font-black text-slate-700">{apt.timeSlot.split(' - ')[0]}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 shrink-0">
                                                                {apt.patientName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-bold text-slate-900">{apt.patientName}</p>
                                                                    <Badge variant="outline" className="border-slate-200 text-slate-400 text-[9px] font-black uppercase tracking-widest h-5">
                                                                        {apt.patientType}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">{apt.patientIC}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="w-8 h-8 rounded-lg">
                                                                <AvatarImage src={doc?.photo} />
                                                                <AvatarFallback>{doc?.name.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-slate-900 truncate">{doc?.name}</p>
                                                                <p className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-wider">{doc?.specialization}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => handleStatusUpdate(apt.id, 'no-show')}
                                                                className="h-10 px-4 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 font-bold"
                                                            >
                                                                No Show
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleStatusUpdate(apt.id, 'arrived')}
                                                                className="h-10 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-100 transition-all hover:scale-105 active:scale-95"
                                                            >
                                                                <MapPin className="w-4 h-4 mr-2" />
                                                                Check In
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Checked In Section */}
                    {checkedIn.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-8 bg-emerald-500 rounded-full" />
                                Checked In (Waiting)
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {checkedIn.map(apt => {
                                    const doc = doctors.find(d => d.id === apt.doctorId)
                                    return (
                                        <Card key={apt.id} className="border border-emerald-100 bg-emerald-50/30 rounded-[2rem] overflow-hidden">
                                            <CardContent className="p-6">
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                        <CheckCircle2 className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-900 truncate">{apt.patientName}</p>
                                                        <p className="text-xs text-slate-500">Waiting for {doc?.name.split(' ').slice(-1)[0]}</p>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center text-xs font-medium text-slate-500">
                                                    <span className="bg-white px-2 py-1 rounded-md shadow-sm">{apt.timeSlot}</span>
                                                    <Button variant="link" size="sm" className="h-auto p-0 text-emerald-600" onClick={() => handleStatusUpdate(apt.id, 'completed')}>
                                                        Mark Done
                                                    </Button>
                                                </div>
                                                {apt.managedBy && (
                                                    <div className="mt-3 pt-3 border-t border-emerald-200/50">
                                                        <p className="text-[9px] text-emerald-700 italic flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Checked in by {apt.managedBy.name}
                                                        </p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    )
}
