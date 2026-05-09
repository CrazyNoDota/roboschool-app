'use client'
import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KpiCard, Card, Btn, Skeleton, EmptyState, Avatar, Badge, fmt } from '@/components/ui'
import { PageHeader } from '@/components/ui'
import type { Student, Lesson, Group, Payment, Expense, ActivityLog } from '@/types'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [activity, setActivity] = useState<ActivityLog[]>([])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]

      const [studRes, grpRes, lesRes, payRes, expRes, actRes] = await Promise.all([
        supabase.from('students').select('*, student_groups(group_id)').eq('active', true),
        supabase.from('groups').select('*, teacher:employees(name)'),
        supabase.from('lessons').select('*, group:groups(*)').gte('date', today).order('date').order('start_time').limit(20),
        supabase.from('payments').select('*').gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        supabase.from('expenses').select('*').gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        supabase.from('activity_log').select('*').order('created_at', {ascending:false}).limit(5),
      ])

      if (studRes.data) setStudents(studRes.data.map((s: any) => ({ ...s, groups: s.student_groups?.map((sg: any) => sg.group_id) })))
      if (grpRes.data) setGroups(grpRes.data as any)
      if (lesRes.data) setLessons(lesRes.data as any)
      if (payRes.data) setPayments(payRes.data)
      if (expRes.data) setExpenses(expRes.data)
      if (actRes.data) setActivity(actRes.data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{padding:32}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:16,marginBottom:24}}>
        {[...Array(5)].map((_,i) => <Skeleton key={i} height={100} radius={12} />)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <Skeleton height={280} radius={12} />
        <Skeleton height={280} radius={12} />
      </div>
    </div>
  )

  const today = new Date().toISOString().split('T')[0]
  const todayLessons = lessons.filter(l => l.date === today)
  const overdueStudents = students.filter(s => s.payment_status === 'overdue').length
  const totalIncome = payments.reduce((s,p) => s + p.amount, 0)
  const totalExpenses = expenses.reduce((s,e) => s + e.amount, 0)
  const profit = totalIncome - totalExpenses
  const dueSoon = students.filter(s => s.payment_status === 'overdue' || s.payment_status === 'due_soon')

  const getGroup = (id: string) => groups.find(g => g.id === id)

  const now = new Date()
  const monthName = now.toLocaleString('ru-RU', { month: 'long' })

  return (
    <div style={{padding:'24px 28px', maxWidth:1400}}>
      <PageHeader
        title="Главная"
        subtitle={new Date().toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        actions={<Btn variant="secondary" icon="🔔" size="sm">{overdueStudents > 0 ? `${overdueStudents} напоминания` : 'Напоминания'}</Btn>}
      />

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:28}}>
        <KpiCard label="Активных учеников" value={students.length} sub="Текущий месяц" color="var(--primary)" icon="👤" onClick={() => router.push('/students')} />
        <KpiCard label="Просрочили оплату" value={overdueStudents} sub="Требует внимания" color="var(--red)" icon="⚠️" onClick={() => router.push('/payments')} />
        <KpiCard label="Занятий сегодня" value={todayLessons.length} sub={todayLessons.map(l=>(l.group as any)?.name).filter(Boolean).join(', ')||'Нет занятий'} color="var(--primary)" icon="📅" onClick={() => router.push('/schedule')} />
        <KpiCard label={`Доходы (${monthName})`} value={fmt.money(totalIncome)} sub="Текущий месяц" color="var(--green)" icon="💰" onClick={() => router.push('/finances')} />
        <KpiCard label="Чистая прибыль" value={fmt.money(profit)} sub={profit < 0 ? '⚠ Убыток' : 'Положительная'} color={profit < 0 ? 'var(--red)' : 'var(--green)'} icon="📈" onClick={() => router.push('/finances')} />
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 380px', gap:20}}>
        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <Card style={{padding:24}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>📅 Расписание на сегодня</span>
              <Btn variant="ghost" size="sm" onClick={() => router.push('/schedule')}>Полное расписание →</Btn>
            </div>
            {todayLessons.length === 0 ? (
              <EmptyState icon="🎉" title="Занятий сегодня нет" subtitle="Хорошего отдыха!" />
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {todayLessons.map(lesson => {
                  const grp = lesson.group as any
                  return (
                    <div key={lesson.id} onClick={() => router.push(`/attendance/${lesson.id}`)}
                      style={{
                        display:'flex',alignItems:'center',gap:14,padding:'14px 16px',
                        borderRadius:12, background:'var(--bg)', cursor:'pointer',
                        border:`1.5px solid ${grp?.color||'var(--border)'}33`,
                        transition:'all 0.15s'
                      }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--primary-light)'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='var(--bg)'}
                    >
                      <div style={{width:4,height:48,borderRadius:4,background:grp?.color||'var(--primary)',flexShrink:0}} />
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:14,color:'var(--text)'}}>{grp?.name}</div>
                        <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{lesson.topic}</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontSize:15,fontWeight:700,color:grp?.color||'var(--primary)'}}>{lesson.start_time}</div>
                        <div style={{fontSize:11,color:'var(--text-faint)'}}>{grp?.duration} мин</div>
                      </div>
                      <Btn variant="secondary" size="sm">Отметить</Btn>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card style={{padding:24}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>📊 Финансы этого месяца</span>
              <Btn variant="ghost" size="sm" onClick={() => router.push('/finances')}>Подробнее →</Btn>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
              {[
                {label:'Доходы',color:'var(--green)',value:fmt.money(totalIncome)},
                {label:'Расходы',color:'var(--red)',value:fmt.money(totalExpenses)},
                {label:'Прибыль',color:profit>=0?'var(--green)':'var(--red)',value:fmt.money(profit)},
              ].map(c => (
                <div key={c.label} style={{padding:'16px',borderRadius:10,background:'var(--bg)',textAlign:'center'}}>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',marginBottom:6}}>{c.label}</div>
                  <div style={{fontSize:18,fontWeight:800,color:c.color}}>{c.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:20}}>
          <Card style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:14,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>💳 Ожидаются платежи</span>
              <Btn variant="ghost" size="sm" onClick={() => router.push('/payments')}>Все →</Btn>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {dueSoon.length === 0 ? (
                <div style={{fontSize:13,color:'var(--text-faint)',textAlign:'center',padding:'20px 0'}}>Все платежи актуальны ✅</div>
              ) : dueSoon.slice(0,5).map(s => (
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                  <Avatar name={s.name} size={32} />
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
                    <div style={{fontSize:11,color:'var(--text-faint)'}}>Требует оплаты</div>
                  </div>
                  <Badge status={s.payment_status} />
                </div>
              ))}
            </div>
          </Card>

          <Card style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>🕒 Последние события</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {activity.length === 0 ? (
                <div style={{fontSize:13,color:'var(--text-faint)',textAlign:'center',padding:'16px 0'}}>Нет событий</div>
              ) : activity.map(a => (
                <div key={a.id} style={{display:'flex',alignItems:'flex-start',gap:10}}>
                  <div style={{width:32,height:32,borderRadius:8,background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>{a.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,color:'var(--text)',lineHeight:1.4}}>{a.text}</div>
                    <div style={{fontSize:11,color:'var(--text-faint)',marginTop:2}}>
                      {new Date(a.created_at).toLocaleString('ru-RU', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
