'use client'
import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Btn, Card, Avatar, Badge, Modal, Input, Select, EmptyState, fmt } from '@/components/ui'
import { TopBar } from '@/components/layout'
import type { Employee, Group } from '@/types'
import { useRouter } from 'next/navigation'

export default function EmployeesPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [empGroups, setEmpGroups] = useState<Record<string, Group[]>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const supabase = createClient()
    const [empRes, grpRes] = await Promise.all([
      supabase.from('employees').select('*').eq('active', true).order('name'),
      supabase.from('groups').select('*').order('name'),
    ])
    if (empRes.data) setEmployees(empRes.data)
    if (grpRes.data) {
      setGroups(grpRes.data)
      const byTeacher: Record<string, Group[]> = {}
      grpRes.data.forEach((g: any) => {
        if (g.teacher_id) {
          if (!byTeacher[g.teacher_id]) byTeacher[g.teacher_id] = []
          byTeacher[g.teacher_id].push(g)
        }
      })
      setEmpGroups(byTeacher)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const roleColor: Record<string,string> = { 'Учитель':'var(--primary)', 'Администратор':'var(--amber)' }

  if (loading) return <div style={{padding:32,color:'var(--text-muted)'}}>Загрузка...</div>

  return (
    <div>
      <TopBar title={`Сотрудники (${employees.length})`} actions={<Btn icon="+" onClick={() => setShowAdd(true)}>Добавить сотрудника</Btn>} />
      <div style={{padding:'20px 28px'}}>
        <Card style={{overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1.5px solid var(--border)'}}>
                {['Сотрудник','Должность','Телефон','Email','Оклад','Групп',''].map(h => (
                  <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:12,fontWeight:700,color:'var(--text-muted)',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((e,i) => {
                const eGroups = empGroups[e.id] || []
                return (
                  <tr key={e.id} onClick={() => router.push(`/employees/${e.id}`)}
                    style={{borderBottom:i<employees.length-1?'1px solid var(--border)':'none',cursor:'pointer',transition:'background 0.1s'}}
                    onMouseEnter={ev=>(ev.currentTarget as HTMLElement).style.background='var(--bg)'}
                    onMouseLeave={ev=>(ev.currentTarget as HTMLElement).style.background='transparent'}>
                    <td style={{padding:'14px 16px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <Avatar name={e.name} size={36} />
                        <div style={{fontWeight:600,fontSize:14}}>{e.name}</div>
                      </div>
                    </td>
                    <td style={{padding:'14px 16px'}}>
                      <span style={{fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:20,background:(roleColor[e.role]||'var(--grey)')+'22',color:roleColor[e.role]||'var(--grey)'}}>{e.role}</span>
                    </td>
                    <td style={{padding:'14px 16px',fontSize:13,color:'var(--text-muted)'}}>{e.phone}</td>
                    <td style={{padding:'14px 16px',fontSize:13,color:'var(--primary)',cursor:'pointer'}}>{e.email}</td>
                    <td style={{padding:'14px 16px',fontSize:14,fontWeight:600}}>{fmt.money(e.salary)}</td>
                    <td style={{padding:'14px 16px',fontSize:14,textAlign:'center'}}>
                      {eGroups.length > 0 ? (
                        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                          {eGroups.map(g => (
                            <span key={g.id} style={{fontSize:10,fontWeight:600,padding:'2px 6px',borderRadius:20,background:'var(--primary-light)',color:'var(--primary)'}}>{g.name.split(' ')[0]}</span>
                          ))}
                        </div>
                      ) : <span style={{color:'var(--text-faint)'}}>—</span>}
                    </td>
                    <td style={{padding:'14px 16px'}}><Btn variant="ghost" size="sm">→</Btn></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </div>

      <AddEmployeeModal open={showAdd} onClose={() => setShowAdd(false)} onAdded={load} />
    </div>
  )
}

function AddEmployeeModal({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({ name:'', role:'Учитель', phone:'', email:'', salary:'150000' })
  const [saving, setSaving] = useState(false)
  const set = (k: string) => (v: string) => setForm(f => ({...f,[k]:v}))

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('employees').insert({
      name: form.name, role: form.role, phone: form.phone,
      email: form.email, salary: parseInt(form.salary), active: true
    })
    setSaving(false); onAdded(); onClose()
    setForm({ name:'', role:'Учитель', phone:'', email:'', salary:'150000' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Новый сотрудник">
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <Input label="ФИО" value={form.name} onChange={set('name')} placeholder="Иван Иванов" />
        <Select label="Должность" value={form.role} onChange={set('role')} options={[{value:'Учитель',label:'Учитель'},{value:'Администратор',label:'Администратор'}]} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Input label="Телефон" value={form.phone} onChange={set('phone')} placeholder="+7 701 000 0000" />
          <Input label="Оклад (₸)" value={form.salary} onChange={set('salary')} type="number" placeholder="150000" />
        </div>
        <Input label="Email" value={form.email} onChange={set('email')} type="email" placeholder="ivan@robostars.kz" />
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
          <Btn variant="outline" onClick={onClose}>Отмена</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : 'Добавить'}</Btn>
        </div>
      </div>
    </Modal>
  )
}
