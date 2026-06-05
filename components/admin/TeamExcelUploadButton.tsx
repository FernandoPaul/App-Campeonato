"use client"

import { useRef, useState, useTransition } from "react"
import { uploadTeamsFromExcel } from "@/app/admin/equipos/actions"
import {
    FileSpreadsheet, Upload, X, CheckCircle2, AlertCircle,
    ChevronDown, Download, Loader2, RotateCcw, Send
} from "lucide-react"
import * as XLSX from "xlsx"

// ── Tipos ──────────────────────────────────────────────────────────────────
type RowStatus = "ok" | "error"

interface PreviewRow {
    index: number
    status: RowStatus
    errors: string[]
    categoria: string
    nombre: string
    slug: string
    ciudad: string
    logoUrl: string
    estado: string
}

type FilterTab = "todos" | "ok" | "error"

// ── Validación cliente ─────────────────────────────────────────────────────
function validateRow(raw: Record<string, any>, rowIdx: number): PreviewRow {
    const categoria = String(raw["Categoria"] || raw["Categoría"] || raw["categoria"] || "").trim()
    const nombre = String(raw["Nombre"] || raw["nombre"] || raw["Name"] || "").trim()
    const slugRaw = String(raw["Slug"] || raw["slug"] || "").trim()
    const ciudad = String(raw["Ciudad"] || raw["ciudad"] || "").trim()
    const logoUrl = String(raw["Logo URL"] || raw["Logo"] || raw["logo_url"] || "").trim()
    const estado = String(raw["Estado"] || raw["estado"] || raw["Status"] || "PUBLISHED").trim().toUpperCase()

    const slug = slugRaw.toLowerCase()
    const errors: string[] = []

    if (!categoria) errors.push("Falta la competición")
    if (!nombre) errors.push("Falta el nombre del equipo")
    if (!slugRaw) errors.push("Falta el slug")
    else if (!/^[a-z0-9-]+$/.test(slug)) errors.push("Slug inválido — solo minúsculas, números y guiones")
    if (logoUrl && !logoUrl.startsWith("http")) errors.push("Logo URL debe empezar por http")
    if (estado && !["PUBLISHED", "DRAFT"].includes(estado)) errors.push("Estado debe ser PUBLISHED o DRAFT")

    return { index: rowIdx, status: errors.length > 0 ? "error" : "ok", errors, categoria, nombre, slug, ciudad, logoUrl, estado: estado || "PUBLISHED" }
}

function parseExcel(buffer: ArrayBuffer): PreviewRow[] {
    const wb = XLSX.read(buffer, { type: "array" })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { raw: false })
    return data.map((row, i) => validateRow(row, i + 2))
}

