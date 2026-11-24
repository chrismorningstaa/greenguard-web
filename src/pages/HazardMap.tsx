import { useMemo, useState } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, CircleMarker, Tooltip as MapTooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
// Fix: Vite breaks Leaflet's default marker icon PNG URLs, causing triangle artifacts
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' })
import { usePestRecords } from '../hooks/useFirestore'

// Approximate center coordinates [lat, lng] for Lipa City barangays
const BRGY_COORDS: Record<string, [number, number]> = {
  'Barangay I': [13.9430, 121.1614],
  'Barangay II': [13.9418, 121.1625],
  'Barangay III': [13.9405, 121.1636],
  'Barangay IV': [13.9392, 121.1647],
  'Barangay V': [13.9380, 121.1658],
  'Barangay VI': [13.9368, 121.1669],
  'Barangay VII': [13.9356, 121.1680],
  'Barangay VIII': [13.9344, 121.1691],
  'Barangay IX': [13.9332, 121.1702],
  'Bagong Pook': [13.9270, 121.1680],
  'Balintawak': [13.9150, 121.1750],
  'Banaybanay': [13.9300, 121.1900],
  'Bolbok': [13.9480, 121.1700],
  'Bungahan': [13.9200, 121.1550],
  'Butong': [13.9100, 121.1650],
  'Dagatan': [13.9500, 121.1300],
  'Duhatan': [13.9550, 121.1400],
  'Halang': [13.9600, 121.1500],
  'Inosloban': [13.9350, 121.1850],
  'Kayumanggi': [13.9150, 121.1550],
  'Lamuan': [13.9250, 121.1700],
  'Latag': [13.9450, 121.1750],
  'Lodlod': [13.9480, 121.1800],
  'Lumbang': [13.9180, 121.1600],
  'Mabini': [13.9050, 121.1700],
  'Malagonlong': [13.9100, 121.1500],
  'Malitlit': [13.9200, 121.1850],
  'Marawoy': [13.9500, 121.1550],
  'Mataas na Lupa': [13.9550, 121.1600],
  'Munting Pulo': [13.9250, 121.1550],
  'Pagolingin Bata': [13.9600, 121.1700],
  'Pagolingin Silangan': [13.9650, 121.1750],
  'Pagolingin Sulok': [13.9700, 121.1800],
  'Palanas': [13.9100, 121.1800],
  'Payapa': [13.9000, 121.1600],
  'Pinagkawitan': [13.9450, 121.1550],
  'Pinagtongulan': [13.9350, 121.1500],
  'Plaridel': [13.9500, 121.1650],
  'Quezon': [13.9280, 121.1480],
  'Rizal': [13.9380, 121.1550],
  'Sabang': [13.9170, 121.1900],
  'San Benito': [13.9230, 121.1450],
  'San Carlos': [13.9480, 121.1450],
  'San Celestino': [13.9530, 121.1480],
  'San Francisco': [13.9330, 121.1480],
  'San Guillermo': [13.9450, 121.1480],
  'San Jose': [13.9280, 121.1600],
  'San Lorenzo Ruiz': [13.9550, 121.1700],
  'San Lucas I': [13.9230, 121.1700],
  'San Lucas II': [13.9210, 121.1750],
  'San Perfecto': [13.9530, 121.1750],
  'San Rafael': [13.9430, 121.1700],
  'San Sebastian': [13.9400, 121.1800],
  'Sapac': [13.9150, 121.1850],
  'Sico': [13.9000, 121.1500],
  'Soro-soro Ilaya': [13.9330, 121.1600],
  'Soro-soro Ibaba': [13.9310, 121.1620],
  'Soro-soro Proper': [13.9320, 121.1610],
  'Talisay': [13.9150, 121.1700],
  'Tambo': [13.9450, 121.1900],
  'Tangob': [13.9350, 121.1750],
  'Tanguay': [13.9500, 121.1850],
  'Tibig': [13.9050, 121.1550],
  'Tolentino East': [13.9600, 121.1600],
  'Tolentino West': [13.9580, 121.1580],
  'Wawa': [13.9700, 121.1700],
  'Cumba': [13.9650, 121.1850],
  'Antipolo del Norte': [13.9400, 121.1950],
  'Antipolo del Sur': [13.9380, 121.1970],
  'San Juan': [13.9550, 121.1850],
  'San Pedro': [13.9570, 121.1830],
  'Bulacnin': [13.9650, 121.1650],
  'Marauoy': [13.9500, 121.1555],
  'Bontog': [13.9780, 121.1800],
  // Barangays in neighboring Batangas municipalities
  'Tubigan': [14.3350, 121.0820],     // Biñan, Laguna
  'Escrabo': [13.8150, 121.4100],     // San Juan, Batangas
  'Baybayin': [13.8560, 121.2200],    // Rosario, Batangas
  'Cawongan': [13.7980, 121.1850],    // Garcia/Batangas area
}

