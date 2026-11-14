import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { BookOpen, CheckCircle, Clock, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface LibraryEntry {
  key: string
  name: string
  description: string
  chemicalStatus: string
  activeIngredient: string
  product: string
  dosage: string
  application: string
  safety: string[]
  verifiedBy: string
}

function EntryCard({ entry, officerName, officerId }: { entry: LibraryEntry; officerName: string; officerId: string }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...entry })
  const [saving, setSaving] = useState(false)
  const isVerified = entry.chemicalStatus === 'verified'

  async function save() {
    setSaving(true)
    await updateDoc(doc(db, 'pest_library', entry.key), {
      'chemical.status': 'verified',
      'chemical.activeIngredient': form.activeIngredient,
      'chemical.product': form.product,
      'chemical.dosage': form.dosage,
      'chemical.application': form.application,
      'chemical.verifiedBy': `${officerName} (${officerId}) — ${new Date().toLocaleDateString('en-PH')}`,
      updatedAt: Timestamp.now(),
    })
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 text-left" onClick={() => setOpen(o => !o)}>
        <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${isVerified ? 'bg-green-100' : 'bg-amber-100'}`}>
          {isVerified ? <CheckCircle size={18} className="text-green-600" /> : <Clock size={18} className="text-amber-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900">{entry.name}</div>
          <div className="text-xs text-gray-500 truncate">{entry.description}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {isVerified ? 'Verified' : 'Pending verification'}
        </span>
        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-gray-100 px-5 py-4">
          {!editing ? (
            <div className="space-y-3">
              {entry.activeIngredient && (
                <div>
                  <div className="text-xs text-gray-500 font-medium">Active Ingredient</div>
                  <div className="text-sm text-gray-800">{entry.activeIngredient}</div>
                </div>
              )}
              {entry.product && (
                <div>
                  <div className="text-xs text-gray-500 font-medium">Product</div>
                  <div className="text-sm text-gray-800">{entry.product}</div>
                </div>
              )}
              {entry.dosage && (
                <div>
                  <div className="text-xs text-gray-500 font-medium">Dosage</div>
                  <div className="text-sm text-gray-800">{entry.dosage}</div>
                </div>
              )}
              {entry.application && (
                <div>
                  <div className="text-xs text-gray-500 font-medium">Application</div>
                  <div className="text-sm text-gray-800">{entry.application}</div>
                </div>
              )}
              {entry.verifiedBy && (
                <div className="text-xs text-gray-400">Verified by: {entry.verifiedBy}</div>
              )}
              <button onClick={() => setEditing(true)}
                className="mt-2 px-4 py-2 bg-[#1E5128] hover:bg-[#2D6A4F] text-white text-sm font-medium rounded-lg transition-colors">
                {isVerified ? 'Edit Guidance' : 'Add & Verify Guidance'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Active Ingredient', key: 'activeIngredient' as const },
                { label: 'Product Name', key: 'product' as const },
                { label: 'Dosage', key: 'dosage' as const },
                { label: 'Application Timing', key: 'application' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5128]" />
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={save} disabled={saving}
                  className="flex-1 py-2 bg-[#1E5128] text-white text-sm font-semibold rounded-lg hover:bg-[#2D6A4F] transition-colors disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save & Verify'}
                </button>
                <button onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Library() {
  const { user, userName } = useAuth()
  const [entries, setEntries] = useState<LibraryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onSnapshot(collection(db, 'pest_library'), snap => {
      const list: LibraryEntry[] = snap.docs.map(d => {
        const data = d.data()
        const c = data.chemical ?? {}
        return {
          key: d.id,
          name: data.name ?? d.id,
          description: data.description ?? '',
          chemicalStatus: c.status ?? 'pending_verification',
          activeIngredient: c.activeIngredient ?? '',
          product: c.product ?? '',
          dosage: c.dosage ?? '',
          application: c.application ?? '',
          safety: c.safety ?? [],
          verifiedBy: c.verifiedBy ?? '',
        }
      })
      list.sort((a, b) => a.name.localeCompare(b.name))
      setEntries(list)
      setLoading(false)
    })
  }, [])

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Pest Library</h1>
        <p className="text-sm text-gray-500">Manage and verify pesticide recommendations shown to farmers</p>
      </div>

      <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
        <strong>Note:</strong> Only update pesticide guidance after confirming the product is FPA-registered and available in your municipality. The dosage shown to farmers comes directly from this library.
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
          No library entries yet.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(e => (
            <EntryCard key={e.key} entry={e} officerName={userName} officerId={user?.uid ?? ''} />
          ))}
        </div>
      )}
    </div>
  )
}
