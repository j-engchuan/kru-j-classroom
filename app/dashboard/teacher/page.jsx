'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

export default function TeacherDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('dashboard')
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showGradeModal, setShowGradeModal] = useState(null)
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', classroom: 'ม.4/1', due_date: '' })
  const [gradeData, setGradeData] = useState({ score: '', feedback: '' })

  useEffect(() => {
    const u = localStorage.getItem('kru_user')
    if (!u) { router.push('/login'); return }
    const parsed = JSON.parse(u)
    if (parsed.role !== 'teacher') { router.push('/dashboard/student'); return }
    setUser(parsed)
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [a, s, u] = await Promise.all([
      supabase.from('assignments').select('*').order('created_at', { ascending: false }),
      supabase.from('submissions').select('*').order('submitted_at', { ascending: false }),
      supabase.from('users').select('*').eq('role', 'student').order('classroom')
    ])
    setAssignments(a.data || [])
    setSubmissions(s.data || [])
    setUsers(u.data || [])
    setLoading(false)
  }

  const addAssignment = async () => {
    if (!newAssignment.title) return
    await supabase.from('assignments').insert({
      ...newAssignment,
      teacher_name: user?.fullname || 'ครู'
    })
    setShowAddModal(false)
    setNewAssignment({ title: '', description: '', classroom: 'ม.4/1', due_date: '' })
    fetchAll()
  }

  const deleteAssignment = async (id) => {
    if (!confirm('ต้องการลบงานนี้?')) return
    await supabase.from('submissions').delete().eq('assignment_id', id)
    await supabase.from('assignments').delete().eq('id', id)
    fetchAll()
  }

  const saveGrade = async () => {
    if (!showGradeModal) return
    await supabase.from('submissions').update({
      score: parseInt(gradeData.score) || 0,
      feedback: gradeData.feedback,
      status: 'graded'
    }).eq('id', showGradeModal.id)
    setShowGradeModal(null)
    setGradeData({ score: '', feedback: '' })
    fetchAll()
  }

  const pendingCount = submissions.filter(s => s.status === 'submitted').length
  const gradedCount = submissions.filter(s => s.status === 'graded').length

  const classrooms = ['ม.1/1','ม.1/2','ม.2/1','ม.2/2','ม.3/1','ม.3/2','ม.4/1','ม.4/2','ม.5/1','ม.5/2','ม.6/1','ม.6/2']

  return (
    <div className="min-h-screen bg-slate-100">
      {user && <Navbar user={user} />}

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 shadow-sm">
          {[
            { id: 'dashboard', label: '📊 ภาพรวม' },
            { id: 'assignments', label: '📋 จัดการงาน' },
            { id: 'check', label: '✏️ ตรวจงาน' },
            { id: 'students', label: '👥 นักเรียน' },
            { id: 'admin', label: '⚙️ จัดการผู้ใช้' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 px-1 rounded-lg text-xs sm:text-sm font-medium transition-all ${tab === t.id ? 'text-white shadow' : 'text-gray-500 hover:bg-slate-50'}`}
              style={tab === t.id ? { background: '#1e3a6e' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>}

        {/* Dashboard */}
        {!loading && tab === 'dashboard' && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'งานทั้งหมด', value: assignments.length, color: '#1e3a6e' },
                { label: 'ส่งงานทั้งหมด', value: submissions.length, color: '#059669' },
                { label: 'รอตรวจ', value: pendingCount, color: '#d97706' },
                { label: 'ตรวจแล้ว', value: gradedCount, color: '#7c3aed' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
                  <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h2 className="font-semibold text-gray-700 mb-3">งานล่าสุด</h2>
              {assignments.slice(0, 5).map(a => {
                const subs = submissions.filter(s => s.assignment_id === a.id)
                const pct = users.filter(u => u.classroom === a.classroom).length > 0
                  ? Math.round((subs.length / users.filter(u => u.classroom === a.classroom).length) * 100)
                  : 0
                return (
                  <div key={a.id} className="border-b last:border-0 py-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{a.title}</p>
                        <p className="text-xs text-gray-400">{a.classroom} • ครบ {a.due_date ? new Date(a.due_date).toLocaleDateString('th-TH') : '-'}</p>
                      </div>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{subs.length} ส่งแล้ว</span>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#1e3a6e' }} />
                    </div>
                  </div>
                )
              })}
              {assignments.length === 0 && <p className="text-gray-400 text-sm text-center py-4">ยังไม่มีงาน</p>}
            </div>
          </div>
        )}

        {/* Assignments */}
        {!loading && tab === 'assignments' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">งานทั้งหมด ({assignments.length})</h2>
              <button onClick={() => setShowAddModal(true)} className="text-white text-sm px-4 py-2 rounded-xl hover:opacity-90" style={{ background: '#1e3a6e' }}>
                + เพิ่มงาน
              </button>
            </div>
            <div className="space-y-3">
              {assignments.map(a => (
                <div key={a.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{a.title}</p>
                      {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                      <div className="flex gap-3 mt-2 text-xs text-gray-400">
                        <span>🏫 {a.classroom}</span>
                        <span>📅 {a.due_date ? new Date(a.due_date).toLocaleDateString('th-TH') : 'ไม่กำหนด'}</span>
                        <span>📨 {submissions.filter(s => s.assignment_id === a.id).length} ส่งแล้ว</span>
                      </div>
                    </div>
                    <button onClick={() => deleteAssignment(a.id)} className="text-red-400 hover:text-red-600 text-xs ml-2 mt-1">ลบ</button>
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                  <p className="text-4xl mb-2">📋</p>
                  <p>ยังไม่มีงาน กด + เพิ่มงาน เพื่อเริ่ม</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Check */}
        {!loading && tab === 'check' && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-4">รายการส่งงานที่รอตรวจ ({pendingCount})</h2>
            <div className="space-y-3">
              {submissions.filter(s => s.status === 'submitted').map(sub => {
                const assignment = assignments.find(a => a.id === sub.assignment_id)
                const student = users.find(u => u.student_id === sub.student_id)
                return (
                  <div key={sub.id} className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{student?.fullname || sub.student_id}</p>
                        <p className="text-sm text-gray-500">{assignment?.title}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          ส่งเมื่อ {new Date(sub.submitted_at).toLocaleString('th-TH')}
                        </p>
                        {sub.file_url && (
                          <a href={sub.file_url} target="_blank" rel="noreferrer"
                            className="inline-block mt-2 text-xs text-blue-600 hover:underline">
                            📎 ดูไฟล์งาน
                          </a>
                        )}
                      </div>
                      <button
                        onClick={() => { setShowGradeModal(sub); setGradeData({ score: '', feedback: '' }) }}
                        className="text-white text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: '#1e3a6e' }}
                      >
                        ให้คะแนน
                      </button>
                    </div>
                  </div>
                )
              })}
              {pendingCount === 0 && (
                <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                  <p className="text-4xl mb-2">✅</p>
                  <p>ตรวจงานครบแล้ว!</p>
                </div>
              )}
            </div>

            {gradedCount > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-600 mb-3">ตรวจแล้ว ({gradedCount})</h3>
                <div className="space-y-2">
                  {submissions.filter(s => s.status === 'graded').map(sub => {
                    const student = users.find(u => u.student_id === sub.student_id)
                    const assignment = assignments.find(a => a.id === sub.assignment_id)
                    return (
                      <div key={sub.id} className="bg-white rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{student?.fullname || sub.student_id}</p>
                          <p className="text-xs text-gray-400">{assignment?.title}</p>
                        </div>
                        <span className="text-lg font-bold text-green-600">{sub.score}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Students */}
        {!loading && tab === 'students' && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-4">นักเรียนทั้งหมด ({users.length} คน)</h2>
            {classrooms.map(cls => {
              const clsStudents = users.filter(u => u.classroom === cls)
              if (clsStudents.length === 0) return null
              return (
                <div key={cls} className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
                  <div className="px-4 py-3 flex justify-between items-center" style={{ background: '#f8fafc' }}>
                    <h3 className="font-semibold text-gray-700">{cls}</h3>
                    <span className="text-xs text-gray-400">{clsStudents.length} คน</span>
                  </div>
                  {clsStudents.map(s => {
                    const subs = submissions.filter(sub => sub.student_id === s.student_id)
                    const graded = subs.filter(sub => sub.status === 'graded')
                    const avgScore = graded.length > 0
                      ? Math.round(graded.reduce((acc, sub) => acc + (sub.score || 0), 0) / graded.length)
                      : null
                    return (
                      <div key={s.id} className="px-4 py-3 border-t flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{s.fullname}</p>
                          <p className="text-xs text-gray-400">รหัส: {s.student_id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-700">{subs.length} งานส่ง</p>
                          {avgScore !== null && <p className="text-xs text-green-600">เฉลี่ย {avgScore} คะแนน</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
            {users.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                <p className="text-4xl mb-2">👥</p>
                <p>ยังไม่มีนักเรียนในระบบ ไปที่ "จัดการผู้ใช้" เพื่อเพิ่ม</p>
              </div>
            )}
          </div>
        )}

        {/* Admin */}
        {!loading && tab === 'admin' && (
          <AdminTab users={users} onRefresh={fetchAll} />
        )}
      </div>

      {/* Modal: Add Assignment */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-gray-800 mb-4">เพิ่มงานใหม่</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">ชื่องาน *</label>
                <input className="w-full border rounded-xl px-3 py-2 text-sm"
                  value={newAssignment.title} onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="เช่น รายงานบทที่ 3" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">รายละเอียด</label>
                <textarea className="w-full border rounded-xl px-3 py-2 text-sm" rows={3}
                  value={newAssignment.description} onChange={e => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  placeholder="คำอธิบายงาน..." />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">ห้องเรียน</label>
                <select className="w-full border rounded-xl px-3 py-2 text-sm"
                  value={newAssignment.classroom} onChange={e => setNewAssignment({ ...newAssignment, classroom: e.target.value })}>
                  {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">วันครบกำหนด</label>
                <input type="datetime-local" className="w-full border rounded-xl px-3 py-2 text-sm"
                  value={newAssignment.due_date} onChange={e => setNewAssignment({ ...newAssignment, due_date: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)} className="flex-1 border rounded-xl py-2 text-sm text-gray-600 hover:bg-gray-50">ยกเลิก</button>
              <button onClick={addAssignment} className="flex-1 text-white rounded-xl py-2 text-sm hover:opacity-90" style={{ background: '#1e3a6e' }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Grade */}
      {showGradeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-gray-800 mb-1">ให้คะแนน</h3>
            <p className="text-sm text-gray-500 mb-4">{users.find(u => u.student_id === showGradeModal.student_id)?.fullname}</p>
            {showGradeModal.file_url && (
              <a href={showGradeModal.file_url} target="_blank" rel="noreferrer"
                className="block mb-4 text-sm text-blue-600 hover:underline">
                📎 ดูไฟล์งานที่ส่ง
              </a>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">คะแนน</label>
                <input type="number" className="w-full border rounded-xl px-3 py-2 text-sm" placeholder="เช่น 18"
                  value={gradeData.score} onChange={e => setGradeData({ ...gradeData, score: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">ความคิดเห็น / Feedback</label>
                <textarea className="w-full border rounded-xl px-3 py-2 text-sm" rows={3}
                  placeholder="เช่น ทำได้ดีมาก ควรปรับปรุง..."
                  value={gradeData.feedback} onChange={e => setGradeData({ ...gradeData, feedback: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowGradeModal(null)} className="flex-1 border rounded-xl py-2 text-sm text-gray-600">ยกเลิก</button>
              <button onClick={saveGrade} className="flex-1 text-white rounded-xl py-2 text-sm" style={{ background: '#1e3a6e' }}>บันทึกคะแนน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminTab({ users, onRefresh }) {
  const [form, setForm] = useState({ student_id: '', fullname: '', classroom: 'ม.4/1', role: 'student', password: '1234' })
  const [msg, setMsg] = useState('')
  const classrooms = ['ม.1/1','ม.1/2','ม.2/1','ม.2/2','ม.3/1','ม.3/2','ม.4/1','ม.4/2','ม.5/1','ม.5/2','ม.6/1','ม.6/2']

  const addUser = async () => {
    if (!form.student_id || !form.fullname) { setMsg('กรุณากรอกรหัสและชื่อ'); return }
    const { error } = await supabase.from('users').insert(form)
    if (error) { setMsg('เกิดข้อผิดพลาด: ' + error.message); return }
    setMsg('เพิ่มผู้ใช้สำเร็จ!')
    setForm({ student_id: '', fullname: '', classroom: 'ม.4/1', role: 'student', password: '1234' })
    onRefresh()
    setTimeout(() => setMsg(''), 3000)
  }

  const deleteUser = async (id) => {
    if (!confirm('ต้องการลบผู้ใช้นี้?')) return
    await supabase.from('users').delete().eq('id', id)
    onRefresh()
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="font-semibold text-gray-700 mb-3">เพิ่มผู้ใช้ใหม่</h3>
        {msg && <p className="text-sm text-green-600 mb-3">{msg}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">รหัสนักเรียน *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="เช่น 12345"
              value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">ชื่อ-นามสกุล *</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="ชื่อเต็ม"
              value={form.fullname} onChange={e => setForm({ ...form, fullname: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">บทบาท</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="student">นักเรียน</option>
              <option value="teacher">ครู</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">ห้องเรียน</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.classroom} onChange={e => setForm({ ...form, classroom: e.target.value })}>
              {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500 mb-1 block">รหัสผ่านเริ่มต้น</label>
            <input className="w-full border rounded-lg px-3 py-2 text-sm"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
        </div>
        <button onClick={addUser} className="w-full mt-3 text-white py-2 rounded-xl text-sm hover:opacity-90" style={{ background: '#1e3a6e' }}>
          เพิ่มผู้ใช้
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-50">
          <h3 className="font-semibold text-gray-700">ผู้ใช้ทั้งหมด ({users.length} คน)</h3>
        </div>
        {users.map(u => (
          <div key={u.id} className="px-4 py-3 border-t flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-800">{u.fullname}</p>
              <p className="text-xs text-gray-400">รหัส: {u.student_id} • {u.classroom}</p>
            </div>
            <button onClick={() => deleteUser(u.id)} className="text-red-400 text-xs hover:text-red-600">ลบ</button>
          </div>
        ))}
        {users.length === 0 && <p className="text-center text-gray-400 text-sm py-6">ยังไม่มีนักเรียน</p>}
      </div>
    </div>
  )
}
