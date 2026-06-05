"use client"

import { useActionState, useRef, useState } from "react"
import { uploadPlayersFromExcel } from "@/app/admin/jugadores/actions"
import { FileSpreadsheet, Upload, X, CheckCircle, AlertCircle } from "lucide-react"

export default function PlayerExcelUploadButton() {
    const [isOpen, setIsOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [state, formAction, isPending] = useActionState(uploadPlayersFromExcel, undefined)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
            >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Importar Excel
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                            <h3 className="text-lg font-bold text-white flex items-center">
                                <FileSpreadsheet className="w-5 h-5 mr-2 text-emerald-500" />
                                Carga Masiva de Jugadores
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-zinc-400">
                                El Excel debe tener las columnas: <strong className="text-zinc-300">Categoria, Equipo, Nombre, Apellido, Dorsal</strong>
                            </p>

                            <form action={formAction} className="space-y-4">
                                <div
                                    className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-zinc-300">Haz clic para seleccionar el archivo</p>
                                    <p className="text-xs text-zinc-500 mt-1">Solo archivos .xlsx o .xls</p>
                                    <input
                                        type="file"
                                        name="file"
                                        accept=".xlsx,.xls"
                                        className="hidden"
                                        ref={fileInputRef}
                                        required
                                        onChange={e => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                e.target.form?.requestSubmit()
                                            }
                                        }}
                                    />
                                </div>

                                {isPending && (
                                    <div className="text-center text-sm text-blue-400 animate-pulse">
                                        Procesando archivo...
                                    </div>
                                )}

                                {state?.success && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                                        <div className="flex items-center text-emerald-400 font-medium text-sm mb-2">
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {state.success}
                                        </div>
                                        {state.errors && state.errors.length > 0 && (
                                            <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
                                                {state.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                {state?.error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-start">
                                        <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                        <p>{state.error}</p>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}