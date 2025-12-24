"use client"

import { useState, useEffect } from "react"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getReceptionistsAsync, addReceptionistAsync, updateReceptionistAsync, deleteReceptionistAsync } from "@/lib/storage"
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
    Camera,
    Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
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
    const { isLoading: authLoading } = useAdminAuth()
    const { toast } = useToast()
    const [receptionists, setReceptionists] = useState<Receptionist[]>([])
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [isDataLoading, setIsDataLoading] = useState(true)

    // Form state
    const [name, setName] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [photo, setPhoto] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [shift, setShift] = useState<Receptionist["shift"]>("full-day")

    // Password Reset
    const [resetId, setResetId] = useState<string | null>(null)

    const loadData = async () => {
        const data = await getReceptionistsAsync()
        setReceptionists(data)
        setIsDataLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.url) {
                setPhoto(data.url);
                toast({ title: "Photo uploaded" });
            }
        } catch (error) {
            toast({ title: "Upload failed", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleAdd = async () => {
        if (!name || !username || !password || !phone || !email) {
            toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" })
            return
        }

        setIsSubmitting(true)
        try {
            await addReceptionistAsync({
                name,
                username,
                password,
                photo: photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
                phone,
                email,
                shift,
                isActive: true
            })
            await loadData()
            setIsAddOpen(false)
            resetForm()
            toast({ title: "Success", description: "Receptionist added successfully" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to add receptionist", variant: "destructive" })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this staff member?")) return

        try {
            await deleteReceptionistAsync(id)
            await loadData()
            toast({ title: "Receptionist removed" })
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove staff", variant: "destructive" })
        }
    }

    const handleResetPassword = async () => {
        if (!resetId) return
        try {
            const res = await fetch(`/api/receptionists/${resetId}/reset-password`, { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                toast({ title: "Password Reset", description: `New Password: ${data.password}` })
                setResetId(null)
            } else {
                toast({ title: "Error", description: "Failed to reset password", variant: "destructive" })
            }
        } catch (e) {
            toast({ title: "Error", description: "Connection failed", variant: "destructive" })
        }
    }

    const toggleStatus = async (rec: Receptionist) => {
        try {
            await updateReceptionistAsync(rec.id, { isActive: !rec.isActive })
            await loadData()
            toast({ title: `Staff ${rec.isActive ? 'deactivated' : 'activated'}` })
        } catch (error) {
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" })
        }
    }

    const resetForm = () => {
        setName("")
        setUsername("")
        setPassword("")
        setPhoto("")
        setPhone("")
        setEmail("")
        setShift("full-day")
    }

    if (authLoading || isDataLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50/50 min-h-screen">
                <LoadingScreen message="Loading Staff Directory..." />
            </div>
        )
    }

    return (
        <div className="flex-1 bg-slate-50/50">
            <main className="container mx-auto px-6 py-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-sans font-bold text-slate-900 tracking-tight">Receptionists</h1>
                        <p className="text-slate-500 mt-1">Manage front desk staff, shift schedules, and credentials.</p>
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xl shadow-slate-200 gap-2 group">
                                <Plus className="w-5 h-5" />
                                Add Receptionist
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
                            <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold text-white">New Receptionist</DialogTitle>
                                    <DialogDescription className="text-slate-400">Add a new member to your front-desk team.</DialogDescription>
                                </DialogHeader>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* Photo Upload */}
                                <div className="flex justify-center -mt-16 relative z-10">
                                    <div className="relative group">
                                        <Avatar className="w-24 h-24 rounded-3xl border-4 border-white shadow-xl bg-slate-100">
                                            <AvatarImage src={photo} className="object-cover" />
                                            <AvatarFallback className="bg-slate-100 text-slate-400">
                                                {name ? name.charAt(0) : <UserCircle className="w-10 h-10" />}
                                            </AvatarFallback>
                                        </Avatar>
                                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-3xl opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                                            {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                                            <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                                        </label>
                                    </div>
                                </div>

                                <div className="grid gap-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</Label>
                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all px-4" placeholder="Alice Wong" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Username</Label>
                                            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 px-4" placeholder="alice.w" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Password</Label>
                                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 px-4" placeholder="••••••" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Phone</Label>
                                            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 px-4" placeholder="+60 1x-xxx xxxx" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email</Label>
                                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl bg-slate-50 border-slate-100 px-4" placeholder="staff@clinic.com" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="shift" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Shift Selection</Label>
                                        <Select value={shift} onValueChange={(v: Receptionist["shift"]) => setShift(v)}>
                                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 px-4 focus:ring-0">
                                                <SelectValue placeholder="Select shift" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl p-2 z-[1001]">
                                                <SelectItem value="morning" className="rounded-xl h-12">Morning (9AM - 1PM)</SelectItem>
                                                <SelectItem value="afternoon" className="rounded-xl h-12">Afternoon (1PM - 6PM)</SelectItem>
                                                <SelectItem value="full-day" className="rounded-xl h-12">Full Day (9AM - 6PM)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <DialogFooter className="pt-4">
                                    <Button
                                        onClick={handleAdd}
                                        disabled={isSubmitting}
                                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-200"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            "Confirm & Save Staff"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {receptionists.map((rec) => (
                        <Card key={rec.id} className="border-none shadow-sm rounded-[2.5rem] overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 bg-white">
                            <CardContent className="p-0">
                                <div className="p-8">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="relative">
                                            <Avatar className="w-20 h-20 rounded-[2rem] shadow-xl border-4 border-white transition-all duration-500 group-hover:scale-105">
                                                <AvatarImage src={rec.photo} className="object-cover" />
                                                <AvatarFallback className="bg-slate-900 text-white font-bold text-2xl">
                                                    {rec.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white",
                                                rec.isActive ? "bg-emerald-500" : "bg-slate-300"
                                            )} />
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${rec.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {rec.isActive ? 'On Duty' : 'Off Duty'}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-8">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight transition-colors group-hover:text-blue-600">{rec.name}</h3>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                                <UserCircle className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                                {rec.username}
                                            </span>
                                            <span className="text-slate-300">|</span>
                                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                                {rec.shift.replace('-', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-10">
                                        <div className="flex items-center gap-4 text-slate-500 p-1">
                                            <Phone className="w-4 h-4 text-slate-300" />
                                            <span className="text-sm font-bold tracking-tight">{rec.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-slate-500 p-1">
                                            <Mail className="w-4 h-4 text-slate-300" />
                                            <span className="text-sm font-bold tracking-tight truncate">{rec.email}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button
                                            variant="outline"
                                            className="flex-1 h-14 rounded-2xl border-slate-100 hover:bg-slate-50 hover:text-slate-900 text-slate-500 font-bold"
                                            onClick={() => setResetId(rec.id)}
                                        >
                                            Reset Password
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-14 h-14 rounded-2xl border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all p-0 shadow-sm"
                                            onClick={() => handleDelete(rec.id)}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </div>
                                    <div className="mt-4">
                                        <Button
                                            variant="ghost"
                                            className={cn(
                                                "w-full h-10 rounded-xl transition-all font-bold",
                                                rec.isActive ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-slate-400 bg-slate-50 hover:bg-slate-100"
                                            )}
                                            onClick={() => toggleStatus(rec)}
                                        >
                                            {rec.isActive ? "Active Staff" : "Inactive"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {receptionists.length === 0 && (
                        <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 mb-6">
                                <UserCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Staff Registry Empty</h3>
                            <p className="text-slate-400 max-w-xs mx-auto mt-2 font-medium">Add your first receptionist to begin managing clinical operations.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Password Reset Dialog */}
            <Dialog open={!!resetId} onOpenChange={(open: boolean) => !open && setResetId(null)}>
                <DialogContent className="sm:max-w-[400px] rounded-[2rem] border-none shadow-2xl overflow-hidden">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold">Reset Credential</DialogTitle>
                        <DialogDescription>
                            This will generate a new random password for the selected receptionist.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <div className="flex gap-2 w-full">
                            <Button variant="ghost" className="flex-1 rounded-xl h-12" onClick={() => setResetId(null)}>Cancel</Button>
                            <Button className="flex-1 rounded-xl h-12 font-bold bg-slate-900 text-white" onClick={handleResetPassword}>
                                Generate New Password
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
