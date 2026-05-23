'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

export default function StudentDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('assignments')
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitModal, setSubmitModal] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  useEffect(() => {
    const u = localStorage.getItem('kru_user')
    if (!u) { router.push('/login'); return }
    const parsed = JSON.parse(u)
    if (parsed.role === 'teacher') { router.push('/dashboard/teacher'); return }
    setUser(parsed)
    fetchData(parsed)
  }, [])

  const fetchData = async (u) => {
    setLoading(true)
    const [a, s] = await Promise.all([
      supabase.from('assignments').select('*').eq('classroom', u.classroom).order('due_date'),
      supabase.from('submissions').select('*').eq('student_id', u.student_id)
    ])
    setAssignments(a.data || [])
    setSubmissions(s.data || [])
    setLoading(false)
  }

  const isSubmitted = (assignmentId) => submissions.find(s => s.assignment_id === assignmentId)
  const isOverdue = (due) => due && new Date(due) < new Date()

  const handleSubmit = async () => {
    if (!submitModal) return
    setUploading(true)
    setUploadMsg('')
    try {
      let fileUrl = null
      if (file) {
        const ext = file.name.split('.').pop()
        const path = `${user.student_id}/${submitModal.id}_${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('assignments').upload(path, file)
        if (upErr) throw upErr
        const { data: urlData } = supabase.storage.from('assignments').getPublicUrl(path)
        fileUrl = urlData.publicUrl
      }

      const existing = isSubmitted(submitModal.id)
      if (existing) {
        await supabase.from('submissions').update({
          file_url: fileUrl,
          status: 'submitted',
          submitted_at: new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString()
        }).eq('id', existing.id)
      } else {
        await supabase.from('submissions').insert({
          assignment_id: submitModal.id,
          student_id: user.student_id,
          file_url: fileUrl,
          status: 'submitted',
          submitted_at: new Date(new Date().getTime() + 7 * 60 * 60 * 1000).toISOString()
        })
      }
      setUploadMsg('ส่งงานสำเร็จ!')
      setTimeout(() => {
        setSubmitModal(null)
        setFile(null)
        setUploadMsg('')
        fetchData(user)
      }, 1500)
    } catch (e) {
      setUploadMsg('เกิดข้อผิดพลาด: ' + e.message)
    }
    setUploading(false)
  }

  const submitted = assignments.filter(a => isSubmitted(a.id))
  const pending = assignments.filter(a => !isSubmitted(a.id))

  return (
    <div className="min-h-screen bg-slate-100">
      {user && <Navbar user={user} />}

      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm">
          {[
            { id: 'assignments', label: '📋 งานของฉัน' },
            { id: 'scores', label: '📊 คะแนน' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'text-white' : 'text-gray-500 hover:bg-slate-50'}`}
              style={tab === t.id ? { background: '#1e3a6e' } : {}}>
              {t.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>}

        {!loading && tab === 'assignments' && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'งานทั้งหมด', value: assignments.length, color: '#1e3a6e' },
                { label: 'ส่งแล้ว', value: submitted.length, color: '#059669' },
                { label: 'ยังไม่ส่ง', value: pending.length, color: '#dc2626' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {pending.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-red-600 mb-2">⚠️ ยังไม่ได้ส่ง ({pending.length} งาน)</h3>
                <div className="space-y-3">
                  {pending.map(a => (
                    <div key={a.id} className="bg-white rounded-xl shadow-sm p-4 border-l-4" style={{ borderLeftColor: isOverdue(a.due_date) ? '#dc2626' : '#d97706' }}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{a.title}</p>
                          {a.description && <p className="text-xs text-gray-500 mt-1">{a.description}</p>}
                          <p className="text-xs mt-1" style={{ color: isOverdue(a.due_date) ? '#dc2626' : '#d97706' }}>
                            📅 {a.due_date ? new Date(a.due_date).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : 'ไม่กำหนด'}
                            {isOverdue(a.due_date) && ' (เกินกำหนด)'}
                          </p>
                        </div>
                        <button onClick={() => { setSubmitModal(a); setFile(null); setUploadMsg('') }}
                          className="text-white text-xs px-3 py-1.5 rounded-lg ml-2 whitespace-nowrap"
                          style={{ background: '#1e3a6e' }}>
                          ส่งงาน
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {submitted.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-600 mb-2">✅ ส่งแล้ว ({submitted.length} งาน)</h3>
                <div className="space-y-2">
                  {submitted.map(a => {
                    const sub = isSubmitted(a.id)
                    return (
                      <div key={a.id} className="bg-white rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{a.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">ส่งเมื่อ {new Date(sub.submitted_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            {sub.status === 'graded' && (
                              <span className="text-green-600 font-bold text-sm">{sub.score} คะแนน</span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${sub.status === 'graded' ? 'bg-purple-50 text-purple-700' : 'bg-green-50 text-green-700'}`}>
                              {sub.status === 'graded' ? 'ตรวจแล้ว' : 'รอตรวจ'}
                            </span>
                            {sub.status !== 'graded' && (
                              <button onClick={() => { setSubmitModal(a); setFile(null); setUploadMsg('') }}
                                className="text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap"
                                style={{ background: '#64748b' }}>
                                ส่งใหม่
                              </button>
                            )}
                          </div>
                        </div>
                        {sub.file_url && (
                          <a href={sub.file_url} target="_blank" rel="noreferrer"
                            className="inline-block mt-2 text-xs text-blue-500 hover:underline">
                            📎 ดูไฟล์ที่ส่ง
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {assignments.length === 0 && (
              <div className="bg-white rounded-xl p-10 text-center text-gray-400">
                <p className="text-4xl mb-2">📭</p>
                <p>ยังไม่มีงานในห้อง {user?.classroom}</p>
              </div>
            )}
          </div>
        )}

        {!loading && tab === 'scores' && (
          <div>
            <div className="space-y-3">
              {submissions.filter(s => s.status === 'graded').map(sub => {
                const a = assignments.find(a => a.id === sub.assignment_id)
                return (
                  <div key={sub.id} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">{a?.title || 'งาน'}</p>
                        {sub.feedback && <p className="text-sm text-gray-500 mt-1">💬 {sub.feedback}</p>}
                      </div>
                      <span className="text-2xl font-bold text-green-600">{sub.score}</span>
                    </div>
                  </div>
                )
              })}
              {submissions.filter(s => s.status === 'graded').length === 0 && (
                <div className="bg-white rounded-xl p-10 text-center text-gray-400">
                  <p className="text-4xl mb-2">📊</p>
                  <p>ยังไม่มีคะแนน</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {submitModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-gray-800 mb-1">ส่งงาน</h3>
            <p className="text-sm text-gray-500 mb-4">{submitModal.title}</p>

            {uploadMsg && (
              <div className={`text-sm rounded-lg px-4 py-2 mb-3 ${uploadMsg.includes('สำเร็จ') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {uploadMsg}
              </div>
            )}

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center mb-4 cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => document.getElementById('fileInput').click()}>
              {file ? (
                <div>
                  <p className="text-2xl mb-1">📎</p>
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-3xl mb-2">☁️</p>
                  <p className="text-sm text-gray-500">แตะเพื่ออัปโหลดไฟล์</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, Word, รูปภาพ</p>
                </div>
              )}
            </div>
            <input id="fileInput" type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={e => setFile(e.target.files[0])} />

            <div className="flex gap-3">
              <button onClick={() => setSubmitModal(null)} className="flex-1 border rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={handleSubmit} disabled={uploading || !file}
                className="flex-1 text-white rounded-xl py-2 text-sm disabled:opacity-50"
                style={{ background: '#1e3a6e' }}>
                {uploading ? 'กำลังส่ง...' : 'ส่งงาน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

