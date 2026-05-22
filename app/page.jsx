'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    const user = localStorage.getItem('kru_user')
    if (user) {
      const u = JSON.parse(user)
      router.push(u.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student')
    } else {
      router.push('/login')
    }
  }, [])
  return <div className="min-h-screen bg-slate-100 flex items-center justify-center">
    <p className="text-slate-400">กำลังโหลด...</p>
  </div>
}
