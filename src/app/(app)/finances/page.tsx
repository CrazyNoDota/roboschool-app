'use client'
import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Btn, Card, Tabs, SearchBar, Modal, Input, Select, EmptyState, fmt } from '@/components/ui'
import { TopBar } from '@/components/layout'
import type { Payment, Expense } from '@/types'

export default function FinancesPage() {
  const [tab, setTab] = useState('overview')
  const [payments, setPayments] = useState<Payment[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [expSearch, setExpSearch] = useState('')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const supabase = createClient()
    const [payRes, expRes] = await Promise.all([
      supabase.from('payments').select('*, student:students(name)').order('date', {ascending:false}),
      supabase.from('expenses').select('*').order('date', {ascending:false}),
    ])
    if (payRes.data) setPayments(payRes.data as any)
    if (expRes.data) setExpenses(expRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastMonth = new Date(now.getFullYear(), now.getMonth()-1, 1).toISOString().split('T')[0]
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

  const thisMonthPay = payments.filter(p => p.date >= thisMonth)
  const lastMonthPay = payments.filter(p => p.date >= lastMonth && p.date <= lastMonthEnd)
  const thisMonthExp = expenses.filter(e => e.date >= thisMonth)
  const lastMonthExp = expenses.filter(e => e.date >= lastMonth && e.date <= lastMonthEnd)

  const income = thisMonthPay.reduce((s,p) => s + p.amount, 0)
  const expTotal = thisMonthExp.reduce((s,e) => s + e.amount, 0)
  const profit = income - expTotal
  const lastIncome = lastMonthPay.reduce((s,p) => s + p.amount, 0)
  const lastExp = lastMonthExp.reduce((s,e) => s + e.amount, 0)
  const lastProfit = lastIncome - lastExp

  const monthName = now.toLocaleString('ru-RU', {month:'long'})

  // Expense breakdown
  const expByCategory: Record<string,number> = {}
  thisMonthExp.forEach(e => { expByCategory[e.category] = (expByCategory[e.category]||0) + e.amount })
  const expBreakdown = Object.entries(expByCategory).sort((a,b)=>b[1]-a[1])
  const catColors: Record<string,string> = {
    'Зарплата':'var(--primary)', 'Аренда':'var(--amber)', 'Материалы':'var(--green)',
    'Маркетинг':'var(--red)', 'Коммунальные':'#8b5cf6', 'Прочее':'var(--grey)'
  }

  // Payment breakdown
  const payByMethod: Record<string,number> = {}
  thisMonthPay.forEach(p => { payByMethod[p.method] = (payByMethod[p.method]||0) + p.amount })
  const payBreakdown = Object.entries(payByMethod).sort((a,b)=>b[1]-a[1])
  const methodNames: Record<string,string> = { cash:'Наличные', kaspi:'Kaspi Pay', card:'Карта', transfer:'Перевод' }
  const methodColors: Record<string,string> = { cash:'var(--amber)', kaspi:'var(--primary)', card:'var(--green)', transfer:'var(--grey)' }

  const filteredExp = expenses.filter(e =>
    e.description?.toLowerCase().includes(expSearch.toLowerCase()) ||
    e.category.toLowerCase().includes(expSearch.toLowerCase())
  )

  if (loading) return <div style={{padding:32,color:'var(--text-muted)'}}>Загрузка...</div>

  return (
    <div>
      <TopBar title="Финансы"
        actions={
          <div style={{display:'flex',gap:8}}>
            <Btn size="sm" icon="+" onClick={() => setShowAddExpense(true)}>Добавить расход</Btn>
          </div>
        }
      />
      <div style={{padding:'20px 28px'}}>
        <Tabs tabs={[{id:'overview',label:'Обзор'},{id:'expenses',label:'Расходы'},{id:'income',label:'Доходы'}]} active={tab} onChange={setTab} />

        {tab === 'overview' && (
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:24}}>
              {[
                {label:`Доходы (${monthName})`, value:fmt.money(income), color:'var(--green)', sub: lastIncome > 0 ? `${income > lastIncome ? '↑' : '↓'} ${Math.round(Math.abs(income/lastIncome-1)*100)}% vs пред. месяц` : 'Текущий месяц'},
                {label:`Расходы (${monthName})`, value:fmt.money(expTotal), color:'var(--red)', sub: lastExp > 0 ? `${expTotal > lastExp ? '↑' : '↓'} ${Math.round(Math.abs(expTotal/lastExp-1)*100)}% vs пред. месяц` : 'Текущий месяц'},
                {label:'Прибыль', value:fmt.money(profit), color:profit>0?'var(--green)':'var(--red)', sub:profit>0?'Положительная':'Убыток'},
                {label:'Прибыль (пред. месяц)', value:fmt.money(lastProfit), color:lastProfit>0?'var(--green)':'var(--red)', sub:'Предыдущий месяц'},
              ].map(c => (
                <div key={c.label} style={{background:'var(--surface)',borderRadius:'var(--radius)',border:'1.5px solid var(--border)',padding:'20px',boxShadow:'var(--shadow)'}}>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--text-muted)',marginBottom:8}}>{c.label}</div>
                  <div style={{fontSize:24,fontWeight:800,color:c.color}}>{c.value}</div>
                  <div style={{fontSize:12,color:'var(--text-faint)',marginTop:4}}>{c.sub}</div>
                </div>
              ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
              <Card style={{padding:24}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Структура расходов</div>
                {expBreakdown.length === 0 ? (
                  <div style={{fontSize:13,color:'var(--text-faint)',padding:'20px 0',textAlign:'center'}}>Нет расходов в этом месяце</div>
                ) : expBreakdown.map(([cat, val]) => {
                  const pct = expTotal > 0 ? Math.round(val/expTotal*100) : 0
                  return (
                    <div key={cat} style={{marginBottom:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <div style={{display:'flex',gap:8,alignItems:'center'}}>
                          <div style={{width:10,height:10,borderRadius:2,background:catColors[cat]||'var(--grey)',flexShrink:0}} />
                          <span style={{fontSize:13,color:'var(--text)'}}>{cat}</span>
                        </div>
                        <div style={{display:'flex',gap:12}}>
                          <span style={{fontSize:13,fontWeight:700}}>{fmt.money(val)}</span>
                          <span style={{fontSize:12,color:'var(--text-faint)',width:28,textAlign:'right'}}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{height:6,borderRadius:3,background:'var(--border)'}}>
                        <div style={{height:'100%',borderRadius:3,background:catColors[cat]||'var(--grey)',width:`${pct}%`,transition:'width 0.4s'}} />
                      </div>
                    </div>
                  )
                })}
              </Card>

              <Card style={{padding:24}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Структура доходов</div>
                {payBreakdown.length === 0 ? (
                  <div style={{fontSize:13,color:'var(--text-faint)',padding:'20px 0',textAlign:'center'}}>Нет доходов в этом месяце</div>
                ) : payBreakdown.map(([method, val]) => {
                  const pct = income > 0 ? Math.round(val/income*100) : 0
                  return (
                    <div key={method} style={{marginBottom:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontSize:13,color:'var(--text)'}}>{methodNames[method]||method}</span>
                        <div style={{display:'flex',gap:12}}>
                          <span style={{fontSize:13,fontWeight:700}}>{fmt.money(val)}</span>
                          <span style={{fontSize:12,color:'var(--text-faint)',width:28,textAlign:'right'}}>{pct}%</span>
                        </div>
                      </div>
                      <div style={{height:6,borderRadius:3,background:'var(--border)'}}>
                        <div style={{height:'100%',borderRadius:3,background:methodColors[method]||'var(--primary)',width:`${pct}%`,transition:'width 0.4s'}} />
                      </div>
                    </div>
                  )
                })}
                <div style={{marginTop:20,padding:'12px 16px',borderRadius:10,background:'var(--green-bg)',display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--green)'}}>Итого доходы</span>
                  <span style={{fontSize:15,fontWeight:800,color:'var(--green)'}}>{fmt.money(income)}</span>
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'expenses' && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,flexWrap:'wrap',gap:10}}>
              <SearchBar value={expSearch} onChange={setExpSearch} placeholder="Поиск по расходам..." />
              <Btn icon="+" onClick={() => setShowAddExpense(true)}>Добавить расход</Btn>
            </div>
            <Card style={{overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{borderBottom:'1.5px solid var(--border)'}}>
                    {['Категория','Описание','Дата','Сумма'].map(h => (
                      <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:12,fontWeight:700,color:'var(--text-muted)'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredExp.map((e,i) => (
                    <tr key={e.id} style={{borderBottom:i<filteredExp.length-1?'1px solid var(--border)':'none'}}>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:20,background:(catColors[e.category]||'var(--grey)')+'22',color:catColors[e.category]||'var(--grey)'}}>{e.category}</span>
                      </td>
                      <td style={{padding:'12px 16px',fontSize:14,color:'var(--text)'}}>{e.description}</td>
                      <td style={{padding:'12px 16px',fontSize:13,color:'var(--text-muted)'}}>{fmt.date(e.date)}</td>
                      <td style={{padding:'12px 16px',fontSize:14,fontWeight:700,color:'var(--red)'}}>{fmt.money(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredExp.length === 0 && <EmptyState icon="📦" title="Расходов не найдено" />}
            </Card>
          </div>
        )}

        {tab === 'income' && (
          <Card style={{overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1.5px solid var(--border)'}}>
                  {['Ученик','Период','Дата','Способ','Сумма'].map(h => (
                    <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:12,fontWeight:700,color:'var(--text-muted)'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p,i) => {
                  const student = (p as any).student
                  const mColor: Record<string,string> = {cash:'var(--amber)', kaspi:'var(--primary)', card:'var(--green)', transfer:'var(--grey)'}
                  const mLabel: Record<string,string> = {cash:'Наличные', kaspi:'Kaspi Pay', card:'Карта', transfer:'Перевод'}
                  return (
                    <tr key={p.id} style={{borderBottom:i<payments.length-1?'1px solid var(--border)':'none'}}>
                      <td style={{padding:'12px 16px',fontSize:13,fontWeight:600}}>{student?.name || '—'}</td>
                      <td style={{padding:'12px 16px',fontSize:13}}>{p.period}</td>
                      <td style={{padding:'12px 16px',fontSize:13,color:'var(--text-muted)'}}>{fmt.date(p.date)}</td>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:20,background:(mColor[p.method]||'var(--grey)')+'22',color:mColor[p.method]||'var(--grey)'}}>{mLabel[p.method]||p.method}</span>
                      </td>
                      <td style={{padding:'12px 16px',fontSize:14,fontWeight:700,color:'var(--green)'}}>{fmt.money(p.amount)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {payments.length === 0 && <EmptyState icon="💰" title="Нет платежей" />}
          </Card>
        )}
      </div>

      <AddExpenseModal open={showAddExpense} onClose={() => setShowAddExpense(false)} onAdded={load} />
    </div>
  )
}

function AddExpenseModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ category:'Материалы', amount:'', date:new Date().toISOString().split('T')[0], description:'' })
  const [saving, setSaving] = useState(false)
  const set = (k: string) => (v: string) => setForm(f => ({...f,[k]:v}))

  const handleSave = async () => {
    if (!form.amount || !form.description) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('expenses').insert({
      category: form.category, amount: parseInt(form.amount),
      date: form.date, description: form.description
    })
    await supabase.from('activity_log').insert({ type:'expense', text:`Расход записан: ${form.category} — ${parseInt(form.amount).toLocaleString('ru-RU')} ₸`, icon:'📦' })
    setSaving(false); onAdded(); onClose()
    setForm({ category:'Материалы', amount:'', date:new Date().toISOString().split('T')[0], description:'' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Новый расход">
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <Select label="Категория" value={form.category} onChange={set('category')}
          options={['Аренда','Зарплата','Материалы','Маркетинг','Коммунальные','Прочее'].map(v=>({value:v,label:v}))} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Input label="Сумма (₸)" value={form.amount} onChange={set('amount')} type="number" placeholder="5000" />
          <Input label="Дата" value={form.date} onChange={set('date')} type="date" />
        </div>
        <Input label="Описание" value={form.description} onChange={set('description')} placeholder="Кратко опишите расход..." />
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:4}}>
          <Btn variant="outline" onClick={onClose}>Отмена</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : 'Добавить'}</Btn>
        </div>
      </div>
    </Modal>
  )
}
