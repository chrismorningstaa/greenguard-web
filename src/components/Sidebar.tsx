import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Bug, Users, ClipboardList,
  BarChart2, BookOpen, LogOut, Leaf, Map,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/',           label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/records',    label: 'Detection Records', icon: Bug },
  { to: '/farmers',    label: 'Farmers',           icon: Users },
  { to: '/assistance', label: 'Assistance',        icon: ClipboardList },
  { to: '/analytics',  label: 'Analytics',         icon: BarChart2 },
  { to: '/hazardmap',  label: 'Hazard Map',        icon: Map },
  { to: '/library',    label: 'Pest Library',      icon: BookOpen },
]

export default function Sidebar() {
  const { userName, logout } = useAuth()

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#1E5128] text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
          <Leaf size={20} />
        </div>
        <div>
          <div className="font-bold text-sm leading-tight">GreenGuard</div>
          <div className="text-white/50 text-xs">MAO Dashboard</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-white/20 font-semibold'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="text-xs text-white/50 mb-1">Signed in as</div>
        <div className="text-sm font-medium truncate">{userName || 'MAO Officer'}</div>
        <button
          onClick={logout}
          className="mt-3 flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  )
}
