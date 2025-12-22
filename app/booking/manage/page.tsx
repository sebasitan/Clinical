"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getPatientAppointmentsAsync, updateAppointmentStatusAsync } from "@/lib/storage"
import {
    Calendar,
    Clock,
    User,
    Phone,
    Shield,
    Trash2,
    RefreshCcw,
    ChevronLeft,
    AlertCircle,
    CheckCircle2
} from "lucide-react"
import type { Appointment } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"

export default function ManageBookingPage() {
    const router = useRouter()
    const { toast } = useToast()

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [loginData, setLoginData] = useState({ ic: "", phone: "" })

    // Data State
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [cancellingId, setCancellingId] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            // Fetch appointments by IC
            const apts = await getPatientAppointmentsAsync(loginData.ic)

            // Basic verification: Check if any appointment matches the phone number
            // In a real app, you'd use OTP or distinct auth.
            // Here, we'll allow access if they have appointments AND the phone matches at least one,
            // OR if they have no appointments (fresh state). 
            // BUT for security privacy, let's enforce an exact match on at least one record if records exist.

            const matches = apts.filter(a => a.patientPhone === loginData.phone)

            if (apts.length > 0 && matches.length === 0) {
                toast({
                    title: "Verification Failed",
                    description: "The phone number does not match our records for this IC.",
                    variant: "destructive"
                })
                setIsLoading(false)
                return
            }

            // If no appointments found, we can still let them in to see "No appointments", 
            // but effectively they authenticated if they are a valid patient.
            // For this MVP, we treat IC+Phone as the key.

            setAppointments(apts)
            setIsAuthenticated(true)
            toast({ title: "Welcome back", description: "Your appointments are listed below." })
        } catch (error) {
            toast({ title: "Error", description: "Failed to verify details.", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = async () => {
        if (!cancellingId) return
        try {
            await updateAppointmentStatusAsync(cancellingId, 'cancelled')

            // Update local state
            setAppointments(prev => prev.map(a =>
                a.id === cancellingId ? { ...a, status: 'cancelled' } : a
            ))

            toast({ title: "Appointment Cancelled" })
            setCancellingId(null)
        } catch (error) {
            toast({ title: "Cancellation Failed", variant: "destructive" })
        }
    }

    const sortedAppointments = [...appointments].sort((a, b) =>
        new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    )

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-md mx-auto mb-8 text-center">
                <Button variant="ghost" className="mb-4" onClick={() => router.push("/")}>
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Button>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Bookings</h1>
                <p className="text-slate-500 mt-2 font-medium">Manage your upcoming dental visits</p>
            </div>

            <div className="max-w-3xl mx-auto">
                {!isAuthenticated ? (
                    <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                        <CardHeader className="bg-blue-600 text-white p-8">
                            <div className="w-12 h-12 bg-blue-500/30 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Secure Access</CardTitle>
                            <CardDescription className="text-blue-100 font-medium">
                                Enter your details to retrieve your appointment history.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">MyKad / IC Number</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                                        <Input
                                            required
                                            placeholder="Example: 900101-14-1234"
                                            value={loginData.ic}
                                            onChange={e => setLoginData({ ...loginData, ic: e.target.value })}
                                            className="pl-12 h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold text-slate-900 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="uppercase text-[10px] font-black text-slate-400 tracking-widest ml-1">Phone Number</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-3.5 w-5 h-5 text-slate-300" />
                                        <Input
                                            required
                                            placeholder="Example: +60123456789"
                                            value={loginData.phone}
                                            onChange={e => setLoginData({ ...loginData, phone: e.target.value })}
                                            className="pl-12 h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold text-slate-900 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-slate-200"
                                >
                                    {isLoading ? "Verifying..." : "View Appointments"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {sortedAppointments.length === 0 ? (
                            <Card className="border-none shadow-sm p-12 text-center rounded-[2.5rem]">
                                <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-500">
                                    <Calendar className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">No Appointments Found</h3>
                                <p className="text-slate-500 mt-2 mb-8 max-w-xs mx-auto">We couldn't find any bookings associated with your details.</p>
                                <Button onClick={() => router.push("/booking")} className="h-12 px-8 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100">
                                    Book New Appointment
                                </Button>
                            </Card>
                        ) : (
                            <>
                                <div className="flex justify-between items-center px-2">
                                    <p className="text-slate-500 font-bold text-sm">Found {sortedAppointments.length} Record(s)</p>
                                    <Button size="sm" variant="outline" onClick={() => { setIsAuthenticated(false); setLoginData({ ic: "", phone: "" }); }} className="rounded-xl h-9 text-xs font-bold">
                                        Log Out
                                    </Button>
                                </div>

                                {sortedAppointments.map(apt => (
                                    <Card key={apt.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden group">
                                        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                            <div className="flex items-start gap-5">
                                                <div className={`
                                                    w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border
                                                    ${apt.status === 'confirmed' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                                                        apt.status === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                                            'bg-slate-50 border-slate-100 text-slate-400'}
                                                `}>
                                                    <span className="text-[10px] font-black uppercase tracking-widest mb-1">
                                                        {new Date(apt.appointmentDate).toLocaleString('default', { month: 'short' })}
                                                    </span>
                                                    <span className="text-xl font-black">
                                                        {new Date(apt.appointmentDate).getDate()}
                                                    </span>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge className={`
                                                            text-[9px] font-black uppercase tracking-widest border-none px-2 py-0.5
                                                            ${apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                                apt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                                    apt.status === 'arrived' ? 'bg-purple-100 text-purple-700' :
                                                                        'bg-slate-100 text-slate-500'}
                                                        `}>
                                                            {apt.status}
                                                        </Badge>
                                                        <span className="text-xs font-bold text-slate-400">#{apt.id.slice(-6)}</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-slate-900 mb-1">{apt.timeSlot}</h3>
                                                    <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                                                        <User className="w-3.5 h-3.5" />
                                                        Doctor Appointment
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {apt.status === 'cancelled' && (
                                                    <Button onClick={() => router.push("/booking")} className="bg-slate-900 text-white rounded-xl font-bold h-10 px-5 w-full sm:w-auto">
                                                        <RefreshCcw className="w-4 h-4 mr-2" />
                                                        Book Again
                                                    </Button>
                                                )}

                                                {['confirmed'].includes(apt.status) && (
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setCancellingId(apt.id)}
                                                                className="border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-700 rounded-xl font-bold h-10 px-5 w-full sm:w-auto"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Cancel
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden max-w-sm">
                                                            <div className="bg-rose-50 p-8 flex flex-col items-center text-center">
                                                                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                                                                    <AlertCircle className="w-8 h-8" />
                                                                </div>
                                                                <DialogTitle className="text-xl font-black text-rose-900">Cancel Appointment?</DialogTitle>
                                                                <DialogDescription className="text-rose-600/80 font-medium mt-2">
                                                                    This action cannot be undone. You will lose your slot for {apt.appointmentDate} at {apt.timeSlot}.
                                                                </DialogDescription>
                                                            </div>
                                                            <div className="p-6 bg-white space-y-3">
                                                                <Button
                                                                    className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-100"
                                                                    onClick={handleCancel}
                                                                >
                                                                    Yes, Cancel It
                                                                </Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
