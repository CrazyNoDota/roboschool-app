'use client'
import React, { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Btn, Card, Badge, Tabs, EmptyState, Avatar, AttendanceDot, fmt, Skeleton } from '@/components/ui'
import { TopBar } from '@/components/layout'
import { useRouter } from 'next/navigation'
import type { Group, Student, Lesson } from '@/types'

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [group, setGroup] = useState<Group | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('roster')

  const load = async () => {
    const supabase = createClient()
    const [grpRes, sgRes, lesRes] = await Promise.all([
      supabase.from('groups').select('*, teacher:employees(id,name)').eq('id', id).single(),
      supabase.from('student_groups').select('students(*)').eq('group_id', id),
      supabase.from('lessons').select('*').eq('group_id', id).order('date').order('start_time'),
    ])
    if (grpRes.data) setGroup(grpRes.data as any)
    if (sgRes.data) setStudents(sgRes.data.map((r: any) => r.students).filter(Boolean))
    if (lesRes.data) setLessons(lesRes.data)

    const lessonIds = lesRes.data?.map((l: any) => l.id) || []
    if (lessonIds.length > 0) {
      const { data: attData } = await supabase.from('attendance').select('*').in('lesson_id', lessonIds)
      if (attData) setAttendance(attData)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

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
            <Btn variant="outline" size="sm" icon="✏️">Редактировать</Btn>
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
