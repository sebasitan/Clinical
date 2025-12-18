"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getDoctors, addDoctor, updateDoctor, deleteDoctor, getAppointments } from "@/lib/storage"
import type { Doctor } from "@/lib/types"
import { Plus, Edit, Trash2, Users, Stethoscope, Phone, Mail, MoreHorizontal, UserPlus, Search, TrendingUp, ShieldCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"

export default function DoctorsPage() {
    const { isLoading } = useAdminAuth()
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [appointments, setAppointments] = useState<any[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [formData, setFormData] = useState({
        name: "",
        specialization: "",
        phone: "",
        email: "",
        isActive: true,
        isAvailable: true,
        slotDuration: 30 as 15 | 20 | 30
    })
    const { toast } = useToast()

    useEffect(() => {
        loadData()
    }, [])

    const loadData = () => {
        setDoctors(getDoctors())
        setAppointments(getAppointments())
    }

    const handleOpenDialog = (doctor?: Doctor) => {
        if (doctor) {
            setEditingDoctor(doctor)
            setFormData({
                name: doctor.name,
                specialization: doctor.specialization,
                phone: doctor.phone,
                email: doctor.email,
                isActive: doctor.isActive,
                isAvailable: doctor.isAvailable,
                slotDuration: doctor.slotDuration
            })
        } else {
            setEditingDoctor(null)
            setFormData({
                name: "",
                specialization: "",
                phone: "",
                email: "",
                isActive: true,
                isAvailable: true,
                slotDuration: 30
            })
        }
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setEditingDoctor(null)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.specialization || !formData.phone || !formData.email) {
            toast({
                title: "Missing information",
                description: "Please fill in all mandatory fields",
                variant: "destructive",
            })
            return
        }

        if (editingDoctor) {
            updateDoctor(editingDoctor.id, formData)
            toast({
                title: "Profile Updated",
                description: `Information for ${formData.name} has been synchronized.`,
            })
        } else {
            addDoctor(formData)
            toast({
                title: "Doctor Added",
                description: "New medical doctor has been registered in the system.",
            })
        }

        loadData()
        handleCloseDialog()
    }

    const toggleStatus = (doctor: Doctor) => {
        updateDoctor(doctor.id, { isActive: !doctor.isActive })
        toast({ title: doctor.isActive ? "Provider Disabled" : "Provider Activated" })
        loadData()
    }

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to remove this medical doctor? This action is permanent.")) {
            if (deleteDoctor(id)) {
                loadData()
                toast({
                    title: "Doctor Removed",
                    description: "Record has been successfully deleted from your database.",
                    variant: "destructive"
                })
            }
        }
    }

    const filteredDoctors = doctors.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (isLoading) return null

    return (
        <div className="flex-1 bg-slate-50/50">
            <main className="container mx-auto px-6 py-10">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-sans font-bold text-slate-900 tracking-tight">Doctors Directory</h1>
                        <p className="text-slate-500 mt-1">Manage credentials and clinical status of medical doctors.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group max-w-xs">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <Input
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-12 pl-11 rounded-2xl bg-white border-slate-100 shadow-sm focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                            />
                        </div>
                        <Button onClick={() => handleOpenDialog()} className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 gap-2">
                            <UserPlus className="w-4 h-4" />
                            Add Provider
                        </Button>
                    </div>
                </div>

                <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        {filteredDoctors.length === 0 ? (
                            <div className="text-center py-24 opacity-40">
                                <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                                <p className="text-xl font-bold text-slate-900">No Doctors Found</p>
                                <p className="text-slate-500">Try adjusting your search criteria or register a new doctor.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-slate-50 hover:bg-transparent">
                                        <TableHead className="h-16 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Medical Doctor</TableHead>
                                        <TableHead className="h-16 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Clinical Data</TableHead>
                                        <TableHead className="h-16 px-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</TableHead>
                                        <TableHead className="h-16 px-8 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDoctors.map((doctor) => {
                                        const drApps = appointments.filter(a => a.doctorId === doctor.id)
                                        return (
                                            <TableRow key={doctor.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className={`w-14 h-14 rounded-2xl shadow-sm border-2 border-white transition-all ${!doctor.isActive && 'grayscale'}`}>
                                                            <AvatarImage src={doctor.photo} className="object-cover" />
                                                            <AvatarFallback className="bg-slate-50 text-slate-900 font-bold text-lg">{doctor.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className={`font-bold text-lg ${!doctor.isActive ? 'text-slate-400' : 'text-slate-900'}`}>{doctor.name}</p>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{doctor.specialization}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-8 py-6">
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                                            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                                                            {drApps.length} Bookings
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <Switch checked={doctor.isActive} onCheckedChange={() => toggleStatus(doctor)} />
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${doctor.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                            {doctor.isActive ? 'Online' : 'Disabled'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                            className="h-10 rounded-xl hover:bg-slate-50 border-slate-200 transition-all text-slate-900 font-bold px-4"
                                                        >
                                                            <a href={`/admin/doctors/${doctor.id}`}>Manage</a>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(doctor)} className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100 transition-all text-slate-400 hover:text-blue-600">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(doctor.id)}
                                                            className="h-10 w-10 rounded-xl hover:bg-red-50 hover:shadow-md border border-transparent hover:border-red-100 transition-all text-slate-400 hover:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>

                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>

            {/* Add/Edit Doctor Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl">
                    <div className="bg-slate-900 p-8 text-white relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold font-sans">{editingDoctor ? "Update Profile" : "Add Provider"}</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Configure clinical credentials and registry status.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Practitioner Name</Label>
                            <Input
                                placeholder="Dr. Gregory House"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                className="h-12 px-4 rounded-xl bg-slate-50 border-slate-100 font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialization</Label>
                            <Input
                                placeholder="Diagnostic Medicine"
                                value={formData.specialization}
                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                required
                                className="h-12 px-4 rounded-xl bg-slate-50 border-slate-100 font-medium"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</Label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="h-12 px-4 rounded-xl bg-slate-50 border-slate-100 font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="h-12 px-4 rounded-xl bg-slate-50 border-slate-100 font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className={`w-5 h-5 ${formData.isActive ? 'text-emerald-500' : 'text-slate-300'}`} />
                                <span className="text-xs font-bold text-slate-900">Active Registry</span>
                            </div>
                            <Switch checked={formData.isActive} onCheckedChange={val => setFormData({ ...formData, isActive: val })} />
                        </div>

                        <div className="flex gap-4 pt-6">
                            <Button type="button" variant="ghost" onClick={handleCloseDialog} className="flex-1 h-12 rounded-xl text-slate-500 font-bold">
                                Discard
                            </Button>
                            <Button type="submit" className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-100">
                                {editingDoctor ? "Update" : "Register"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
