import { useState, useMemo } from 'react'
import { Search, Bug, Sprout } from 'lucide-react'
import { useFarmers, usePestRecords } from '../hooks/useFirestore'
import type { UserModel } from '../types'
import { format } from '../lib/dateUtils'

function FarmerRow({ f, pestCount, onSelect }: { f: UserModel; pestCount: number; onSelect: () => void }) {
  const farmerId = `FRM-${f.uid.substring(0, 6).toUpperCase()}`
  return (
    <tr className="hover:bg-gray-50 cursor-pointer" onClick={onSelect}>
      <td className="px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-[#1E5128]/10 flex items-center justify-center text-[#1E5128] font-bold text-sm">
          {f.name.charAt(0).toUpperCase()}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-900">{f.name}</div>
        <div className="text-xs text-gray-500">{f.email}</div>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{farmerId}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{f.barangay ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{f.farmCount}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{f.detectionCount}</td>
      <td className="px-4 py-3">
        {pestCount > 0 && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit">
            <Bug size={11} /> {pestCount}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {f.lastDetectionAt ? format(f.lastDetectionAt) : '—'}
      </td>
    </tr>
  )
}

function FarmerDetail({ f, records, onClose }: { f: UserModel; records: ReturnType<typeof usePestRecords>['records']; onClose: () => void }) {
  const farmerId = `FRM-${f.uid.substring(0, 6).toUpperCase()}`
  const farmerRecords = records.filter(r => r.userId === f.uid).slice(0, 10)

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Farmer Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-[#1E5128]/10 flex items-center justify-center text-[#1E5128] font-bold text-2xl">
              {f.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-gray-900 text-lg">{f.name}</div>
              <div className="text-sm text-gray-500">{f.email}</div>
              <div className="text-xs text-gray-400 mt-0.5">{farmerId}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Barangay', value: f.barangay ?? '—' },
              { label: 'Contact', value: f.contactNumber || '—' },
              { label: 'Farms', value: String(f.farmCount) },
              { label: 'Total Detections', value: String(f.detectionCount) },
              { label: 'Registered', value: format(f.createdAt) },
              { label: 'Last Scan', value: f.lastDetectionAt ? format(f.lastDetectionAt) : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs text-gray-500">{label}</div>
                <div className="text-sm font-semibold text-gray-900">{value}</div>
              </div>
            ))}
          </div>

          <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
            <Sprout size={15} className="text-[#1E5128]" /> Recent Detections
          </h3>
          {farmerRecords.length === 0 ? (
            <p className="text-sm text-gray-400">No detections yet.</p>
          ) : (
            <div className="space-y-2">
              {farmerRecords.map(r => (
                <div key={r.id} className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <Bug size={14} className={r.detectedPest !== 'Healthy' && r.detectedPest !== 'Unknown' ? 'text-red-500' : 'text-green-600'} />
                  <span className="flex-1 text-gray-800">{r.detectedPest === 'Healthy' ? 'No Pest Detected' : r.detectedPest}</span>
                  <span className="text-gray-500 text-xs">{format(r.detectedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Farmers() {
  const { farmers, loading } = useFarmers()
  const { records } = usePestRecords()
  const [search, setSearch] = useState('')
  const [barangay, setBarangay] = useState('')
  const [selected, setSelected] = useState<UserModel | null>(null)

  const barangays = useMemo(() => {
    const s = new Set(farmers.map(f => f.barangay).filter(Boolean) as string[])
    return Array.from(s).sort()
  }, [farmers])

  const pestCountMap = useMemo(() => {
    const m: Record<string, number> = {}
    records.forEach(r => {
      if (r.detectedPest !== 'Healthy' && r.detectedPest !== 'Unknown') {
        m[r.userId] = (m[r.userId] ?? 0) + 1
      }
    })
    return m
  }, [records])

  const filtered = farmers.filter(f => {
    const q = search.toLowerCase()
    const matchSearch = !q || f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || (f.barangay ?? '').toLowerCase().includes(q)
    const matchBarangay = !barangay || f.barangay === barangay
    return matchSearch && matchBarangay
  })

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Registered Farmers</h1>
        <p className="text-sm text-gray-500">{farmers.length} farmers registered</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, barangay…"
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5128] w-64"
          />
        </div>
        <select value={barangay} onChange={e => setBarangay(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5128]">
          <option value="">All barangays</option>
          {barangays.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 w-12"></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Farmer</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Barangay</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Farms</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Scans</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Pests</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Last Scan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No farmers found.</td></tr>
            ) : filtered.map(f => (
              <FarmerRow key={f.uid} f={f} pestCount={pestCountMap[f.uid] ?? 0} onSelect={() => setSelected(f)} />
            ))}
          </tbody>
        </table>
      </div>

      {selected && <FarmerDetail f={selected} records={records} onClose={() => setSelected(null)} />}
    </div>
  )
}
