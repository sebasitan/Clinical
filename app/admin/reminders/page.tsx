"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { Bell, Calendar, Clock, Send, MessageCircle, Mail, Sparkles, CheckCircle2, AlertCircle, Save } from "lucide-react"
import { cn } from "@/lib/utils"

export default function OutreachSettingsPage() {
    const { isLoading } = useAdminAuth()
    const [isSaving, setIsSaving] = useState(false)
    const [isChecking, setIsChecking] = useState(false)

    // Global Settings State
    const [settings, setSettings] = useState({
        bookingReminders: {
            enabled: true,
            daysBefore: [1, 2],
            channels: { sms: false, whatsapp: true, email: true }
        },
        followUpReminders: {
            enabled: true,
            periodDays: 30, // Periodical check
            channels: { sms: false, whatsapp: true, email: true }
        }
    })

    const handleSave = async () => {
        setIsSaving(true)
        // Simulate save - in real app we'd hit a settings API
        setTimeout(() => setIsSaving(false), 1000)
    }

    const runGlobalCheck = async () => {
        setIsChecking(true)
        try {
            const res = await fetch('/api/admin/automation/run')
            if (res.ok) {
                const data = await res.json()
                alert(`Automation check complete! Reminders processed: ${data.totalSent}`)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsChecking(false)
        }
    }

    if (isLoading) return null

    return (
        <div className="flex-1 bg-slate-50/50 p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-4xl font-sans font-bold text-slate-900 tracking-tight">Clinical Automation</h1>
                        <p className="text-slate-500 mt-1">Configure how the system reaches out to your patients.</p>
                    </div>
                    <Button
                        onClick={runGlobalCheck}
                        disabled={isChecking}
                        className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-xl shadow-blue-100 transition-all"
                    >
                        <Sparkles className={cn("w-4 h-4", isChecking && "animate-spin")} />
                        {isChecking ? "Processing..." : "Run Global Check"}
                    </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* SECTION 1: NEW BOOKING REMINDERS */}
                    <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                        <div className="bg-slate-900 p-8 text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="w-5 h-5 text-blue-400" />
                                <h3 className="text-xl font-bold">Booking Reminders</h3>
                            </div>
                            <p className="text-slate-400 text-xs uppercase font-black tracking-widest">Global rule for new appointments</p>
                        </div>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Send Reminders on:</label>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { label: "2 Days Before", val: 2 },
                                        { label: "1 Day Before", val: 1 },
                                        { label: "Day of Arrival", val: 0 },
                                    ].map(d => (
                                        <Button
                                            key={d.val}
                                            variant={settings.bookingReminders.daysBefore.includes(d.val) ? "default" : "outline"}
                                            onClick={() => {
                                                const current = settings.bookingReminders.daysBefore
                                                const next = current.includes(d.val) ? current.filter(v => v !== d.val) : [...current, d.val]
                                                setSettings({ ...settings, bookingReminders: { ...settings.bookingReminders, daysBefore: next } })
                                            }}
                                            className="rounded-xl h-10 px-4 text-xs font-bold"
                                        >
                                            {d.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Distribution Channels</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'sms', label: 'SMS', icon: Send, color: 'text-blue-500' },
                                        { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-500' },
                                        { id: 'email', label: 'Email', icon: Mail, color: 'text-amber-500' }
                                    ].map(chan => (
                                        <button
                                            key={chan.id}
                                            //@ts-ignore
                                            onClick={() => setSettings({ ...settings, bookingReminders: { ...settings.bookingReminders, channels: { ...settings.bookingReminders.channels, [chan.id]: !settings.bookingReminders.channels[chan.id] } } })}
                                            //@ts-ignore
                                            className={cn("flex flex-col items-center p-4 rounded-2xl border-2 transition-all", settings.bookingReminders.channels[chan.id] ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-50 text-slate-400 shadow-sm")}
                                        >
                                            <chan.icon className="w-5 h-5 mb-1" />
                                            <span className="text-[9px] font-black tracking-widest uppercase">{chan.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* SECTION 2: TREATMENT FOLLOW-UPS */}
                    <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                        <div className="bg-blue-600 p-8 text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-5 h-5 text-blue-200" />
                                <h3 className="text-xl font-bold">Follow-up Care</h3>
                            </div>
                            <p className="text-blue-100 text-xs uppercase font-black tracking-widest">Periodical check for ongoing cases</p>
                        </div>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Follow-up Cycle</label>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <Input
                                            type="number"
                                            value={settings.followUpReminders.periodDays}
                                            onChange={(e) => setSettings({ ...settings, followUpReminders: { ...settings.followUpReminders, periodDays: parseInt(e.target.value) } })}
                                            className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold text-center"
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-slate-500">Days</span>
                                </div>
                                <p className="text-[10px] text-slate-400 italic leading-relaxed">System will send a treatment update reminder every {settings.followUpReminders.periodDays} days until care is marked "Complete".</p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Outreach Channels</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'sms', label: 'SMS', icon: Send, color: 'text-blue-500' },
                                        { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-500' },
                                        { id: 'email', label: 'Email', icon: Mail, color: 'text-amber-500' }
                                    ].map(chan => (
                                        <button
                                            key={chan.id}
                                            //@ts-ignore
                                            onClick={() => setSettings({ ...settings, followUpReminders: { ...settings.followUpReminders, channels: { ...settings.followUpReminders.channels, [chan.id]: !settings.followUpReminders.channels[chan.id] } } })}
                                            //@ts-ignore
                                            className={cn("flex flex-col items-center p-4 rounded-2xl border-2 transition-all", settings.followUpReminders.channels[chan.id] ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-50 text-slate-400 shadow-sm")}
                                        >
                                            <chan.icon className="w-5 h-5 mb-1" />
                                            <span className="text-[9px] font-black tracking-widest uppercase">{chan.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-12 flex justify-center">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-14 px-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest gap-2 shadow-2xl transition-all hover:scale-105"
                    >
                        {isSaving ? "Applying Changes..." : "Save Global Configuration"}
                        <Save className="w-4 h-4 ml-2" />
                    </Button>
                </div>

                {/* Automation Summary */}
                <Card className="mt-12 border-none bg-emerald-50/50 rounded-[2rem] overflow-hidden">
                    <CardContent className="p-8 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest mb-1">Automation Status</h4>
                            <p className="text-xs text-emerald-700 leading-relaxed font-medium">The clinical automation engine is active. It will process all upcoming bookings and ongoing treatment plans daily based on these configurations.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
