'use client'
import React, { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Btn, Card, Badge, Tabs, EmptyState, Avatar, AttendanceDot, Modal, Input, Select, fmt, Skeleton } from '@/components/ui'
import { TopBar } from '@/components/layout'
import { useRouter } from 'next/navigation'
import type { Group, Student, Lesson, Employee } from '@/types'

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [group, setGroup] = useState<Group | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('roster')
  const [showEdit, setShowEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const [grpRes, sgRes, lesRes, empRes] = await Promise.all([
      supabase.from('groups').select('*, teacher:employees(id,name)').eq('id', id).single(),
      supabase.from('student_groups').select('students(*)').eq('group_id', id),
      supabase.from('lessons').select('*').eq('group_id', id).order('date').order('start_time'),
      supabase.from('employees').select('*').eq('active', true).order('name'),
    ])
    if (grpRes.data) setGroup(grpRes.data as any)
    if (sgRes.data) setStudents(sgRes.data.map((r: any) => r.students).filter(Boolean))
    if (lesRes.data) setLessons(lesRes.data)
    if (empRes.data) setEmployees(empRes.data)

    const lessonIds = lesRes.data?.map((l: any) => l.id) || []
    if (lessonIds.length > 0) {
      const { data: attData } = await supabase.from('attendance').select('*').in('lesson_id', lessonIds)
      if (attData) setAttendance(attData)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const handleDelete = async () => {
    if (!group) return
    if (!confirm(`Удалить группу «${group.name}»? Все занятия и записи посещаемости этой группы будут удалены безвозвратно.`)) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('groups').delete().eq('id', group.id)
    if (error) {
      alert('Ошибка при удалении: ' + error.message)
      setDeleting(false)
      return
    }
    router.push('/groups')
  }

  if (loading) return <div style={{padding:32}}><Skeleton height={200} radius={12} /></div>
  if (!group) return <div style={{padding:32}}>Группа не найдена</div>

  const teacher = (group as any).teacher
  const upcoming = lessons.filter(l => l.status === 'scheduled')
  const past = lessons.filter(l => l.status === 'completed')

  const getAttendance = (lessonId: string, studentId: string) => {
    return attendance.find(a => a.lesson_id === lessonId && a.student_id === studentId)?.status || null
  }

  return (
    <div>
      <TopBar title={group.name} onBack={() => router.push('/groups')}
        actions={
          <div style={{display:'flex',gap:8}}>
            <Btn variant="outline" size="sm" icon="✏️" onClick={() => setShowEdit(true)}>Редактировать</Btn>
            <Btn variant="danger" size="sm" icon="🗑" onClick={handleDelete} disabled={deleting}>{deleting ? 'Удаление...' : 'Удалить'}</Btn>
            {upcoming[0] && <Btn size="sm" icon="✅" onClick={() => router.push(`/attendance/${upcoming[0].id}`)}>Отметить посещаемость</Btn>}
          </div>
        }
      />

      <div style={{background:group.color,padding:'20px 28px',display:'flex',gap:24,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{flex:1}}>
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            <span style={{background:'rgba(255,255,255,0.25)',color:'#fff',padding:'3px 10px',borderRadius:20,fontSize:12,fontWeight:700}}>{group.kit_type}</span>
            <Badge status={group.level} />
          </div>
          <div style={{color:'rgba(255,255,255,0.85)',fontSize:14,display:'flex',gap:16,flexWrap:'wrap'}}>
            {teacher && <span>👤 {teacher.name}</span>}
            <span>🕐 {group.days} · {group.time}</span>
            <span>⏱ {group.duration} мин</span>
            {group.age_range && <span>🎂 {group.age_range} лет</span>}
          </div>
        </div>
        <div style={{display:'flex',gap:12}}>
          {[['Учеников',students.length],['Занятий',lessons.length],['Прошло',past.length]].map(([l,v]) => (
            <div key={l as string} style={{textAlign:'center',background:'rgba(255,255,255,0.15)',borderRadius:12,padding:'10px 20px'}}>
              <div style={{fontSize:24,fontWeight:800,color:'#fff'}}>{v}</div>
              <div style={{fontSize:12,color:'rgba(255,255,255,0.75)'}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:'20px 28px'}}>
        <Tabs tabs={[{id:'roster',label:'Список учеников'},{id:'schedule',label:'Расписание'},{id:'attendance',label:'Посещаемость'}]} active={tab} onChange={setTab} />

        {tab === 'roster' && (
          students.length === 0 ? <EmptyState icon="👤" title="Нет учеников" subtitle="Добавьте учеников в эту группу" /> : (
            <Card style={{overflow:'hidden'}}>
              {students.map((s, i) => (
                <div key={s.id} onClick={() => router.push(`/students/${s.id}`)}
                  style={{display:'flex',alignItems:'center',gap:14,padding:'14px 20px',borderBottom:i<students.length-1?'1px solid var(--border)':'none',cursor:'pointer',transition:'background 0.1s'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--bg)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                  <Avatar name={s.name} size={38} />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14}}>{s.name}</div>
                    <div style={{fontSize:12,color:'var(--text-faint)'}}>{s.birthday ? fmt.age(s.birthday) : '?'} лет · {s.parent_name} · {s.parent_phone}</div>
                  </div>
                  <div style={{display:'flex',gap:4,alignItems:'center'}}>
                    {past.slice(-5).map(l => <AttendanceDot key={l.id} status={getAttendance(l.id, s.id) || 'absent'} />)}
                  </div>
                  <Badge status={s.payment_status} />
                </div>
              ))}
            </Card>
          )
        )}

        {tab === 'schedule' && (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {upcoming.length > 0 && (
              <>
                <div style={{fontSize:13,fontWeight:700,color:'var(--text-muted)',marginBottom:4}}>ПРЕДСТОЯЩИЕ</div>
                {upcoming.map(l => (
                  <Card key={l.id} style={{padding:'14px 20px',display:'flex',gap:16,alignItems:'center'}}>
                    <div style={{width:4,height:40,borderRadius:4,background:group.color,flexShrink:0}} />
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14}}>{l.topic}</div>
                      <div style={{fontSize:12,color:'var(--text-faint)',marginTop:2}}>{fmt.date(l.date)} · {l.start_time}</div>
                    </div>
                    <Btn size="sm" variant="secondary" onClick={() => router.push(`/attendance/${l.id}`)}>Отметить</Btn>
                  </Card>
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <div style={{fontSize:13,fontWeight:700,color:'var(--text-muted)',margin:'12px 0 4px'}}>ПРОШЕДШИЕ</div>
                {past.map(l => (
                  <Card key={l.id} style={{padding:'14px 20px',display:'flex',gap:16,alignItems:'center',opacity:0.7}}>
                    <div style={{width:4,height:40,borderRadius:4,background:'var(--grey)',flexShrink:0}} />
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:14,color:'var(--text-muted)'}}>{l.topic}</div>
                      <div style={{fontSize:12,color:'var(--text-faint)',marginTop:2}}>{fmt.date(l.date)} · {l.start_time}</div>
                    </div>
                    <Badge status="neutral" text="Завершено" />
                  </Card>
                ))}
              </>
            )}
            {lessons.length === 0 && <EmptyState icon="📅" title="Занятий нет" />}
          </div>
        )}

        <EditGroupModal open={showEdit} onClose={() => setShowEdit(false)} group={group} employees={employees} onSaved={load} />

        {tab === 'attendance' && (
          past.length === 0 ? <EmptyState icon="📋" title="Нет прошедших занятий" /> : (
            <Card style={{overflow:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',minWidth:500}}>
                <thead>
                  <tr style={{borderBottom:'1.5px solid var(--border)'}}>
                    <th style={{padding:'12px 16px',textAlign:'left',fontSize:12,fontWeight:700,color:'var(--text-muted)'}}>Ученик</th>
                    {past.map(l => (
                      <th key={l.id} style={{padding:'12px 12px',textAlign:'center',fontSize:11,fontWeight:700,color:'var(--text-muted)',whiteSpace:'nowrap'}}>{fmt.shortDate(l.date)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s,i) => (
                    <tr key={s.id} style={{borderBottom:i<students.length-1?'1px solid var(--border)':'none'}}>
                      <td style={{padding:'10px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <Avatar name={s.name} size={28} />
                          <span style={{fontSize:13,fontWeight:600}}>{s.name}</span>
                        </div>
                      </td>
                      {past.map(l => (
                        <td key={l.id} style={{padding:'10px 12px',textAlign:'center'}}>
                          <AttendanceDot status={getAttendance(l.id, s.id) || 'absent'} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )
        )}
      </div>
    </div>
  )
}

function EditGroupModal({ open, onClose, group, employees, onSaved }: {
  open: boolean; onClose: () => void; group: Group; employees: Employee[]; onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: group.name,
    level: group.level,
    teacherId: (group as any).teacher?.id || '',
    days: group.days || '',
    time: group.time || '',
    duration: String(group.duration || 90),
    maxStudents: String(group.max_students || 8),
    color: group.color || '#0ea5e9',
    ageRange: group.age_range || '',
    kitType: group.kit_type || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string) => (v: string) => setForm(f => ({...f,[k]:v}))

  useEffect(() => {
    setForm({
      name: group.name,
      level: group.level,
      teacherId: (group as any).teacher?.id || '',
      days: group.days || '',
      time: group.time || '',
      duration: String(group.duration || 90),
      maxStudents: String(group.max_students || 8),
      color: group.color || '#0ea5e9',
      ageRange: group.age_range || '',
      kitType: group.kit_type || '',
    })
  }, [group])

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('groups').update({
      name: form.name,
      level: form.level,
      teacher_id: form.teacherId || null,
      days: form.days,
      time: form.time,
      duration: parseInt(form.duration),
      max_students: parseInt(form.maxStudents),
      color: form.color,
      age_range: form.ageRange,
      kit_type: form.kitType,
    }).eq('id', group.id)
    setSaving(false)
    onSaved()
    onClose()
  }

  const teachers = employees.filter(e => e.role === 'Учитель')

  return (
    <Modal open={open} onClose={onClose} title="Редактировать группу">
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <Input label="Название группы" value={form.name} onChange={set('name')} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Select label="Уровень" value={form.level} onChange={set('level')}
            options={[{value:'beginner',label:'Начинающие'},{value:'intermediate',label:'Средний'},{value:'advanced',label:'Продвинутые'}]} />
          <Select label="Учитель" value={form.teacherId} onChange={set('teacherId')}
            options={[{value:'',label:'Не выбран'}, ...teachers.map(e=>({value:e.id,label:e.name}))]} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Input label="Дни" value={form.days} onChange={set('days')} placeholder="Вт, Чт" />
          <Input label="Время" value={form.time} onChange={set('time')} placeholder="16:00" />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <Input label="Длит. (мин)" value={form.duration} onChange={set('duration')} type="number" />
          <Input label="Макс. учеников" value={form.maxStudents} onChange={set('maxStudents')} type="number" />
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:13,fontWeight:600,color:'var(--text-muted)'}}>Цвет</label>
            <input type="color" value={form.color} onChange={e=>set('color')(e.target.value)}
              style={{height:42,width:'100%',borderRadius:10,border:'1.5px solid var(--border)',cursor:'pointer',padding:4}} />
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Input label="Возраст" value={form.ageRange} onChange={set('ageRange')} placeholder="9–12" />
          <Input label="Набор" value={form.kitType} onChange={set('kitType')} placeholder="Mindstorms EV3" />
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
          <Btn variant="outline" onClick={onClose}>Отмена</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Btn>
        </div>
      </div>
    </Modal>
  )
}
