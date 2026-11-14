import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { usePestRecords } from '../hooks/useFirestore'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const COLORS = ['#1E5128', '#2D6A4F', '#D32F2F', '#F57F17', '#1565C0']

export default function Analytics() {
  const { records } = usePestRecords()
  const [pestFilter, setPestFilter] = useState('all')

  const pests = useMemo(() => {
    const s = new Set(records.map(r => r.detectedPest).filter(p => p !== 'Healthy' && p !== 'Unknown'))
    return Array.from(s)
  }, [records])

  const filtered = useMemo(() =>
    records.filter(r => {
      const isPest = r.detectedPest !== 'Healthy' && r.detectedPest !== 'Unknown'
      if (!isPest) return false
      return pestFilter === 'all' || r.detectedPest === pestFilter
    }), [records, pestFilter])

  // Monthly counts
  const monthly = useMemo(() => {
    const c: number[] = Array(12).fill(0)
    filtered.forEach(r => { c[r.detectedAt.getMonth()]++ })
    return MONTHS.map((m, i) => ({ month: m, count: c[i] }))
  }, [filtered])

  // By pest
  const byPest = useMemo(() => {
    const c: Record<string, number> = {}
    filtered.forEach(r => { c[r.detectedPest] = (c[r.detectedPest] ?? 0) + 1 })
    return Object.entries(c).map(([name, value]) => ({ name, value }))
  }, [filtered])

  // By barangay top 10
  const byBarangay = useMemo(() => {
    const c: Record<string, number> = {}
    filtered.forEach(r => { c[r.barangay] = (c[r.barangay] ?? 0) + 1 })
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }))
  }, [filtered])

  // Season counts
  const seasons = useMemo(() => {
    let wet = 0, dry = 0
    filtered.forEach(r => {
      const m = r.detectedAt.getMonth() + 1
      if (m >= 5 && m <= 10) wet++
      else dry++
    })
    return { wet, dry, total: wet + dry }
  }, [filtered])

  return (
    <div className="p-6 space-y-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Seasonal Analytics</h1>
        <p className="text-sm text-gray-500">Based on {filtered.length} pest detections submitted through GreenGuard</p>
      </div>

      {/* Pest filter */}
      <div className="flex flex-wrap gap-2">
        {['all', ...pests].map(p => (
          <button key={p} onClick={() => setPestFilter(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              pestFilter === p ? 'bg-[#1E5128] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {p === 'all' ? 'All pests' : p}
          </button>
        ))}
      </div>

      {/* Season summary */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Wet Season (May–Oct)', count: seasons.wet, color: 'bg-blue-500' },
          { label: 'Dry Season (Nov–Apr)', count: seasons.dry, color: 'bg-amber-500' },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{count}</div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${color} rounded-full`}
                style={{ width: seasons.total ? `${(count / seasons.total) * 100}%` : '0%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Monthly bar chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Detections by Month</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthly} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#1E5128" radius={[4,4,0,0]} name="Detections" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-2">Counts aggregated across all years of records.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pest pie */}
        {byPest.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Pest Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byPest} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {byPest.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Barangay bar */}
        {byBarangay.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Top Affected Barangays</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byBarangay} layout="vertical" margin={{ left: 8, right: 20, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="value" fill="#2D6A4F" radius={[0,4,4,0]} name="Detections" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        These charts summarise detections submitted through the GreenGuard app. They are a monitoring aid and do not establish an official pest season. Confirm against PhilRice guidelines and municipal field records.
      </p>
    </div>
  )
}
