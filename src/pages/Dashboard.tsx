import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bug, Users, ClipboardList, AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import { usePestRecords } from '../hooks/useFirestore'
import { useFarmers } from '../hooks/useFirestore'
import { useAssistanceRequests } from '../hooks/useFirestore'
import { format } from '../lib/dateUtils'

function StatCard({
  label, value, icon: Icon, color, to,
}: {
  label: string; value: number | string; icon: typeof Bug; color: string; to?: string
}) {
  const inner = (
    <div className={`bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow`}>
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : <div>{inner}</div>
}

export default function Dashboard() {
  const { records, loading: rLoading } = usePestRecords()
  const { farmers } = useFarmers()
  const { requests } = useAssistanceRequests()

  const stats = useMemo(() => {
    const pestRecords = records.filter(r => r.detectedPest !== 'Healthy' && r.detectedPest !== 'Unknown')
    const unreviewed = records.filter(r => !r.reviewed && r.detectedPest !== 'Healthy' && r.detectedPest !== 'Unknown')
    const pendingAssist = requests.filter(r => r.status === 'Pending')
    return { total: records.length, pests: pestRecords.length, unreviewed: unreviewed.length, pendingAssist: pendingAssist.length }
  }, [records, requests])

  const recentPests = records
    .filter(r => r.detectedPest !== 'Healthy' && r.detectedPest !== 'Unknown')
    .slice(0, 8)

  const pestCounts = useMemo(() => {
    const c: Record<string, number> = {}
    records.forEach(r => {
      if (r.detectedPest !== 'Healthy' && r.detectedPest !== 'Unknown') {
        c[r.detectedPest] = (c[r.detectedPest] ?? 0) + 1
      }
    })
    return Object.entries(c).sort((a, b) => b[1] - a[1])
  }, [records])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">MAO Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Rice Pest Health Monitoring — Municipal Agriculture Office</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Detections" value={stats.total} icon={TrendingUp} color="bg-[#1E5128]" to="/records" />
        <StatCard label="Pest Detections" value={stats.pests} icon={Bug} color="bg-red-500" to="/records" />
        <StatCard label="Registered Farmers" value={farmers.length} icon={Users} color="bg-blue-500" to="/farmers" />
        <StatCard label="Pending Assistance" value={stats.pendingAssist} icon={ClipboardList} color="bg-amber-500" to="/assistance" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent pest detections */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" /> Recent Pest Detections
            </h2>
            <Link to="/records" className="text-sm text-[#1E5128] hover:underline font-medium">View all</Link>
          </div>
          {rLoading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
          ) : recentPests.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No pest detections yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentPests.map(r => (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                  {r.imageData ? (
                    <img src={`data:image/jpeg;base64,${r.imageData}`} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Bug size={16} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{r.detectedPest}</div>
                    <div className="text-xs text-gray-500 truncate">{r.userName} · {r.barangay}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-gray-700">{Math.round(r.confidence * 100)}%</div>
                    <div className="text-xs text-gray-400">{format(r.detectedAt)}</div>
                  </div>
                  {!r.reviewed && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium shrink-0">New</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pest breakdown + unreviewed */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bug size={16} className="text-gray-400" /> Pest Breakdown
            </h2>
            {pestCounts.length === 0 ? (
              <p className="text-sm text-gray-400">No data yet.</p>
            ) : pestCounts.map(([pest, count]) => (
              <div key={pest} className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{pest}</span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1E5128] rounded-full"
                    style={{ width: `${(count / (records.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {stats.unreviewed > 0 && (
            <Link to="/records?filter=unreviewed"
              className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors"
            >
              <AlertTriangle size={20} className="text-amber-600 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-amber-800">{stats.unreviewed} unreviewed detection{stats.unreviewed !== 1 ? 's' : ''}</div>
                <div className="text-xs text-amber-600">Tap to review</div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
