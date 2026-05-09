'use client'
import React, { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Btn, Card, Avatar, Badge, fmt, Skeleton } from '@/components/ui'
import { TopBar } from '@/components/layout'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  { id:'present', label:'Присутствует', icon:'✅', color:'var(--green)' },
  { id:'absent',  label:'Отсутствует',  icon:'❌', color:'var(--red)' },
  { id:'late',    label:'Опоздал',      icon:'⏰', color:'var(--amber)' },
  { id:'excused', label:'По уваж.',     icon:'📋', color:'var(--grey)' },
]

export default function AttendancePage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = use(params)
  const router = useRouter()
  const [lesson, setLesson] = useState<any>(null)
  const [group, setGroup] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [statuses, setStatuses] = useState<Record<string,string>>({})
  const [existingAttendance, setExistingAttendance] = useState<any[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: lesData } = await supabase.from('lessons').select('*, group:groups(*)').eq('id', lessonId).single()
      if (!lesData) { setLoading(false); return }
      setLesson(lesData)
      setGroup(lesData.group)

      const { data: sgData } = await supabase.from('student_groups').select('students(*)').eq('group_id', lesData.group_id)
      const enrolledStudents = sgData?.map((r: any) => r.students).filter(Boolean) || []
      setStudents(enrolledStudents)

      const { data: attData } = await supabase.from('attendance').select('*').eq('lesson_id', lessonId)
      if (attData) setExistingAttendance(attData)

      const init: Record<string,string> = {}
      enrolledStudents.forEach((s: any) => {
        const existing = attData?.find((a: any) => a.student_id === s.id)
        init[s.id] = existing?.status || 'present'
      })
      setStatuses(init)
      setLoading(false)
    }
    load()
  }, [lessonId])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const upserts = Object.entries(statuses).map(([student_id, status]) => ({
      lesson_id: lessonId,
      student_id,
      status,
    }))

    await supabase.from('attendance').upsert(upserts, { onConflict: 'lesson_id,student_id' })
    await supabase.from('lessons').update({ status: 'completed' }).eq('id', lessonId)

    if (notes) {
      await supabase.from('activity_log').insert({
        type: 'attendance',
        text: `Посещаемость отмечена — ${group?.name}`,
        icon: '✅'
      })
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => router.push('/schedule'), 1500)
  }

  const counts = { present:0, absent:0, late:0, excused:0 }
  Object.values(statuses).forEach(s => { if (s in counts) counts[s as keyof typeof counts]++ })

  if (loading) return <div style={{padding:32}}><Skeleton height={200} radius={12} /></div>
  if (!lesson) return <div style={{padding:32}}>Занятие не найдено</div>

  return (
    <div>
      <TopBar title="Отметить посещаемость" onBack={() => router.push('/schedule')} />
      <div style={{background:group?.color||'var(--primary)',padding:'16px 28px',color:'#fff',display:'flex',gap:24,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontWeight:800}}>{group?.name}</div>
          <div style={{opacity:0.85,fontSize:14,marginTop:4}}>{fmt.date(lesson.date)} · {lesson.start_time} · {lesson.topic}</div>
        </div>
        <div style={{display:'flex',gap:12}}>
          {Object.entries(counts).map(([s,c]) => {
            const opt = STATUS_OPTIONS.find(o=>o.id===s)
            return (
              <div key={s} style={{textAlign:'center',background:'rgba(255,255,255,0.15)',borderRadius:10,padding:'8px 14px'}}>
                <div style={{fontSize:18,fontWeight:800}}>{c}</div>
                <div style={{fontSize:11,opacity:0.8}}>{opt?.label}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{padding:'20px 28px',maxWidth:680}}>
        {saved ? (
          <div style={{textAlign:'center',padding:40}}>
            <div style={{fontSize:48}}>✅</div>
            <div style={{fontSize:18,fontWeight:700,marginTop:12}}>Посещаемость сохранена!</div>
          </div>
        ) : (
          <>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
              {students.map(s => {
                const status = statuses[s.id] || 'present'
                return (
                  <Card key={s.id} style={{padding:'14px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:14}}>
                      <Avatar name={s.name} size={42} />
                      <div style={{flex:1}}>
                        <div style={{fontSize:15,fontWeight:700,color:'var(--text)'}}>{s.name}</div>
                        <div style={{fontSize:12,color:'var(--text-faint)'}}>{s.birthday ? fmt.age(s.birthday) : '?'} лет · {s.parent_name}</div>
                      </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
                        <div style={{display:'flex',gap:6}}>
                          {STATUS_OPTIONS.map(opt => (
                            <button key={opt.id} onClick={() => setStatuses(prev => ({...prev,[s.id]:opt.id}))}
                              title={opt.label}
                              style={{
                                width:44,height:44,borderRadius:10,border:'2px solid',
                                borderColor:status===opt.id?opt.color:'var(--border)',
                                background:status===opt.id?opt.color+'22':'var(--surface)',
                                fontSize:20,cursor:'pointer',transition:'all 0.12s',
                                display:'flex',alignItems:'center',justifyContent:'center'
                              }}>{opt.icon}</button>
                          ))}
                        </div>
                        <div style={{fontSize:11,fontWeight:700,height:16,color:STATUS_OPTIONS.find(o=>o.id===status)?.color}}>
                          {STATUS_OPTIONS.find(o=>o.id===status)?.label}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
            {students.length === 0 && (
              <div style={{padding:'40px 0',textAlign:'center',color:'var(--text-muted)'}}>
                <div style={{fontSize:32,marginBottom:8}}>👥</div>
                <div>В этой группе нет учеников</div>
              </div>
            )}
            <div style={{marginBottom:16}}>
              <label style={{fontSize:13,fontWeight:600,color:'var(--text-muted)',display:'block',marginBottom:6}}>Заметка к занятию (необязательно)</label>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Тема занятия, особые моменты..."
                style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border)',fontSize:14,fontFamily:'inherit',resize:'vertical',minHeight:80,boxSizing:'border-box',outline:'none'}} />
            </div>
            <Btn full size="lg" onClick={handleSave} disabled={saving || students.length === 0}>
              {saving ? 'Сохранение...' : 'Сохранить посещаемость'}
            </Btn>
          </>
        )}
      </div>
    </div>
  )
}
