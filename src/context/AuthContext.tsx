import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FirebaseUser = any

interface AuthCtx {
  user: FirebaseUser | null
  userName: string
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({} as AuthCtx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, async u => {
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid))
        if (!snap.exists() || snap.data().role !== 'admin') {
          // Non-MAO user — sign out silently, never expose the dashboard
          await signOut(auth)
          setUser(null)
          setUserName('')
          setLoading(false)
          return
        }
        setUserName(snap.data().name ?? '')
        setUser(u)
      } else {
        setUser(null)
        setUserName('')
      }
      setLoading(false)
    })
  }, [])

  async function login(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    // Only MAO admins may use the web dashboard
    const snap = await getDoc(doc(db, 'users', cred.user.uid))
    if (!snap.exists() || snap.data().role !== 'admin') {
      await signOut(auth)
      throw new Error('Access restricted to MAO officers.')
    }
  }

  return (
    <Ctx.Provider value={{ user, userName, loading, login, logout: () => signOut(auth) }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
