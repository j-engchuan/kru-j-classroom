'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!studentId || !password) {
      setError('กรุณากรอกรหัสนักเรียนและรหัสผ่าน')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data, error: dbErr } = await supabase
        .from('users')
        .select('*')
        .eq('student_id', studentId)
        .eq('password', password)
        .single()

      if (dbErr || !data) {
        setError('รหัสนักเรียนหรือรหัสผ่านไม่ถูกต้อง')
        setLoading(false)
        return
      }

      localStorage.setItem('kru_user', JSON.stringify(data))
      if (data.role === 'teacher') {
        router.push('/dashboard/teacher')
      } else {
        router.push('/dashboard/student')
      }
    } catch (e) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1e3a6e 0%, #2d5499 100%)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#1e3a6e' }}>
            <span className="text-white text-2xl">🏫</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Kru J Classroom</h1>
          <p className="text-gray-500 text-sm mt-1">ระบบติดตามงานนักเรียน</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสนักเรียน / ครู</label>
            <input
              type="text"
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="เช่น 12345"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#1e3a6e' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="รหัสผ่าน"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2"
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-60"
            style={{ background: '#1e3a6e' }}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">Kru J Classroom © 2568</p>
      </div>
    </div>
  )
}
