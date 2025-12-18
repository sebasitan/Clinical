"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getFacilities, addFacility, updateFacility, deleteFacility } from "@/lib/storage"
import type { Facility } from "@/lib/types"
import {
    Building2,
    Plus,
    Trash2,
    Settings2,
    CheckCircle2,
    Wrench,
    XCircle,
    Info,
    Layout
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function FacilitiesPage() {
    const { isLoading } = useAdminAuth()
    const { toast } = useToast()
    const [facilities, setFacilities] = useState<Facility[]>([])
    const [isAddOpen, setIsAddOpen] = useState(false)

    // Form state
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [status, setStatus] = useState<Facility["status"]>("operational")

    useEffect(() => {
        setFacilities(getFacilities())
    }, [])

    const handleAdd = () => {
        if (!name) return
        addFacility({
            name,
            description,
            status
        })
        setFacilities(getFacilities())
        setIsAddOpen(false)
        resetForm()
        toast({ title: "Facility added successfully" })
    }

    const handleDelete = (id: string) => {
        deleteFacility(id)
        setFacilities(getFacilities())
        toast({ title: "Facility removed" })
    }

    const updateStatus = (id: string, newStatus: Facility["status"]) => {
        updateFacility(id, { status: newStatus })
        setFacilities(getFacilities())
        toast({ title: `Status updated to ${newStatus}` })
    }

    const resetForm = () => {
        setName("")
        setDescription("")
        setStatus("operational")
    }

    const getStatusIcon = (status: Facility["status"]) => {
        switch (status) {
            case "operational": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            case "maintenance": return <Wrench className="w-4 h-4 text-amber-500" />
            case "closed": return <XCircle className="w-4 h-4 text-rose-500" />
        }
    }

    const getStatusStyle = (status: Facility["status"]) => {
        switch (status) {
            case "operational": return "bg-emerald-50 text-emerald-600 ring-emerald-100"
            case "maintenance": return "bg-amber-50 text-amber-600 ring-amber-100"
            case "closed": return "bg-rose-50 text-rose-600 ring-rose-100"
        }
    }

    if (isLoading) return null

    return (
        <div className="flex-1 bg-slate-50/50">
            <main className="container mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-sans font-bold text-slate-900 tracking-tight">Clinical Facilities</h1>
                        <p className="text-slate-500 mt-1">Manage rooms, equipment labs, and operational status.</p>
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xl shadow-slate-200 gap-2 group">
                                <Plus className="w-5 h-5" />
                                Register Facility
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">New Facility</DialogTitle>
                                <DialogDescription>Register a new room or laboratory in the system.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400">Facility Name</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" placeholder="Treatment Room 4" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="desc" className="text-xs font-black uppercase tracking-widest text-slate-400">Description</Label>
                                    <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl min-h-[100px]" placeholder="Briefly describe the facility..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-xs font-black uppercase tracking-widest text-slate-400">Initial Status</Label>
                                    <Select value={status} onValueChange={(v: Facility["status"]) => setStatus(v)}>
                                        <SelectTrigger className="h-12 rounded-xl">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            <SelectItem value="operational">Operational</SelectItem>
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAdd} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Register</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {facilities.map((fac) => (
                        <Card key={fac.id} className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden group hover:shadow-2xl transition-all duration-500">
                            <CardContent className="p-0">
                                <div className={cn("p-8", fac.status === 'operational' ? 'bg-emerald-50/30' : fac.status === 'maintenance' ? 'bg-amber-50/30' : 'bg-rose-50/30')}>
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-100">
                                            <Building2 className="w-7 h-7 text-slate-900" />
                                        </div>
                                        <div className={cn(
                                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-1",
                                            getStatusStyle(fac.status)
                                        )}>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(fac.status)}
                                                {fac.status}
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">{fac.name}</h3>
                                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">{fac.description || "No description provided."}</p>
                                </div>

                                <div className="p-8 space-y-6 bg-white">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Update Operational Status</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['operational', 'maintenance', 'closed'] as const).map((s) => (
                                                <Button
                                                    key={s}
                                                    variant="outline"
                                                    size="sm"
                                                    className={cn(
                                                        "h-9 rounded-xl border-slate-100 text-[10px] font-bold uppercase p-0",
                                                        fac.status === s ? "bg-slate-900 text-white border-slate-900" : "hover:bg-slate-50"
                                                    )}
                                                    onClick={() => updateStatus(fac.id, s)}
                                                >
                                                    {s.slice(0, 3)}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            className="h-12 w-12 rounded-xl border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all p-0 ml-auto"
                                            onClick={() => handleDelete(fac.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {facilities.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                            <Layout className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-400">No Facilities Registered</h3>
                            <p className="text-slate-400 max-w-xs mx-auto mt-2">Add your clinic's rooms and labs to oversee their status.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
