"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { getSettings, updateSettings, addAuditLog, getCurrentAdmin } from "@/lib/storage"
import type { SystemSettings } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
Eye,
    EyeOff,
    ShieldAlert,
    Trash2
} from "lucide-react"

export default function AdminSettingsPage() {
    const { isLoading } = useAdminAuth()
    const { toast } = useToast()
    const [settings, setSettings] = useState<SystemSettings | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isDataLoading, setIsDataLoading] = useState(true)
    const admin = getCurrentAdmin()

    useEffect(() => {
        setSettings(getSettings())
        const timer = setTimeout(() => setIsDataLoading(false), 500)
        return () => clearTimeout(timer)
    }, [])

    const handleSave = async () => {
        if (!settings) return
        setIsSaving(true)

        try {
            updateSettings(settings)
            if (admin) {
                addAuditLog(admin.id, admin.username, "Update Settings", "Modified system-wide clinic configurations")
            }
            toast({
                title: "Settings Synchronized",
                description: "Clinic configurations have been updated across all nodes.",
                variant: "default",
            })
        } catch (error) {
            toast({
                title: "Update Failed",
                description: "An error occurred while saving system settings.",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading || isDataLoading || !settings) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50/50 min-h-screen">
                <LoadingScreen message="Loading System Preferences..." />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            <header className="bg-white border-b border-slate-100 px-8 py-6 sticky top-0 z-30 shadow-sm">
                <div className="container mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <Settings className="w-6 h-6 text-blue-600" />
                            System Governance
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure global clinic parameters and operational rules</p>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl gap-2 font-bold px-6 shadow-xl shadow-slate-200"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? "Saving..." : "Commit Changes"}
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Organization Identity */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50">
                                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    Clinic Identity
                                </CardTitle>
                                <CardDescription className="text-xs font-medium">Public information displayed on booking pages and reports</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Official Clinic Name</Label>
                                    <Input
                                        className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-900"
                                        value={settings.clinicName}
                                        onChange={e => setSettings({ ...settings, clinicName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Headquarters Address</Label>
                                    <Input
                                        className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-900"
                                        value={settings.address}
                                        onChange={e => setSettings({ ...settings, address: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Support Hotline</Label>
                                    <Input
                                        className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-900"
                                        value={settings.phone}
                                        onChange={e => setSettings({ ...settings, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Administrative Email</Label>
                                    <Input
                                        className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-900"
                                        value={settings.email}
                                        onChange={e => setSettings({ ...settings, email: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50">
                                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                    Operational Logic
                                </CardTitle>
                                <CardDescription className="text-xs font-medium">Define default behavior for the scheduling engine</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Default Slot Duration (Min)</Label>
                                    <Input
                                        type="number"
                                        className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-900"
                                        value={settings.defaultSlotDuration}
                                        onChange={e => setSettings({ ...settings, defaultSlotDuration: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opening Time</Label>
                                        <Input
                                            type="time"
                                            className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-900"
                                            value={settings.workingHours.start}
                                            onChange={e => setSettings({ ...settings, workingHours: { ...settings.workingHours, start: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Closing Time</Label>
                                        <Input
                                            type="time"
                                            className="h-12 rounded-xl border-slate-100 bg-slate-50/50 font-bold text-slate-900"
                                            value={settings.workingHours.end}
                                            onChange={e => setSettings({ ...settings, workingHours: { ...settings.workingHours, end: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar components */}
                    <div className="space-y-8">
                        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                            <CardHeader className="p-8 border-b border-slate-50">
                                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-emerald-600" />
                                    Automation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div className="flex items-center justify-between group">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">SMS Notifications</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Automated booking confirmations</p>
                                    </div>
                                    <div
                                        className={cn(
                                            "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors",
                                            settings.notifications.sms ? "bg-emerald-500" : "bg-slate-200"
                                        )}
                                        onClick={() => setSettings({ ...settings, notifications: { ...settings.notifications, sms: !settings.notifications.sms } })}
                                    >
                                        <div className={cn("bg-white w-4 h-4 rounded-full transition-transform", settings.notifications.sms && "translate-x-6")} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between group">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">WhatsApp Dispatch</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Patient reminders via WhatsApp API</p>
                                    </div>
                                    <div
                                        className={cn(
                                            "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors",
                                            settings.notifications.whatsapp ? "bg-emerald-500" : "bg-slate-200"
                                        )}
                                        onClick={() => setSettings({ ...settings, notifications: { ...settings.notifications, whatsapp: !settings.notifications.whatsapp } })}
                                    >
                                        <div className={cn("bg-white w-4 h-4 rounded-full transition-transform", settings.notifications.whatsapp && "translate-x-6")} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between group">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Email Reminders</p>
                                        <p className="text-[10px] text-slate-400 font-medium">Standard clinical follow-up emails</p>
                                    </div>
                                    <div
                                        className={cn(
                                            "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors",
                                            settings.notifications.emailReminders ? "bg-emerald-500" : "bg-slate-200"
                                        )}
                                        onClick={() => setSettings({ ...settings, notifications: { ...settings.notifications, emailReminders: !settings.notifications.emailReminders } })}
                                    >
                                        <div className={cn("bg-white w-4 h-4 rounded-full transition-transform", settings.notifications.emailReminders && "translate-x-6")} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm rounded-3xl bg-rose-50 overflow-hidden">
                            <CardHeader className="p-8 border-b border-rose-100">
                                <CardTitle className="text-lg font-black text-rose-900 flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                                    Security & Maintenance
                                </CardTitle>
                                <CardDescription className="text-xs font-medium text-rose-600/70">Irreversible system-wide operations</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-6">
                                <div>
                                    <p className="text-sm font-bold text-rose-900">Purge Clinical Data clusters</p>
                                    <p className="text-[10px] text-rose-600/70 font-medium mb-4">This will clear all time slots, appointments, and leave records. Process cannot be undone.</p>
                                    <Button
                                        onClick={async () => {
                                            if (confirm("CRITICAL: Are you sure you want to PURGE all appointments and slots? This action is IRREVERSIBLE.")) {
                                                try {
                                                    const res = await fetch('/api/reset', { method: 'POST' });
                                                    if (res.ok) {
                                                        toast({ title: "Database Purged", description: "Successfully cleared all slots and bookings." });
                                                        if (admin) addAuditLog(admin.id, admin.username, "Data Purge", "Executed full database reset");
                                                    }
                                                } catch (e) {
                                                    toast({ title: "Purge Failed", variant: "destructive" });
                                                }
                                            }
                                        }}
                                        className="w-full h-12 bg-rose-600 hover:bg-rose-700 text-white rounded-xl gap-2 font-bold shadow-xl shadow-rose-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Clean All Bookings & Slots
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full -mr-10 -mt-10" />
                            <ShieldCheck className="w-10 h-10 text-blue-400 mb-6" />
                            <h3 className="text-xl font-bold mb-2 tracking-tight">Governance Locked</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">System-wide settings require Super Admin clearance. All modifications are logged in the cryptographic audit trail.</p>
                            <Button variant="outline" className="mt-8 w-full rounded-2xl border-white/10 hover:bg-white/5 text-xs font-bold h-12">
                                Change Root Credentials
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
