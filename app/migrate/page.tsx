"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Database, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"

export default function MigratePage() {
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const runMigration = async () => {
        setIsLoading(true)
        setResult(null)
        setError(null)

        try {
            const res = await fetch('/api/migrate', {
                method: 'POST'
            })
            const data = await res.json()

            if (data.success) {
                setResult(data)
            } else {
                setError(data.error || 'Migration failed')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to connect to server')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
            <Card className="max-w-2xl w-full shadow-2xl border-none rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <Database className="w-8 h-8" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-bold">Database Migration</CardTitle>
                            <CardDescription className="text-blue-100 mt-1">
                                Reset and recreate all database collections with fresh demo data
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-8 space-y-6">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-amber-900 mb-1">⚠️ Warning</h3>
                                <p className="text-sm text-amber-800">
                                    This will <strong>permanently delete</strong> all existing data and create fresh collections.
                                    Only use this for initial setup or complete reset.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="font-bold text-slate-900">What will be created:</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span>7 Doctor profiles with specializations</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span>3,360 available time slots (30 days)</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span>Admin account (admin/admin123)</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span>Clinic settings and configuration</span>
                            </li>
                        </ul>
                    </div>

                    <Button
                        onClick={runMigration}
                        disabled={isLoading}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg shadow-blue-200 transition-all"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                Running Migration...
                            </>
                        ) : (
                            <>
                                <Database className="w-5 h-5 mr-2" />
                                Run Database Migration
                            </>
                        )}
                    </Button>

                    {result && (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex gap-3 mb-4">
                                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-green-900 text-lg">Migration Successful!</h3>
                                    <p className="text-sm text-green-700 mt-1">{result.message}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="bg-white rounded-xl p-4 border border-green-100">
                                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Doctors</p>
                                    <p className="text-2xl font-bold text-green-900 mt-1">{result.stats.doctors}</p>
                                </div>
                                <div className="bg-white rounded-xl p-4 border border-green-100">
                                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Slots</p>
                                    <p className="text-2xl font-bold text-green-900 mt-1">{result.stats.slots.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex gap-3">
                                <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                                <div>
                                    <h3 className="font-bold text-red-900 text-lg">Migration Failed</h3>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                    <p className="text-xs text-red-600 mt-3">
                                        Make sure your MONGODB_URI is set correctly in .env.local
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500 text-center">
                            After migration, you can login with: <strong>admin</strong> / <strong>admin123</strong>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
