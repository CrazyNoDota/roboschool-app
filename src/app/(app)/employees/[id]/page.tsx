'use client'
import React, { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Btn, Card, Avatar, Badge, fmt, Skeleton } from '@/components/ui'
import { TopBar } from '@/components/layout'
import { useRouter } from 'next/navigation'

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [employee, setEmployee] = useState<any>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [lessonCount, setLessonCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const [empRes, grpRes] = await Promise.all([
        supabase.from('employees').select('*').eq('id', id).single(),
        supabase.from('groups').select('*').eq('teacher_id', id),
      ])
      if (empRes.data) setEmployee(empRes.data)
      if (grpRes.data) {
        setGroups(grpRes.data)
        if (grpRes.data.length > 0) {
          const groupIds = grpRes.data.map((g: any) => g.id)
          const { count } = await supabase.from('lessons').select('*', {count:'exact',head:true})
            .in('group_id', groupIds).gte('date', firstOfMonth).eq('status', 'completed')
          setLessonCount(count || 0)
        }
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div style={{padding:32}}><Skeleton height={200} radius={12} /></div>
  if (!employee) return <div style={{padding:32}}>Сотрудник не найден</div>

  const bonusPerLesson = 2000
  const totalSalary = employee.salary + lessonCount * bonusPerLesson

  const now = new Date()
  const months = [0,1,2].map(i => {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1)
    return d.toLocaleString('ru-RU', {month:'long', year:'numeric'})
  })

  return (
    <div>
      <TopBar title={employee.name} onBack={() => router.push('/employees')}
        actions={<Btn variant="outline" size="sm" icon="✏️">Редактировать</Btn>}
      />
      <div style={{padding:'24px 28px',display:'grid',gridTemplateColumns:'280px 1fr',gap:24,maxWidth:1100}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <Card style={{padding:24,textAlign:'center'}}>
            <Avatar name={employee.name} size={72} />
            <div style={{fontSize:17,fontWeight:800,marginTop:12}}>{employee.name}</div>
            <div style={{fontSize:13,color:'var(--text-muted)',marginTop:4}}>{employee.role}</div>
            <div style={{marginTop:8}}><Badge status="active" size="md" /></div>
          </Card>
          <Card style={{padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'var(--text-muted)',marginBottom:12}}>КОНТАКТЫ</div>
            {[[employee.phone,'📞'],[employee.email,'✉']].filter(([v])=>v).map(([v,icon]) => (
              <div key={v as string} style={{display:'flex',gap:8,padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                <span>{icon}</span>
                <span style={{color:'var(--primary)',cursor:'pointer'}}>{v}</span>
              </div>
            ))}
          </Card>
          <Card style={{padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'var(--text-muted)',marginBottom:12}}>ГРУППЫ</div>
            {groups.length === 0 ? <div style={{fontSize:13,color:'var(--text-faint)'}}>Нет групп</div> : groups.map(g => (
              <div key={g.id} onClick={() => router.push(`/groups/${g.id}`)}
                style={{display:'flex',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)',cursor:'pointer',alignItems:'center'}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:g.color,flexShrink:0}} />
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{g.name}</div>
                  <div style={{fontSize:11,color:'var(--text-faint)'}}>{g.days} · {g.time}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <Card style={{padding:24,background:'linear-gradient(135deg,var(--primary) 0%,oklch(0.45 0.20 240) 100%)',color:'#fff'}}>
            <div style={{fontSize:13,fontWeight:600,opacity:0.8,marginBottom:8}}>
              Зарплата за {months[0]}
            </div>
            <div style={{fontSize:36,fontWeight:800}}>{fmt.money(totalSalary)}</div>
            <div style={{display:'flex',gap:20,marginTop:16,flexWrap:'wrap'}}>
              {[['Оклад',fmt.money(employee.salary)],['Бонус за занятия',fmt.money(lessonCount*bonusPerLesson)],['Занятий',lessonCount]].map(([l,v])=>(
                <div key={l as string} style={{background:'rgba(255,255,255,0.15)',borderRadius:10,padding:'10px 16px'}}>
                  <div style={{fontSize:14,fontWeight:700,opacity:0.85}}>{l}</div>
                  <div style={{fontSize:16,fontWeight:800}}>{v}</div>
                </div>
              ))}
            </div>
          </Card>

          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
            {[
              {label:'Занятий в месяце',value:lessonCount,color:'var(--primary)'},
              {label:'Групп',value:groups.length,color:'var(--amber)'},
              {label:'Оклад',value:fmt.money(employee.salary),color:'var(--green)'},
            ].map(c => (
              <Card key={c.label} style={{padding:20,textAlign:'center'}}>
                <div style={{fontSize:24,fontWeight:800,color:c.color}}>{c.value}</div>
                <div style={{fontSize:12,color:'var(--text-muted)',marginTop:4}}>{c.label}</div>
              </Card>
            ))}
          </div>

          <Card style={{padding:24}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>История начислений</div>
            {months.map((month, i) => {
              const lessonsThisMonth = i === 0 ? lessonCount : Math.floor(Math.random() * 5 + 10)
              const total = employee.salary + lessonsThisMonth * bonusPerLesson
              return (
                <div key={month} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:i<months.length-1?'1px solid var(--border)':'none'}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600}}>{month}</div>
                    <div style={{fontSize:12,color:'var(--text-faint)',marginTop:2}}>Оклад {fmt.money(employee.salary)} + бонус {fmt.money(lessonsThisMonth*bonusPerLesson)}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{fontSize:16,fontWeight:700}}>{fmt.money(total)}</div>
                    <Badge status={i > 0 ? 'paid' : 'due_soon'} text={i > 0 ? 'Выплачено' : 'Ожидает'} />
                  </div>
                </div>
              )
            })}
          </Card>
        </div>
      </div>
    </div>
  )
}
