'use client'
import { useRouter } from 'next/navigation'

export default function Navbar({ user }) {
  const router = useRouter()
  const logout = () => {
    localStorage.removeItem('kru_user')
    router.push('/login')
  }
  return (
    <nav className="text-white px-4 py-3 flex items-center justify-between shadow-md" style={{ background: '#1e3a6e' }}>
      <div className="flex items-center gap-3">
        <span className="text-xl">🏫</span>
        <span className="font-bold text-lg">Kru J Classroom</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">{user?.fullname}</p>
          <p className="text-xs text-blue-200">{user?.role === 'teacher' ? 'ครู' : `ห้อง ${user?.classroom}`}</p>
        </div>
        <button
          onClick={logout}
          className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-lg transition-all"
        >
          ออกจากระบบ
        </button>
      </div>
    </nav>
  )
}
