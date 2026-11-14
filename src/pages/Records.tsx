import { useState, useMemo, useEffect } from 'react'
import { Search, Bug, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 10
import { usePestRecords, markRecordReviewed } from '../hooks/useFirestore'
import type { PestRecord } from '../types'
import { formatFull } from '../lib/dateUtils'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-amber-100 text-amber-700',
  reviewed: 'bg-blue-100 text-blue-700',
  action_taken: 'bg-green-100 text-green-700',
}

function RecordRow({ r, onSelect }: { r: PestRecord; onSelect: () => void }) {
  const isHealthy = r.detectedPest === 'Healthy'
  const isPest = !isHealthy && r.detectedPest !== 'Unknown'
  return (
    <tr className="hover:bg-gray-50 cursor-pointer" onClick={onSelect}>
      <td className="px-4 py-3">
        {r.imageData ? (
          <img src={`data:image/jpeg;base64,${r.imageData}`} className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Bug size={16} className="text-gray-400" />
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-900">{r.userName}</div>
        <div className="text-xs text-gray-500">{r.barangay}</div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 text-sm font-medium ${isPest ? 'text-red-600' : isHealthy ? 'text-green-700' : 'text-gray-500'}`}>
          {isPest && <Bug size={13} />}
          {r.detectedPest === 'Healthy' ? 'No Pest Detected' : r.detectedPest}
        </span>
        {r.farmName && <div className="text-xs text-gray-400">{r.farmName}</div>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">{Math.round(r.confidence * 100)}%</td>
      <td className="px-4 py-3 text-xs text-gray-500">{formatFull(r.detectedAt)}</td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {r.status.replace('_', ' ')}
        </span>
      </td>
    </tr>
  )
}

function RecordDetail({ r, onClose }: { r: PestRecord; onClose: () => void }) {
  const [updating, setUpdating] = useState(false)

  async function handleMark(status: string) {
    setUpdating(true)
    await markRecordReviewed(r.id, status)
    setUpdating(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Detection Detail</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          {r.imageData && (
            <img src={`data:image/jpeg;base64,${r.imageData}`} className="w-full h-48 object-cover rounded-xl" />
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Farmer" value={r.userName} />
            <Detail label="Barangay" value={r.barangay} />
            <Detail label="Pest Detected" value={r.detectedPest === 'Healthy' ? 'No Pest Detected' : r.detectedPest} />
            <Detail label="Confidence" value={`${Math.round(r.confidence * 100)}%`} />
            <Detail label="Farm" value={r.farmName || '—'} />
            <Detail label="Date" value={formatFull(r.detectedAt)} />
          </div>
          {r.recommendation && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recommendation</div>
              <p className="text-sm text-gray-700 leading-relaxed">{r.recommendation}</p>
            </div>
          )}
          {r.pesticide && r.pesticide !== 'None required' && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Pesticide</div>
              <p className="text-sm text-gray-700">{r.pesticide}</p>
              {r.dosage && <p className="text-xs text-gray-500 mt-0.5">Dosage: {r.dosage}</p>}
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {r.status !== 'reviewed' && (
              <button
                onClick={() => handleMark('reviewed')}
                disabled={updating}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle size={15} /> Mark Reviewed
              </button>
            )}
            {r.status !== 'action_taken' && (
              <button
                onClick={() => handleMark('action_taken')}
                disabled={updating}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#1E5128] hover:bg-[#2D6A4F] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <AlertTriangle size={15} /> Action Taken
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      <div className="text-sm text-gray-900 font-semibold">{value}</div>
    </div>
  )
}

export default function Records() {
  const { records, loading } = usePestRecords()
  const [search, setSearch] = useState('')
  const [pestFilter, setPestFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<PestRecord | null>(null)
  const [page, setPage] = useState(1)

  const pests = useMemo(() => {
    const s = new Set(records.map(r => r.detectedPest).filter(p => p !== 'Healthy' && p !== 'Unknown'))
    return ['all', ...Array.from(s)]
  }, [records])

  const filtered = useMemo(() => records.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.userName.toLowerCase().includes(q) || r.barangay.toLowerCase().includes(q) || r.detectedPest.toLowerCase().includes(q)
    const matchPest = pestFilter === 'all' || r.detectedPest === pestFilter
    const matchStatus = statusFilter === 'all' || r.status === statusFilter || (statusFilter === 'unreviewed' && !r.reviewed && r.detectedPest !== 'Healthy')
    return matchSearch && matchPest && matchStatus
  }), [records, search, pestFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1) }, [search, pestFilter, statusFilter])

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Detection Records</h1>
        <p className="text-sm text-gray-500">{records.length} total submissions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search farmer, barangay…"
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5128] w-64"
          />
        </div>
        <select value={pestFilter} onChange={e => setPestFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5128]">
          {pests.map(p => <option key={p} value={p}>{p === 'all' ? 'All pests' : p}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5128]">
          <option value="all">All statuses</option>
          <option value="unreviewed">Unreviewed</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="action_taken">Action taken</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Photo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Farmer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Pest</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Confidence</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading…</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No records found.</td></tr>
            ) : paginated.map(r => (
              <RecordRow key={r.id} r={r} onSelect={() => setSelected(r)} />
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '…' ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className={`min-w-[28px] h-7 rounded-lg text-xs font-medium transition-colors ${
                        page === n ? 'bg-[#1E5128] text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && <RecordDetail r={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
