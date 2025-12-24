"use client"

import { useState, useEffect } from "react"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAdminAuth } from "@/hooks/use-admin-auth"
import { Bell, Send, MessageCircle, Mail, Sparkles, CheckCircle2, Clock, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

export default function RemindersPage() {
    const { isLoading } = useAdminAuth()
    const [isSaving, setIsSaving] = useState(false)
    const [isRunning, setIsRunning] = useState(false)
    const [isDataLoading, setIsDataLoading] = useState(true)
    const [settings, setSettings] = useState({
        enabled: true,
        daysBefore: [1, 2],
        channels: { sms: false, whatsapp: true, email: true }
    })
    const [recentActivity, setRecentActivity] = useState<any[]>([])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsDataLoading(true)
        try {
            // Load settings
            const settingsRes = await fetch('/api/admin/reminders/settings')
            if (settingsRes.ok) {
                const data = await settingsRes.json()
                setSettings({
                    enabled: data.enabled,
                    daysBefore: data.daysBefore,
                    channels: data.channels
                })
            }

            // Load recent activity
            const logsRes = await fetch('/api/admin/reminders/logs')
            if (logsRes.ok) {
                const logs = await logsRes.json()
                setRecentActivity(logs)
            }
        } catch (e) {
            console.error('Error loading reminder data:', e)
        } finally {
            setIsDataLoading(false)
        }
    }

    const handleSaveSettings = async () => {
        setIsSaving(true)
        try {
            const res = await fetch('/api/admin/reminders/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            if (res.ok) {
                alert('Settings saved successfully!')
            } else {
                alert('Failed to save settings')
            }
        } catch (e) {
            console.error('Error saving settings:', e)
            alert('Error saving settings')
        } finally {
            setIsSaving(false)
        }
    }

    const handleRunNow = async () => {
        setIsRunning(true)
        try {
            const res = await fetch('/api/admin/reminders/run', {
                method: 'POST'
            })
            const data = await res.json()
            if (data.success) {
                alert(`Automation complete! ${data.totalReminders} reminders sent.`)
                loadData() // Reload to show new activity
            } else {
                alert(`Automation failed: ${data.message || data.error}`)
            }
        } catch (e) {
            console.error('Error running automation:', e)
            alert('Error running automation')
        } finally {
            setIsRunning(false)
        }
    }

    const toggleDayBefore = (day: number) => {
        const current = settings.daysBefore
        const next = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day].sort((a, b) => b - a)
        setSettings({ ...settings, daysBefore: next })
    }

    const toggleChannel = (channel: 'sms' | 'whatsapp' | 'email') => {
        setSettings({
            ...settings,
            channels: {
                ...settings.channels,
                [channel]: !settings.channels[channel]
            }
        })
    }

    if (isLoading || isDataLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50/50 min-h-screen">
                <LoadingScreen message="Loading Reminder System..." />
            </div>
        )
    }

    return (
        <div className="flex-1 bg-slate-50/50 p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-sans font-bold text-slate-900 tracking-tight">Appointment Reminders</h1>
                    <p className="text-slate-500 mt-1">Configure automatic reminders for upcoming appointments.</p>
                </div>

                {/* Configuration Card */}
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden mb-8">
                    <div className="bg-blue-600 p-8 text-white relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center gap-3 mb-2">
                            <Bell className="w-6 h-6" />
                            <h3 className="text-2xl font-bold">Reminder Configuration</h3>
                        </div>
                        <p className="text-blue-100 text-sm">Set when and how to send appointment reminders</p>
                    </div>
                    <CardContent className="p-8 space-y-8">
                        {/* Timing Configuration */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Send Reminders:</label>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { label: "2 Days Before", val: 2 },
                                    { label: "1 Day Before", val: 1 },
                                    { label: "Day of Appointment", val: 0 },
                                ].map(d => (
                                    <Button
                                        key={d.val}
                                        variant={settings.daysBefore.includes(d.val) ? "default" : "outline"}
                                        onClick={() => toggleDayBefore(d.val)}
                                        className="rounded-xl h-11 px-5 text-sm font-bold"
                                    >
                                        {d.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Channel Configuration */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Communication Channels</label>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: 'sms', label: 'SMS', icon: Send, color: 'text-blue-500' },
                                    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-500' },
                                    { id: 'email', label: 'Email', icon: Mail, color: 'text-amber-500' }
                                ].map(chan => (
                                    <button
                                        key={chan.id}
                                        onClick={() => toggleChannel(chan.id as any)}
                                        className={cn(
                                            "flex flex-col items-center p-5 rounded-2xl border-2 transition-all",
                                            settings.channels[chan.id as keyof typeof settings.channels]
                                                ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                                                : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                        )}
                                    >
                                        <chan.icon className="w-6 h-6 mb-2" />
                                        <span className="text-xs font-black tracking-widest uppercase">{chan.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-4">
                            <Button
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                            >
                                {isSaving ? "Saving..." : "Save Configuration"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Manual Trigger Card */}
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden mb-8">
                    <CardContent className="p-8 text-center">
                        <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Run Automation Now</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Manually trigger the reminder system to send notifications for all upcoming appointments based on your configuration.
                        </p>
                        <Button
                            onClick={handleRunNow}
                            disabled={isRunning}
                            className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-xl shadow-blue-100"
                        >
                            <Sparkles className={cn("w-4 h-4", isRunning && "animate-spin")} />
                            {isRunning ? "Processing..." : "Run Automation Now"}
                        </Button>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
                    <div className="bg-slate-50 p-6 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-slate-400" />
                            <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
                        </div>
                    </div>
                    <CardContent className="p-6">
                        {recentActivity.length === 0 ? (
                            <div className="py-12 text-center">
                                <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-medium">No automation runs yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentActivity.slice(0, 10).map((log) => (
                                    <div key={log.id} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-bold text-slate-900">
                                                    {log.totalReminders} reminders sent
                                                </p>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(log.timestamp).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                {log.processedDates?.map((d: any) =>
                                                    `${d.appointmentsFound} appointments on ${new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                                ).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
