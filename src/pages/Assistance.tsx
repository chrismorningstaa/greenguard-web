import { useState, useMemo } from 'react'
import { ClipboardList, ChevronDown } from 'lucide-react'
import { useAssistanceRequests, updateAssistanceStatus } from '../hooks/useFirestore'
import { useAuth } from '../context/AuthContext'
import type { AssistanceRequest } from '../types'
import { formatFull } from '../lib/dateUtils'

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-blue-100 text-blue-700',
  Distributed: 'bg-purple-100 text-purple-700',
  Completed: 'bg-green-100 text-green-700',
  Declined: 'bg-red-100 text-red-700',
}

const NEXT_STATUSES: Record<string, string[]> = {
  Pending: ['Approved', 'Declined'],
  Approved: ['Distributed'],
  Distributed: ['Completed'],
}

function RequestCard({ req, officerId, officerName }: { req: AssistanceRequest; officerId: string; officerName: string }) {
  const [open, setOpen] = useState(false)
  const [pesticide, setPesticide] = useState(req.pesticideSupplied)
  const [quantity, setQuantity] = useState(req.quantitySupplied)
  const [remarks, setRemarks] = useState(req.remarks)
  const [saving, setSaving] = useState(false)
  const nextStatuses = NEXT_STATUSES[req.status] ?? []

  async function moveTo(status: string) {
    setSaving(true)
    await updateAssistanceStatus(req.id, status, { pesticideSupplied: pesticide, quantitySupplied: quantity, remarks }, officerId, officerName)
    setSaving(false)
    setOpen(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 text-left" onClick={() => setOpen(o => !o)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-gray-900">{req.farmerName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[req.status] ?? ''}`}>{req.status}</span>
          </div>
          <div className="text-xs text-gray-500 truncate">{req.barangay} · {req.detectedPest || 'General request'} · {formatFull(req.requestedAt)}</div>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Contact', req.farmerContact || '—'],
              ['Farm', req.farmName || '—'],
              ['Pest', req.detectedPest || '—'],
              ['Recommended Treatment', req.recommendedTreatment || '—'],
            ].map(([l, v]) => (
              <div key={l}>
                <div className="text-xs text-gray-500">{l}</div>
                <div className="text-sm text-gray-800 font-medium">{v}</div>
              </div>
            ))}
          </div>
          {req.farmerNote && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
              <span className="font-medium text-xs text-gray-500 block mb-0.5">Farmer's Note</span>
              {req.farmerNote}
            </div>
          )}

          {nextStatuses.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Pesticide Supplied</label>
                  <input value={pesticide} onChange={e => setPesticide(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5128]"
                    placeholder="e.g. Buprofezin 25WP" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Quantity</label>
                  <input value={quantity} onChange={e => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5128]"
                    placeholder="e.g. 2 sachets" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Remarks</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5128] resize-none"
                  placeholder="Optional officer notes…" />
              </div>
              <div className="flex gap-2">
                {nextStatuses.map(s => (
                  <button key={s} onClick={() => moveTo(s)} disabled={saving}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                      s === 'Declined' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-[#1E5128] text-white hover:bg-[#2D6A4F]'
                    }`}>
                    {saving ? '…' : `Mark ${s}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {req.pesticideSupplied && (
            <div className="text-xs text-gray-500 bg-green-50 rounded-lg px-3 py-2">
              <strong>Supplied:</strong> {req.pesticideSupplied} {req.quantitySupplied && `· ${req.quantitySupplied}`}
              {req.handledByName && ` · by ${req.handledByName}`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Assistance() {
  const { requests, loading } = useAssistanceRequests()
  const { user, userName } = useAuth()
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() =>
    requests.filter(r => statusFilter === 'all' || r.status === statusFilter),
    [requests, statusFilter])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    requests.forEach(r => { c[r.status] = (c[r.status] ?? 0) + 1 })
    return c
  }, [requests])

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Assistance Requests</h1>
        <p className="text-sm text-gray-500">{requests.length} total requests</p>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {['all', 'Pending', 'Approved', 'Distributed', 'Completed', 'Declined'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s ? 'bg-[#1E5128] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s === 'all' ? 'All' : s} {s !== 'all' && counts[s] ? `(${counts[s]})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
          No requests found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <RequestCard key={r.id} req={r} officerId={user?.uid ?? ''} officerName={userName} />
          ))}
        </div>
      )}
    </div>
  )
}
