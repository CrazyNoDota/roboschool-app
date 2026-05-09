'use client'
import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Btn, Card, Avatar, Badge, SearchBar, FilterChip, Modal, Input, Select, EmptyState, fmt } from '@/components/ui'
import { TopBar } from '@/components/layout'
import type { Student, Payment } from '@/types'

export default function PaymentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [selected, setSelected] = useState<Student | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showRecord, setShowRecord] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const supabase = createClient()
    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const [studRes, payRes] = await Promise.all([
      supabase.from('students').select('*').eq('active', true).order('name'),
      supabase.from('payments').select('*').order('date', {ascending:false}),
    ])
    if (studRes.data) setStudents(studRes.data)
    if (payRes.data) setPayments(payRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const thisMonthPayments = payments.filter(p => p.date >= firstOfMonth)
  const totalPaidThisMonth = thisMonthPayments.reduce((s,p) => s + p.amount, 0)
  const methodLabel: Record<string,string> = { cash:'Наличные', kaspi:'Kaspi Pay', card:'Карта', transfer:'Банк. перевод' }
  const methodIcon: Record<string,string>  = { cash:'💵', kaspi:'📱', card:'💳', transfer:'🏦' }

  const filtered = students.filter(s => {
    const matchFilter = filter === 'all' || s.payment_status === filter
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const studentPayments = selected ? payments.filter(p => p.student_id === selected.id) : []

  return (
    <div>
      <TopBar title="Платежи" actions={<Btn icon="+" onClick={() => setShowRecord(true)}>Записать платёж</Btn>} />

      <div style={{padding:'16px 28px 0',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:4}}>
        {[
          {label:'Получено в этом месяце', value:fmt.money(totalPaidThisMonth), color:'var(--green)', icon:'✅'},
          {label:'Просрочили оплату', value:students.filter(s=>s.payment_status==='overdue').length, color:'var(--red)', icon:'⚠️'},
          {label:'Скоро срок', value:students.filter(s=>s.payment_status==='due_soon').length, color:'var(--amber)', icon:'⏰'},
          {label:'Оплатили в этом месяце', value:new Set(thisMonthPayments.map(p=>p.student_id)).size, color:'var(--primary)', icon:'👤'},
        ].map(c => (
          <div key={c.label} style={{background:'var(--surface)',borderRadius:'var(--radius)',border:'1.5px solid var(--border)',padding:'14px 16px',boxShadow:'var(--shadow)'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontSize:12,fontWeight:600,color:'var(--text-muted)'}}>{c.label}</span>
              <span style={{fontSize:16}}>{c.icon}</span>
            </div>
            <div style={{fontSize:20,fontWeight:800,color:c.color}}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{padding:'16px 28px',display:'grid',gridTemplateColumns:'360px 1fr',gap:20,height:'calc(100vh - 220px)',overflow:'hidden'}}>
        <div style={{display:'flex',flexDirection:'column',gap:10,overflow:'hidden'}}>
          <SearchBar value={search} onChange={setSearch} placeholder="Поиск ученика..." />
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[['all','Все'],['overdue','Просрочено'],['due_soon','Скоро'],['paid','Оплачено']].map(([v,l]) => (
              <FilterChip key={v} label={l} active={filter===v} onClick={() => setFilter(v)} />
            ))}
          </div>
          <div style={{overflow:'auto',flex:1}}>
            {filtered.length === 0 ? <EmptyState icon="💳" title="Нет результатов" /> : filtered.map(s => {
              const lastPay = payments.filter(p=>p.student_id===s.id).sort((a,b)=>b.date.localeCompare(a.date))[0]
              return (
                <div key={s.id} onClick={() => setSelected(s)}
                  style={{
                    display:'flex',alignItems:'center',gap:12,padding:'12px 14px',
                    borderRadius:10,marginBottom:4,cursor:'pointer',
                    background:selected?.id===s.id?'var(--primary-light)':'var(--surface)',
                    border:`1.5px solid ${selected?.id===s.id?'var(--primary)':'var(--border)'}`,
                    transition:'all 0.1s'
                  }}>
                  <Avatar name={s.name} size={36} />
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
                    <div style={{fontSize:11,color:'var(--text-faint)'}}>
                      {payments.filter(p=>p.student_id===s.id).length} платежей · {lastPay ? fmt.shortDate(lastPay.date) : 'нет'}
                    </div>
                  </div>
                  <Badge status={s.payment_status} />
                </div>
              )
            })}
          </div>
        </div>

        <div style={{overflow:'auto'}}>
          {!selected ? (
            <EmptyState icon="👈" title="Выберите ученика" subtitle="Нажмите на ученика слева, чтобы увидеть историю платежей" />
          ) : (
            <Card style={{padding:24}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <Avatar name={selected.name} size={48} />
                  <div>
                    <div style={{fontSize:17,fontWeight:800}}>{selected.name}</div>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginTop:4}}>
                      <Badge status={selected.payment_status} />
                    </div>
                    <div style={{fontSize:12,color:'var(--text-faint)',marginTop:2}}>{selected.parent_phone} · {selected.parent_email}</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <Btn size="sm" icon="+" onClick={() => setShowRecord(true)}>Записать платёж</Btn>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
                {[
                  {label:'Всего оплачено', value:fmt.money(studentPayments.reduce((s,p)=>s+p.amount,0)), color:'var(--green)'},
                  {label:'Платежей всего', value:studentPayments.length, color:'var(--primary)'},
                  {label:'Ежемес. взнос', value:fmt.money(25000), color:'var(--text-muted)'},
                ].map(c => (
                  <div key={c.label} style={{padding:'12px',borderRadius:10,background:'var(--bg)',textAlign:'center'}}>
                    <div style={{fontSize:18,fontWeight:800,color:c.color}}>{c.value}</div>
                    <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{c.label}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:13,fontWeight:700,color:'var(--text-muted)',marginBottom:12}}>ИСТОРИЯ ПЛАТЕЖЕЙ</div>
              {studentPayments.length === 0 ? (
                <EmptyState icon="💳" title="Платежей нет" action="Записать первый платёж" onAction={() => setShowRecord(true)} />
              ) : studentPayments.map((p,i) => (
                <div key={p.id} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 0',borderBottom:i<studentPayments.length-1?'1px solid var(--border)':'none'}}>
                  <div style={{width:40,height:40,borderRadius:10,background:'var(--green-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>{methodIcon[p.method]}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14}}>{p.period}</div>
                    <div style={{fontSize:12,color:'var(--text-faint)',marginTop:2}}>{fmt.date(p.date)} · {methodLabel[p.method]}{p.notes && <span style={{color:'var(--amber)',marginLeft:6}}>· {p.notes}</span>}</div>
                  </div>
                  <div style={{fontSize:16,fontWeight:800,color:'var(--green)'}}>{fmt.money(p.amount)}</div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      <RecordPaymentModal open={showRecord} onClose={() => setShowRecord(false)} students={students} defaultStudent={selected} onSaved={load} />
    </div>
  )
}

function RecordPaymentModal({ open, onClose, students, defaultStudent, onSaved }: {
  open: boolean; onClose: () => void; students: Student[]; defaultStudent: Student | null; onSaved: () => void
}) {
  const [studentId, setStudentId] = useState(defaultStudent?.id || '')
  const [amount, setAmount] = useState('25000')
  const [method, setMethod] = useState('kaspi')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const now = new Date()
  const periods = [0,1,2].map(i => {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1)
    return d.toLocaleString('ru-RU', {month:'long', year:'numeric'})
  })
  const [period, setPeriod] = useState(periods[0])

  useEffect(() => { if (defaultStudent) setStudentId(defaultStudent.id) }, [defaultStudent])

  const handleSave = async () => {
    if (!studentId) return
    setSaving(true)
    const supabase = createClient()
    const student = students.find(s=>s.id===studentId)
    await supabase.from('payments').insert({ student_id:studentId, amount:parseInt(amount), date, method, period, notes })
    await supabase.from('students').update({ payment_status: 'paid' }).eq('id', studentId)
    await supabase.from('activity_log').insert({ type:'payment', text:`Оплата от ${student?.name} — ${parseInt(amount).toLocaleString('ru-RU')} ₸`, icon:'💳' })
    setSaving(false); setDone(true)
    setTimeout(() => { setDone(false); onSaved(); onClose() }, 1000)
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
          <Select label="Ученик" value={studentId} onChange={setStudentId} options={[{value:'',label:'Выберите ученика'},...students.map(s=>({value:s.id,label:s.name}))]} />
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Input label="Сумма (₸)" value={amount} onChange={setAmount} type="number" />
            <Input label="Дата" value={date} onChange={setDate} type="date" />
          </div>
          <Select label="Способ оплаты" value={method} onChange={setMethod} options={[{value:'kaspi',label:'Kaspi Pay'},{value:'cash',label:'Наличные'},{value:'card',label:'Карта'},{value:'transfer',label:'Банковский перевод'}]} />
          <Select label="Период" value={period} onChange={setPeriod} options={periods.map(v=>({value:v,label:v}))} />
          <div>
            <label style={{fontSize:13,fontWeight:600,color:'var(--text-muted)',display:'block',marginBottom:6}}>Примечание</label>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Необязательно..." style={{width:'100%',padding:'10px 12px',borderRadius:10,border:'1.5px solid var(--border)',fontSize:14,fontFamily:'inherit',resize:'none',height:64,boxSizing:'border-box',outline:'none'}} />
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
