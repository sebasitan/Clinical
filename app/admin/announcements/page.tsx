"use client"

import { useState, useEffect } from "react"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import {
    getAnnouncementsAsync,
    addAnnouncementAsync,
    updateAnnouncementAsync,
    deleteAnnouncementAsync
} from "@/lib/storage"
import type { Announcement } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Megaphone,
    Plus,
    Trash2,
    Edit2,
    Calendar,
    AlertCircle,
    Info,
    CheckCircle2,
    CalendarClock
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { format, isAfter, isBefore, parseISO } from "date-fns"

export default function AnnouncementsPage() {
    const { isLoading } = useAdminAuth()
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<Announcement> | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadAnnouncements()
    }, [])

    const loadAnnouncements = async () => {
        const data = await getAnnouncementsAsync(true)
        setAnnouncements(data)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingAnnouncement?.title || !editingAnnouncement?.message || !editingAnnouncement?.startDate || !editingAnnouncement?.endDate) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsSubmitting(true)
        try {
            const identifier = editingAnnouncement.id || editingAnnouncement._id
            if (identifier) {
                await updateAnnouncementAsync(identifier, editingAnnouncement)
                toast.success("Announcement updated successfully")
            } else {
                await addAnnouncementAsync(editingAnnouncement as Omit<Announcement, "id">)
                toast.success("Announcement created successfully")
            }
            setIsDialogOpen(false)
            loadAnnouncements()
        } catch (error) {
            toast.error("Failed to save announcement")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this announcement?")) return

        try {
            await deleteAnnouncementAsync(id)
            toast.success("Announcement deleted")
            loadAnnouncements()
        } catch (error) {
            toast.error("Failed to delete announcement")
        }
    }

    const getStatusBadge = (announcement: Announcement) => {
        const today = new Date().toISOString().split('T')[0]
        if (!announcement.isActive) return <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-none px-3 font-bold uppercase text-[10px]">Inactive</Badge>
        if (isAfter(parseISO(announcement.startDate), parseISO(today))) return <Badge className="bg-blue-100 text-blue-600 border-none px-3 font-bold uppercase text-[10px]">Scheduled</Badge>
        if (isBefore(parseISO(announcement.endDate), parseISO(today))) return <Badge variant="destructive" className="bg-rose-100 text-rose-600 border-none px-3 font-bold uppercase text-[10px]">Expired</Badge>
        return <Badge className="bg-emerald-100 text-emerald-600 border-none px-3 font-bold uppercase text-[10px]">Active Now</Badge>
    }

    const getTypeIcon = (type: Announcement['type']) => {
        switch (type) {
            case 'emergency': return <AlertCircle className="w-4 h-4 text-rose-500" />
            case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />
            case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            default: return <Info className="w-4 h-4 text-blue-500" />
        }
    }

    if (isLoading) return null

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic mb-2">
                        Clinical <span className="text-blue-600">Announcements</span>
                    </h1>
                    <p className="text-slate-500 font-medium">Manage alerts and messages shown to patients on the home page.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (!open) setEditingAnnouncement(null)
                }}>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-6 font-bold uppercase tracking-widest transition-all hover:shadow-xl hover:shadow-blue-200"
                            onClick={() => setEditingAnnouncement({
                                type: 'info',
                                isActive: true,
                                startDate: new Date().toISOString().split('T')[0],
                                endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
                            })}
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            New Announcement
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase italic italic">{editingAnnouncement?.id ? 'Edit' : 'Create'} Announcement</DialogTitle>
                            <DialogDescription className="font-medium text-slate-500">
                                This message will be displayed at the top of the home page during the selected dates.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Title</Label>
                                <Input
                                    placeholder="e.g. Holiday Closing Notice"
                                    className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 h-12"
                                    value={editingAnnouncement?.title || ""}
                                    onChange={e => setEditingAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Message</Label>
                                <Textarea
                                    placeholder="Brief details about the clinical update..."
                                    className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                                    value={editingAnnouncement?.message || ""}
                                    onChange={e => setEditingAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Start Date</Label>
                                    <Input
                                        type="date"
                                        className="rounded-xl border-slate-200 h-12"
                                        value={editingAnnouncement?.startDate || ""}
                                        onChange={e => setEditingAnnouncement(prev => ({ ...prev, startDate: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">End Date</Label>
                                    <Input
                                        type="date"
                                        className="rounded-xl border-slate-200 h-12"
                                        value={editingAnnouncement?.endDate || ""}
                                        onChange={e => setEditingAnnouncement(prev => ({ ...prev, endDate: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Type</Label>
                                    <Select
                                        value={editingAnnouncement?.type || "info"}
                                        onValueChange={(val: Announcement['type']) => setEditingAnnouncement(prev => ({ ...prev, type: val }))}
                                    >
                                        <SelectTrigger className="rounded-xl border-slate-200 h-12">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="info">Information</SelectItem>
                                            <SelectItem value="warning">Warning</SelectItem>
                                            <SelectItem value="emergency">Emergency</SelectItem>
                                            <SelectItem value="success">Promotion/Success</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col justify-center space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-400 tracking-widest">Visibility</Label>
                                    <div className="flex items-center space-x-2 h-12">
                                        <Switch
                                            checked={editingAnnouncement?.isActive ?? true}
                                            onCheckedChange={val => setEditingAnnouncement(prev => ({ ...prev, isActive: val }))}
                                        />
                                        <span className="text-sm font-bold text-slate-600">
                                            {editingAnnouncement?.isActive ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="submit"
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 font-black uppercase tracking-widest shadow-xl shadow-slate-200"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Announcement'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6">
                {announcements.length === 0 ? (
                    <Card className="border-dashed border-2 bg-slate-50/50 rounded-[2.5rem]">
                        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                                <Megaphone className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No announcements found</h3>
                            <p className="text-slate-500 max-w-sm">Create your first announcement to share clinical updates or alerts with your patients.</p>
                        </CardContent>
                    </Card>
                ) : (
                    announcements.map((ann) => (
                        <Card key={ann.id} className="overflow-hidden border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 rounded-[2rem]">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row">
                                    <div className={cn(
                                        "md:w-2 focus:ring-0",
                                        ann.type === 'emergency' ? "bg-rose-500" :
                                            ann.type === 'warning' ? "bg-amber-500" :
                                                ann.type === 'success' ? "bg-emerald-500" :
                                                    "bg-blue-500"
                                    )} />
                                    <div className="flex-1 p-8 py-6">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                {getTypeIcon(ann.type)}
                                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">{ann.title}</h3>
                                                {getStatusBadge(ann)}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                                                    onClick={() => {
                                                        setEditingAnnouncement(ann)
                                                        setIsDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 hover:text-rose-700 hover:bg-rose-100"
                                                    onClick={() => handleDelete(ann.id || ann._id!)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <p className="text-slate-600 font-medium mb-6 leading-relaxed">
                                            {ann.message}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-slate-100">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Calendar className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Display Duration</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <CalendarClock className="w-4 h-4 text-blue-500" />
                                                <span className="text-xs font-bold">{format(parseISO(ann.startDate), 'PPP')}</span>
                                                <span className="text-slate-300 font-bold">—</span>
                                                <span className="text-xs font-bold">{format(parseISO(ann.endDate), 'PPP')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
