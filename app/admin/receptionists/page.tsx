"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getReceptionists, addReceptionist, updateReceptionist, deleteReceptionist } from "@/lib/storage"
import type { Receptionist } from "@/lib/types"
import {
    UserCog,
    Plus,
    Phone,
    Mail,
    Trash2,
    Activity,
    Clock,
    UserCircle,
    MoreVertical
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

export default function ReceptionistsPage() {
    const { isLoading } = useAdminAuth()
    const { toast } = useToast()
    const [receptionists, setReceptionists] = useState<Receptionist[]>([])
    const [isAddOpen, setIsAddOpen] = useState(false)

    // Form state
    const [name, setName] = useState("")
    const [photo, setPhoto] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [shift, setShift] = useState<Receptionist["shift"]>("full-day")

    useEffect(() => {
        setReceptionists(getReceptionists())
    }, [])

    const handleAdd = () => {
        if (!name || !phone || !email) return
        addReceptionist({
            name,
            photo: photo || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200", // Default if empty
            phone,
            email,
            shift,
            isActive: true
        })
        setReceptionists(getReceptionists())
        setIsAddOpen(false)
        resetForm()
        toast({ title: "Receptionist added successfully" })
    }

    const handleDelete = (id: string) => {
        deleteReceptionist(id)
        setReceptionists(getReceptionists())
        toast({ title: "Receptionist removed" })
    }

    const toggleStatus = (rec: Receptionist) => {
        updateReceptionist(rec.id, { isActive: !rec.isActive })
        setReceptionists(getReceptionists())
    }

    const resetForm = () => {
        setName("")
        setPhoto("")
        setPhone("")
        setEmail("")
        setShift("full-day")
    }

    if (isLoading) return null

    return (
        <div className="flex-1 bg-slate-50/50">
            <main className="container mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-sans font-bold text-slate-900 tracking-tight">Receptionists</h1>
                        <p className="text-slate-500 mt-1">Manage front desk staff and shifts.</p>
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xl shadow-slate-200 gap-2 group">
                                <Plus className="w-5 h-5" />
                                Hire Receptionist
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">New Receptionist</DialogTitle>
                                <DialogDescription>Enter the details for the new front-desk staff member.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="photo" className="text-xs font-black uppercase tracking-widest text-slate-400">Avatar URL</Label>
                                    <Input id="photo" value={photo} onChange={(e) => setPhoto(e.target.value)} className="h-12 rounded-xl" placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-400">Full Name</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" placeholder="Alice Wong" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-slate-400">Phone</Label>
                                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-xl" placeholder="+65 9XXX XXXX" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400">Email</Label>
                                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" placeholder="alice@clinic.com" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shift" className="text-xs font-black uppercase tracking-widest text-slate-400">Shift Type</Label>
                                    <Select value={shift} onValueChange={(v: Receptionist["shift"]) => setShift(v)}>
                                        <SelectTrigger className="h-12 rounded-xl">
                                            <SelectValue placeholder="Select shift" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-none shadow-xl">
                                            <SelectItem value="morning">Morning (9AM - 1PM)</SelectItem>
                                            <SelectItem value="afternoon">Afternoon (1PM - 6PM)</SelectItem>
                                            <SelectItem value="full-day">Full Day (9AM - 6PM)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAdd} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Add Staff</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {receptionists.map((rec) => (
                        <Card key={rec.id} className="border-none shadow-sm rounded-[2rem] overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <Avatar className="w-16 h-16 rounded-2xl shadow-md border-4 border-slate-50 group-hover:scale-110 transition-transform">
                                        <AvatarImage src={rec.photo} className="object-cover" />
                                        <AvatarFallback className="bg-slate-900 text-white font-bold text-xl">
                                            {rec.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${rec.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {rec.isActive ? 'Active' : 'Inactive'}
                                    </div>
                                </div>

                                <div className="space-y-1 mb-8">
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">{rec.name}</h3>
                                    <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-widest">
                                        <Clock className="w-3 h-3" />
                                        {rec.shift.replace('-', ' ')}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium">{rec.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium truncate">{rec.email}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        className="flex-1 h-12 rounded-xl border-slate-100 hover:bg-slate-50 gap-2 font-bold"
                                        onClick={() => toggleStatus(rec)}
                                    >
                                        <Activity className="w-4 h-4" />
                                        {rec.isActive ? "Deactivate" : "Activate"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-12 h-12 rounded-xl border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all p-0"
                                        onClick={() => handleDelete(rec.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {receptionists.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                            <UserCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-400">No Receptionists Found</h3>
                            <p className="text-slate-400 max-w-xs mx-auto mt-2">Hire your first staff member to start managing operations.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
