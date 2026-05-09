'use client'
import React, { useState, useEffect } from 'react'
import { use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Btn, Card, Avatar, Badge, Tabs, EmptyState, Modal, Input, Select, AttendanceDot, fmt, Skeleton } from '@/components/ui'
import { TopBar } from '@/components/layout'
import { useRouter } from 'next/navigation'
import type { Student, Group, Payment, AttendanceRecord } from '@/types'

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [allGroups, setAllGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('attendance')
  const [showEdit, setShowEdit] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const [studRes, payRes, attRes, grpRes] = await Promise.all([
      supabase.from('students').select('*, student_groups(group_id, groups(*))').eq('id', id).single(),
      supabase.from('payments').select('*').eq('student_id', id).order('date', {ascending:false}),
      supabase.from('attendance').select('*, lessons(date, start_time, topic, groups(name))').eq('student_id', id).order('created_at', {ascending:false}).limit(20),
      supabase.from('groups').select('*').order('name'),
    ])
    if (studRes.data) {
      const s = studRes.data as any
      setStudent(s)
      setGroups(s.student_groups?.map((sg: any) => sg.groups).filter(Boolean) || [])
    }
    if (payRes.data) setPayments(payRes.data)
    if (attRes.data) setAttendance(attRes.data as any)
    if (grpRes.data) setAllGroups(grpRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const methodLabel: Record<string,string> = { cash:'Наличные', kaspi:'Kaspi', card:'Карта', transfer:'Перевод' }

  if (loading) return <div style={{padding:32}}><Skeleton height={200} radius={12} /></div>
  if (!student) return <div style={{padding:32}}>Ученик не найден</div>

  const age = student.birthday ? fmt.age(student.birthday) : '—'
  const presentCount = attendance.filter(a => a.status === 'present').length
  const absentCount = attendance.filter(a => a.status === 'absent').length
  const lateCount = attendance.filter(a => a.status === 'late').length

  return (
    <div>
      <TopBar title={student.name} onBack={() => router.push('/students')}
        actions={
          <div style={{display:'flex',gap:8}}>
            <Btn variant="outline" size="sm" icon="✏️" onClick={() => setShowEdit(true)}>Редактировать</Btn>
            <Btn variant="secondary" size="sm" icon="+" onClick={() => setShowPayment(true)}>Платёж</Btn>
          </div>
        }
      />
      <div style={{padding:'24px 28px',display:'grid',gridTemplateColumns:'300px 1fr',gap:24,maxWidth:1200}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <Card style={{padding:24,textAlign:'center'}}>
            <Avatar name={student.name} size={80} />
            <div style={{marginTop:12,fontSize:18,fontWeight:800,color:'var(--text)'}}>{student.name}</div>
            <div style={{fontSize:14,color:'var(--text-muted)',marginTop:4}}>{age} лет</div>
            <div style={{marginTop:12}}><Badge status={student.payment_status} size="md" /></div>
          </Card>

          <Card style={{padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'var(--text-muted)',marginBottom:12}}>ИНФОРМАЦИЯ</div>
            {[
              ['📅 Дата рождения', student.birthday ? fmt.date(student.birthday) : '—'],
              ['📍 Город', student.city],
              ['🗓 Зачислен', fmt.date(student.enrolled)],
            ].map(([k,v]) => (
              <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                <span style={{color:'var(--text-muted)'}}>{k}</span>
                <span style={{fontWeight:600,color:'var(--text)'}}>{v}</span>
              </div>
            ))}
          </Card>

          <Card style={{padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'var(--text-muted)',marginBottom:12}}>КОНТАКТ РОДИТЕЛЯ</div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <Avatar name={student.parent_name} size={36} />
              <div>
                <div style={{fontSize:14,fontWeight:600}}>{student.parent_name}</div>
                <div style={{fontSize:12,color:'var(--text-faint)'}}>Родитель / Опекун</div>
              </div>
            </div>
            {[student.parent_phone, student.parent_email].filter(Boolean).map(c => (
              <div key={c} style={{fontSize:13,color:'var(--primary)',marginBottom:4,cursor:'pointer'}}>{c}</div>
            ))}
          </Card>

          <Card style={{padding:20}}>
            <div style={{fontSize:13,fontWeight:700,color:'var(--text-muted)',marginBottom:12}}>ГРУППЫ</div>
            {groups.length === 0 ? <div style={{fontSize:13,color:'var(--text-faint)'}}>Нет групп</div> : groups.map(g => (
              <div key={g.id} onClick={() => router.push(`/groups/${g.id}`)}
                style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',cursor:'pointer',borderBottom:'1px solid var(--border)'}}>
                <div style={{width:10,height:10,borderRadius:'50%',background:g.color,flexShrink:0}} />
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600}}>{g.name}</div>
                  <div style={{fontSize:11,color:'var(--text-faint)'}}>{g.days} · {g.time}</div>
                </div>
              </div>
            ))}
          </Card>

          {student.medical_notes && (
            <Card style={{padding:16,background:'var(--amber-bg)',border:'1.5px solid var(--amber)33'}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--amber)',marginBottom:4}}>⚕ МЕД. ПОМЕТКИ</div>
              <div style={{fontSize:13,color:'var(--text)'}}>{student.medical_notes}</div>
            </Card>
          )}
        </div>

        <div>
          <Card style={{padding:24}}>
            <Tabs tabs={[{id:'attendance',label:'Посещаемость'},{id:'payments',label:'Платежи'}]} active={tab} onChange={setTab} />

            {tab === 'attendance' && (
              <div>
                <div style={{display:'flex',gap:12,marginBottom:16}}>
                  {[['present','Присутствовал',presentCount,'var(--green)'],['absent','Пропустил',absentCount,'var(--red)'],['late','Опоздал',lateCount,'var(--amber)']].map(([s,l,c,col]) => (
                    <div key={s as string} style={{padding:'10px 16px',borderRadius:10,background:'var(--bg)',textAlign:'center'}}>
                      <div style={{fontSize:20,fontWeight:800,color:col as string}}>{c as number}</div>
                      <div style={{fontSize:12,color:'var(--text-muted)'}}>{l}</div>
                    </div>
                  ))}
                </div>
                {attendance.length === 0 ? (
                  <EmptyState icon="📋" title="Нет записей о посещаемости" />
                ) : attendance.map((a,i) => {
                  const lesson = (a as any).lessons
                  return (
                    <div key={a.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                      <AttendanceDot status={a.status} />
                      <div style={{flex:1}}>
                        <span style={{fontSize:14,fontWeight:600}}>{lesson?.topic || 'Занятие'}</span>
                        <span style={{fontSize:12,color:'var(--text-faint)',marginLeft:8}}>{lesson?.date ? fmt.shortDate(lesson.date) : ''}</span>
                      </div>
                      <Badge status={a.status} />
                    </div>
                  )
                })}
              </div>
            )}

            {tab === 'payments' && (
              <div>
                <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
                  <Btn icon="+" size="sm" onClick={() => setShowPayment(true)}>Записать платёж</Btn>
                </div>
                {payments.length === 0 ? (
                  <EmptyState icon="💳" title="Платежей нет" action="Записать первый платёж" onAction={() => setShowPayment(true)} />
                ) : payments.map((p, i) => (
                  <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:i<payments.length-1?'1px solid var(--border)':'none'}}>
                    <div>
                      <div style={{fontSize:14,fontWeight:600}}>{p.period}</div>
                      <div style={{fontSize:12,color:'var(--text-faint)'}}>{fmt.date(p.date)} · {methodLabel[p.method]}</div>
                      {p.notes && <div style={{fontSize:12,color:'var(--amber)',marginTop:2}}>{p.notes}</div>}
                    </div>
                    <div style={{fontSize:16,fontWeight:700,color:'var(--green)'}}>{fmt.money(p.amount)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <EditStudentModal open={showEdit} onClose={() => setShowEdit(false)} student={student} allGroups={allGroups} currentGroups={groups} onSaved={load} />
      <RecordPaymentModal open={showPayment} onClose={() => setShowPayment(false)} studentId={id} studentName={student.name} onSaved={load} />
    </div>
  )
}

function EditStudentModal({ open, onClose, student, allGroups, currentGroups, onSaved }: {
  open: boolean; onClose: () => void; student: Student; allGroups: Group[]; currentGroups: Group[]; onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: student.name,
    birthday: student.birthday || '',
    parentName: student.parent_name || '',
    parentPhone: student.parent_phone || '',
    parentEmail: student.parent_email || '',
    city: student.city || '',
    medicalNotes: student.medical_notes || '',
    paymentStatus: student.payment_status,
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string) => (v: string) => setForm(f => ({...f,[k]:v}))

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('students').update({
      name: form.name,
      birthday: form.birthday || null,
      parent_name: form.parentName,
      parent_phone: form.parentPhone,
      parent_email: form.parentEmail,
      city: form.city,
      medical_notes: form.medicalNotes,
      payment_status: form.paymentStatus,
    }).eq('id', student.id)
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Редактировать ученика">
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <Input label="ФИО ученика" value={form.name} onChange={set('name')} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Input label="Дата рождения" value={form.birthday} onChange={set('birthday')} type="date" />
          <Input label="Город" value={form.city} onChange={set('city')} />
        </div>
        <Input label="ФИО родителя" value={form.parentName} onChange={set('parentName')} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Input label="Телефон" value={form.parentPhone} onChange={set('parentPhone')} />
          <Input label="Email" value={form.parentEmail} onChange={set('parentEmail')} type="email" />
        </div>
        <Input label="Мед. пометки" value={form.medicalNotes} onChange={set('medicalNotes')} />
        <Select label="Статус оплаты" value={form.paymentStatus} onChange={set('paymentStatus')}
          options={[{value:'paid',label:'Оплачено'},{value:'due_soon',label:'Скоро срок'},{value:'overdue',label:'Просрочено'}]} />
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
          <Btn variant="outline" onClick={onClose}>Отмена</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Btn>
        </div>
      </div>
    </Modal>
  )
}

function RecordPaymentModal({ open, onClose, studentId, studentName, onSaved }: {
  open: boolean; onClose: () => void; studentId: string; studentName: string; onSaved: () => void
}) {
  const [amount, setAmount] = useState('25000')
  const [method, setMethod] = useState('kaspi')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [period, setPeriod] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const now = new Date()
  const periods = [0,1,2].map(i => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return d.toLocaleString('ru-RU', {month:'long', year:'numeric'})
  })

  useEffect(() => {
    if (!period) setPeriod(periods[0])
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('payments').insert({
      student_id: studentId,
      amount: parseInt(amount),
      date,
      method,
      period,
      notes,
    })
    await supabase.from('students').update({ payment_status: 'paid' }).eq('id', studentId)
    await supabase.from('activity_log').insert({ type:'payment', text:`Оплата от ${studentName} — ${parseInt(amount).toLocaleString('ru-RU')} ₸`, icon:'💳' })
    setSaving(false)
    setDone(true)
    setTimeout(() => { setDone(false); onSaved(); onClose() }, 1200)
  }

  return (
    <Modal open={open} onClose={onClose} title="Записать платёж" width={480}>
      {done ? (
        <div style={{textAlign:'center',padding:'20px 0'}}>
          <div style={{fontSize:48}}>✅</div>
          <div style={{fontSize:16,fontWeight:700,marginTop:8}}>Платёж записан!</div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{padding:'10px 14px',borderRadius:10,background:'var(--primary-light)',fontSize:14,fontWeight:600,color:'var(--primary)'}}>{studentName}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Input label="Сумма (₸)" value={amount} onChange={setAmount} type="number" />
            <Input label="Дата" value={date} onChange={setDate} type="date" />
          </div>
          <Select label="Способ оплаты" value={method} onChange={setMethod}
            options={[{value:'kaspi',label:'Kaspi Pay'},{value:'cash',label:'Наличные'},{value:'card',label:'Карта'},{value:'transfer',label:'Банковский перевод'}]} />
          <Select label="Период" value={period} onChange={setPeriod} options={periods.map(v=>({value:v,label:v}))} />
          <div>
            <label style={{fontSize:13,fontWeight:600,color:'var(--text-muted)',display:'block',marginBottom:6}}>Примечание</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Необязательно..."
              style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border)',fontSize:14,fontFamily:'inherit',resize:'none',height:64,boxSizing:'border-box',outline:'none'}} />
          </div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:4}}>
            <Btn variant="outline" onClick={onClose}>Отмена</Btn>
            <Btn onClick={handleSave} disabled={saving} icon="✅">{saving ? 'Сохранение...' : 'Записать платёж'}</Btn>
          </div>
        </div>
      )}
    </Modal>
  )
}