function normalize(s: string) {
  return s.toLowerCase()
    .replace(/^brgy\.?\s+/, '')
    .replace(/^barangay\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function findCoords(barangay: string): [number, number] | null {
  const norm = normalize(barangay)
  for (const [key, coords] of Object.entries(BRGY_COORDS)) {
    if (normalize(key) === norm) return coords
  }
  // loose match — prefix or contains
  for (const [key, coords] of Object.entries(BRGY_COORDS)) {
    if (normalize(key).startsWith(norm) || norm.startsWith(normalize(key))) return coords
  }
  return null
}

const RISK_LEVELS = [
  { label: 'Low (1)',     min: 1, max: 1,  color: '#22c55e', textColor: 'text-green-600'  },
  { label: 'Medium (2–3)',min: 2, max: 3,  color: '#f59e0b', textColor: 'text-amber-600'  },
  { label: 'High (4–7)', min: 4, max: 7,  color: '#f97316', textColor: 'text-orange-600' },
  { label: 'Critical (8+)',min:8,max:999, color: '#ef4444', textColor: 'text-red-600'    },
]

function getRisk(count: number) {
  if (count <= 0) return { level: 'None',     color: '#94a3b8', radius: 5  }
  if (count === 1) return { level: 'Low',     color: '#22c55e', radius: 10 }
  if (count <= 3)  return { level: 'Medium',  color: '#f59e0b', radius: 15 }
  if (count <= 7)  return { level: 'High',    color: '#f97316', radius: 22 }
  return               { level: 'Critical', color: '#ef4444', radius: 30 }
}

export default function HazardMap() {
  const { records, loading } = usePestRecords()
  const [pestFilter, setPestFilter] = useState('All')

  const pestOptions = useMemo(() => {
    const s = new Set(records.map(r => r.detectedPest).filter(p => p !== 'Healthy' && p !== 'Unknown'))
    return ['All', ...Array.from(s).sort()]
  }, [records])

  const brgyData = useMemo(() => {
    const pestRecords = records.filter(r =>
      r.detectedPest !== 'Healthy' && r.detectedPest !== 'Unknown' &&
      (pestFilter === 'All' || r.detectedPest === pestFilter)
    )
    const map: Record<string, { count: number; pestCounts: Record<string, number> }> = {}
    for (const r of pestRecords) {
      const b = r.barangay || 'Unknown'
      if (!map[b]) map[b] = { count: 0, pestCounts: {} }
      map[b].count++
      map[b].pestCounts[r.detectedPest] = (map[b].pestCounts[r.detectedPest] ?? 0) + 1
    }
    return map
  }, [records, pestFilter])

  const markers = useMemo(() =>
    Object.entries(brgyData).map(([brgy, data]) => {
      const coords = findCoords(brgy)
      if (!coords) return null
      const topPest = Object.entries(data.pestCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
      return { brgy, coords, count: data.count, topPest }
    }).filter(Boolean) as Array<{ brgy: string; coords: [number, number]; count: number; topPest: string }>
  , [brgyData])

  const unmapped = useMemo(() => Object.keys(brgyData).filter(b => !findCoords(b)), [brgyData])

  const totalDetections = markers.reduce((s, m) => s + m.count, 0)
  const affectedBrgys = markers.length
  const highCount = markers.filter(m => m.count >= 4 && m.count <= 7).length
  const criticalCount = markers.filter(m => m.count >= 8).length

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pest Hazard Map</h1>
        <p className="text-sm text-gray-500">Geographic distribution of pest detections across Lipa City and Batangas barangays</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Affected Barangays', value: affectedBrgys, cls: 'text-gray-900' },
          { label: 'Total Detections',   value: totalDetections, cls: 'text-gray-900' },
          { label: 'High Risk Areas',    value: highCount,   cls: 'text-orange-600' },
          { label: 'Critical Areas',     value: criticalCount, cls: 'text-red-600'   },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
            <div className="text-xs text-gray-500 mb-0.5">{label}</div>
            <div className={`text-2xl font-bold ${cls}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Pest filter */}
      <div className="flex flex-wrap gap-2">
        {pestOptions.map(p => (
          <button key={p} onClick={() => setPestFilter(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              pestFilter === p ? 'bg-[#1E5128] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {p === 'All' ? 'All Pests' : p}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: 500 }}>
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading map data…</div>
        ) : (
          <MapContainer
            center={[13.9000, 121.2500]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            {markers.map(({ brgy, coords, count, topPest }) => {
              const { color, radius } = getRisk(count)
              return (
                <CircleMarker
                  key={brgy}
                  center={coords}
                  radius={radius}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.72, weight: 2 }}
                >
                  <MapTooltip>
                    <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                      <strong>{brgy}</strong><br />
                      Detections: <strong>{count}</strong><br />
                      Top pest: {topPest}<br />
                      Risk: <span style={{ color }}><strong>{getRisk(count).level}</strong></span>
                    </div>
                  </MapTooltip>
                </CircleMarker>
              )
            })}
          </MapContainer>
        )}
      </div>

      {/* Legend + top barangays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Legend */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Risk Level Legend</div>
          <div className="space-y-2">
            {RISK_LEVELS.map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="inline-block w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: color }} />
                {label}
              </div>
            ))}
            <div className="text-xs text-gray-400 mt-1">Circle size proportional to detection count</div>
          </div>
        </div>

        {/* Top affected barangays */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Top Affected Barangays</div>
          {markers.length === 0 ? (
            <p className="text-sm text-gray-400">No pest detections recorded.</p>
          ) : (
            <div className="space-y-2">
              {[...markers].sort((a, b) => b.count - a.count).slice(0, 6).map(({ brgy, count, topPest }) => {
                const { color, level } = getRisk(count)
                return (
                  <div key={brgy} className="flex items-center gap-2 text-sm">
                    <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="flex-1 text-gray-800 font-medium truncate">{brgy}</span>
                    <span className="text-gray-500 text-xs">{topPest}</span>
                    <span className="text-xs font-semibold w-6 text-right" style={{ color }}>{count}</span>
                    <span className="text-xs text-gray-400 w-14 text-right">{level}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Unmapped barangay warning */}
      {unmapped.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-700">
          <strong>Not plotted</strong> (barangay name not matched on map): {unmapped.join(', ')}
        </div>
      )}
    </div>
  )
}
