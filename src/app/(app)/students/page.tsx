'use client'
import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Btn, SearchBar, FilterChip, Card, Avatar, Badge, fmt, Modal, Input, Select, EmptyState, Skeleton } from '@/components/ui'
import { TopBar } from '@/components/layout'
import type { Student, Group } from '@/types'
import { useRouter } from 'next/navigation'

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterGroup, setFilterGroup] = useState('all')
  const [showAdd, setShowAdd] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const [studRes, grpRes] = await Promise.all([
      supabase.from('students').select('*, student_groups(group_id, groups(id,name,color))').eq('active', true).order('name'),
      supabase.from('groups').select('*').order('name'),
    ])
    if (studRes.data) setStudents(studRes.data.map((s: any) => ({ ...s, groups: s.student_groups?.map((sg: any) => sg.groups) })))
    if (grpRes.data) setGroups(grpRes.data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = s.name.toLowerCase().includes(q) || (s.parent_name||'').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || s.payment_status === filterStatus
    const matchGroup = filterGroup === 'all' || (s.groups as any[])?.some((g: any) => g?.id === filterGroup)
    return matchSearch && matchStatus && matchGroup
  })

  if (loading) return (
    <div style={{padding:32,display:'flex',flexDirection:'column',gap:12}}>
      {[...Array(6)].map((_,i) => <Skeleton key={i} height={56} radius={8} />)}
    </div>
  )

  return (
    <div>
      <TopBar title={`Ученики (${students.length})`} actions={<Btn icon="+" onClick={() => setShowAdd(true)}>Добавить ученика</Btn>} />
      <div style={{padding:'20px 28px'}}>
        <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
          <SearchBar value={search} onChange={setSearch} placeholder="Поиск по имени, родителю..." />
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[['all','Все'],['paid','Оплачено'],['due_soon','Скоро срок'],['overdue','Просрочено']].map(([v,l]) => (
              <FilterChip key={v} label={l} active={filterStatus===v} onClick={() => setFilterStatus(v)} />
            ))}
          </div>
          <select value={filterGroup} onChange={e=>setFilterGroup(e.target.value)} style={{
            padding:'8px 12px',border:'1.5px solid var(--border)',borderRadius:10,fontSize:13,
            fontFamily:'inherit',background:'var(--surface)',color:'var(--text)',cursor:'pointer',outline:'none'
          }}>
            <option value="all">Все группы</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="👤" title="Ученики не найдены" subtitle="Попробуйте изменить фильтры" action="Добавить ученика" onAction={() => setShowAdd(true)} />
        ) : (
          <Card style={{overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1.5px solid var(--border)'}}>
                  {['Ученик','Возраст','Группа','Родитель','Статус оплаты','Зачислен',''].map(h => (
                    <th key={h} style={{padding:'12px 16px',textAlign:'left',fontSize:12,fontWeight:700,color:'var(--text-muted)',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const grps = (s.groups as any[]) || []
                  const age = s.birthday ? fmt.age(s.birthday) : '—'
                  return (
                    <tr key={s.id} onClick={() => router.push(`/students/${s.id}`)}
                      style={{borderBottom:i<filtered.length-1?'1px solid var(--border)':'none',cursor:'pointer',transition:'background 0.1s'}}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--bg)'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                      <td style={{padding:'12px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <Avatar name={s.name} size={36} />
                          <div>
                            <div style={{fontWeight:600,fontSize:14,color:'var(--text)'}}>{s.name}</div>
                            <div style={{fontSize:12,color:'var(--text-faint)'}}>с {fmt.shortDate(s.enrolled)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'12px 16px',fontSize:14,color:'var(--text)'}}>{age} лет</td>
                      <td style={{padding:'12px 16px'}}>
                        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                          {grps.map((g: any) => g && (
                            <span key={g.id} style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:20,background:'var(--primary-light)',color:'var(--primary)'}}>{g.name}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{padding:'12px 16px'}}>
                        <div style={{fontSize:13,color:'var(--text)'}}>{s.parent_name}</div>
                        <div style={{fontSize:12,color:'var(--text-faint)'}}>{s.parent_phone}</div>
                      </td>
                      <td style={{padding:'12px 16px'}}><Badge status={s.payment_status} /></td>
                      <td style={{padding:'12px 16px',fontSize:13,color:'var(--text-muted)'}}>{fmt.shortDate(s.enrolled)}</td>
                      <td style={{padding:'12px 16px'}}><Btn variant="ghost" size="sm">→</Btn></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      <AddStudentModal open={showAdd} onClose={() => setShowAdd(false)} groups={groups} onAdded={load} />
    </div>
  )
}

function AddStudentModal({ open, onClose, groups, onAdded }: { open: boolean; onClose: () => void; groups: Group[]; onAdded: () => void }) {
  const [form, setForm] = useState({ name:'', birthday:'', parentName:'', parentPhone:'', parentEmail:'', groupId:'', city:'Алматы' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string) => (v: string) => setForm(f => ({...f,[k]:v}))

  const handleSave = async () => {
    if (!form.name) { setError('Введите имя ученика'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase.from('students').insert({
      name: form.name,
      birthday: form.birthday || null,
      parent_name: form.parentName,
      parent_phone: form.parentPhone,
      parent_email: form.parentEmail,
      city: form.city,
      payment_status: 'due_soon',
      enrolled: new Date().toISOString().split('T')[0],
    }).select().single()

    if (err) { setError(err.message); setSaving(false); return }

    if (data && form.groupId) {
      await supabase.from('student_groups').insert({ student_id: data.id, group_id: form.groupId })
    }

    await supabase.from('activity_log').insert({ type:'student', text:`Новый ученик: ${form.name} добавлен`, icon:'👤' })
    setSaving(false)
    onAdded()
    onClose()
    setForm({ name:'', birthday:'', parentName:'', parentPhone:'', parentEmail:'', groupId:'', city:'Алматы' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Новый ученик">
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <Input label="ФИО ученика" value={form.name} onChange={set('name')} placeholder="Алия Бекова" error={error} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Input label="Дата рождения" value={form.birthday} onChange={set('birthday')} type="date" />
          <Select label="Группа" value={form.groupId} onChange={set('groupId')}
            options={[{value:'',label:'Без группы'}, ...groups.map(g=>({value:g.id,label:g.name}))]} />
        </div>
        <Input label="ФИО родителя/опекуна" value={form.parentName} onChange={set('parentName')} placeholder="Гульнара Бекова" />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Input label="Телефон родителя" value={form.parentPhone} onChange={set('parentPhone')} placeholder="+7 701 234 5678" />
          <Input label="Email родителя" value={form.parentEmail} onChange={set('parentEmail')} type="email" placeholder="parent@mail.ru" />
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
          <Btn variant="outline" onClick={onClose}>Отмена</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : 'Добавить ученика'}</Btn>
        </div>
      </div>
    </Modal>
  )
}