// ── StatusBadge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RowStatus }) {
    if (status === "ok") return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Listo
        </span>
    )
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
            <AlertCircle className="w-3 h-3" /> Error
        </span>
    )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function TeamExcelUploadButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [rows, setRows] = useState<PreviewRow[]>([])
    const [fileName, setFileName] = useState("")
    const [filter, setFilter] = useState<FilterTab>("todos")
    const [expandedRow, setExpanded] = useState<number | null>(null)
    const [result, setResult] = useState<{ success?: string; error?: string; errors?: string[] } | null>(null)
    const [isPending, startTransition] = useTransition()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const okCount = rows.filter(r => r.status === "ok").length
    const errCount = rows.filter(r => r.status === "error").length
    const total = rows.length

    const visibleRows = rows.filter(r =>
        filter === "todos" ? true : filter === "ok" ? r.status === "ok" : r.status === "error"
    )

    function handleFile(file: File) {
        setFileName(file.name)
        setResult(null)
        setExpanded(null)
        const reader = new FileReader()
        reader.onload = e => {
            if (!e.target?.result) return
            setRows(parseExcel(e.target.result as ArrayBuffer))
            setFilter("todos")
        }
        reader.readAsArrayBuffer(file)
    }

    function handleConfirm() {
        if (okCount === 0) return
        const validRows = rows.filter(r => r.status === "ok")
        const wsData = validRows.map(r => ({
            Categoria: r.categoria, Nombre: r.nombre, Slug: r.slug,
            Ciudad: r.ciudad, "Logo URL": r.logoUrl, Estado: r.estado,
        }))
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wsData), "Equipos")
        const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer
        const file = new File([new Blob([buf])], "import.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
        const fd = new FormData()
        fd.append("file", file)
        startTransition(async () => {
            const res = await uploadTeamsFromExcel(undefined, fd)
            setResult(res ?? null)
            if (res?.success) setRows([])
        })
    }

    function handleReset() {
        setRows([]); setFileName(""); setResult(null); setExpanded(null); setFilter("todos")
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    function handleClose() { setIsOpen(false); setTimeout(handleReset, 300) }

    const hasPreview = rows.length > 0 && !result

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Importar Excel
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
                    <div
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full shadow-2xl flex flex-col overflow-hidden transition-all duration-300"
                        style={{ maxWidth: hasPreview ? "860px" : "460px", maxHeight: "90vh" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Importar Equipos desde Excel</h3>
                                    {fileName && <p className="text-xs text-zinc-500 mt-0.5">{fileName}</p>}
                                </div>
                            </div>
                            <button onClick={handleClose} className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Resultado final */}
                        {result && (
                            <div className={`m-5 rounded-xl px-4 py-3 border ${result.success ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                                <p className={`text-sm font-semibold ${result.success ? "text-emerald-400" : "text-red-400"}`}>
                                    {result.success || result.error}
                                </p>
                                {result.errors && result.errors.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                        {result.errors.map((e, i) => (
                                            <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                                                <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />{e}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {result.success && (
                                    <button onClick={handleClose} className="mt-3 text-xs font-medium text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
                                        Cerrar ventana
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Drop zone */}
                        {rows.length === 0 && !result && (
                            <div className="p-6 space-y-4">
                                <p className="text-sm text-zinc-400 text-center">
                                    Descarga la plantilla, rellénala y súbela para previsualizar los datos antes de importar.
                                </p>
                                <a href="/templates/plantilla-equipos.xlsx" download
                                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 hover:border-emerald-500/50 hover:text-white transition-colors">
                                    <Download className="w-4 h-4 text-emerald-400" /> Descargar plantilla Excel
                                </a>
                                <div
                                    className="border-2 border-dashed border-zinc-700 rounded-xl p-10 text-center hover:bg-zinc-800/40 hover:border-zinc-600 transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
                                    onDragOver={e => e.preventDefault()}
                                >
                                    <Upload className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-zinc-300">Arrastra el archivo aquí o haz clic</p>
                                    <p className="text-xs text-zinc-600 mt-1">.xlsx o .xls</p>
                                    <input type="file" accept=".xlsx,.xls" className="hidden" ref={fileInputRef}
                                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                                </div>
                            </div>
                        )}

                        {/* Preview */}
                        {hasPreview && (
                            <>
                                {/* Stats */}
                                <div className="px-5 pt-4 pb-2 flex-shrink-0 flex items-center justify-between">
                                    <div className="flex items-center gap-5 text-sm">
                                        <span className="text-zinc-400">Total: <span className="font-bold text-white">{total}</span></span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                            <span className="text-emerald-400 font-bold">{okCount}</span>
                                            <span className="text-zinc-500 text-xs">listos</span>
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-red-400" />
                                            <span className="text-red-400 font-bold">{errCount}</span>
                                            <span className="text-zinc-500 text-xs">con error</span>
                                        </span>
                                    </div>
                                    <button onClick={handleReset} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                                        <RotateCcw className="w-3.5 h-3.5" /> Cambiar archivo
                                    </button>
                                </div>

                                {/* Filter tabs */}
                                <div className="px-5 pb-3 flex-shrink-0">
                                    <div className="flex gap-1 bg-zinc-800/60 rounded-lg p-0.5 w-fit">
                                        {([["todos", `Todos (${total})`], ["ok", `Listos (${okCount})`], ["error", `Errores (${errCount})`]] as [FilterTab, string][]).map(([key, label]) => (
                                            <button key={key} onClick={() => setFilter(key)}
                                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${filter === key
                                                        ? key === "error" ? "bg-red-500/25 text-red-300"
                                                            : key === "ok" ? "bg-emerald-500/25 text-emerald-300"
                                                                : "bg-zinc-700 text-white"
                                                        : "text-zinc-500 hover:text-zinc-300"
                                                    }`}>{label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="flex-1 overflow-y-auto min-h-0 border-t border-zinc-800">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10">
                                            <tr className="border-b border-zinc-800">
                                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider w-8">#</th>
                                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Nombre</th>
                                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider hidden sm:table-cell">Competición</th>
                                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Slug</th>
                                                <th className="px-4 py-2.5 text-left text-[11px] font-bold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Ciudad</th>
                                                <th className="px-4 py-2.5 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/50">
                                            {visibleRows.map(row => (
                                                <>
                                                    <tr
                                                        key={row.index}
                                                        onClick={() => row.status === "error" && setExpanded(expandedRow === row.index ? null : row.index)}
                                                        className={`transition-colors ${row.status === "error" ? "bg-red-500/5 hover:bg-red-500/10 cursor-pointer" : "hover:bg-zinc-800/30"}`}
                                                    >
                                                        <td className="px-4 py-3 text-zinc-600 text-xs">{row.index}</td>
                                                        <td className="px-4 py-3">
                                                            <p className={`font-semibold ${row.nombre ? "text-white" : "text-zinc-600 italic"}`}>
                                                                {row.nombre || "—"}
                                                            </p>
                                                            {row.status === "error" && (
                                                                <p className="text-xs text-red-400 mt-0.5 sm:hidden">
                                                                    {row.errors[0]}{row.errors.length > 1 ? ` +${row.errors.length - 1}` : ""}
                                                                </p>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 hidden sm:table-cell">
                                                            {row.categoria
                                                                ? <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium border border-zinc-700">{row.categoria}</span>
                                                                : <span className="text-red-400 text-xs italic">falta</span>}
                                                        </td>
                                                        <td className="px-4 py-3 text-zinc-500 text-xs font-mono hidden lg:table-cell">
                                                            {row.slug || <span className="text-red-400 not-italic">falta</span>}
                                                        </td>
                                                        <td className="px-4 py-3 text-zinc-500 text-xs hidden lg:table-cell">
                                                            {row.ciudad || "—"}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <StatusBadge status={row.status} />
                                                                {row.status === "error" && (
                                                                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${expandedRow === row.index ? "rotate-180" : ""}`} />
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* Detalle de errores expandido */}
                                                    {expandedRow === row.index && row.status === "error" && (
                                                        <tr key={`${row.index}-err`} className="bg-red-950/20">
                                                            <td colSpan={6} className="px-6 pb-3 pt-1">
                                                                <div className="ml-2 pl-3 border-l-2 border-red-500/30 space-y-1.5">
                                                                    {row.errors.map((err, i) => (
                                                                        <div key={i} className="flex items-start gap-2 text-xs text-red-300">
                                                                            <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5 text-red-400" />
                                                                            {err}
                                                                        </div>
                                                                    ))}
                                                                    <p className="text-[11px] text-zinc-600 mt-1">Corrige estos campos en el Excel y vuelve a subirlo para importar esta fila.</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            ))}
                                        </tbody>
                                    </table>

                                    {visibleRows.length === 0 && (
                                        <div className="py-12 text-center text-zinc-600 text-sm">No hay filas en esta competición.</div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="px-5 py-4 border-t border-zinc-800 flex items-center justify-between flex-shrink-0">
                                    <p className="text-xs">
                                        {errCount > 0 && okCount > 0 && <span className="text-amber-400">Se importarán solo las {okCount} filas sin errores.</span>}
                                        {errCount > 0 && okCount === 0 && <span className="text-red-400">Corrige los errores antes de importar.</span>}
                                        {errCount === 0 && okCount > 0 && <span className="text-emerald-400">Todas las filas son válidas.</span>}
                                    </p>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={okCount === 0 || isPending}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isPending
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Importando...</>
                                            : <><Send className="w-4 h-4" /> Importar {okCount} equipo{okCount !== 1 ? "s" : ""}</>
                                        }
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}