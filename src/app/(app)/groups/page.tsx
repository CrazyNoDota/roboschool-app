'use client'
import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Btn, Card, Badge, EmptyState, Modal, Input, Select, Skeleton } from '@/components/ui'
import { TopBar } from '@/components/layout'
import type { Group, Employee } from '@/types'
import { useRouter } from 'next/navigation'

export default function GroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [studentCounts, setStudentCounts] = useState<Record<string,number>>({})
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const [grpRes, empRes, sgRes] = await Promise.all([
      supabase.from('groups').select('*, teacher:employees(id,name)').order('name'),
      supabase.from('employees').select('*').eq('active', true).order('name'),
      supabase.from('student_groups').select('group_id'),
    ])
    if (grpRes.data) setGroups(grpRes.data as any)
    if (empRes.data) setEmployees(empRes.data)
    if (sgRes.data) {
      const counts: Record<string,number> = {}
      sgRes.data.forEach((r: any) => { counts[r.group_id] = (counts[r.group_id]||0) + 1 })
      setStudentCounts(counts)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const levelLabel: Record<string,string> = { beginner:'Начинающие', intermediate:'Средний', advanced:'Продвинутые' }

  if (loading) return <div style={{padding:32,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
    {[...Array(5)].map((_,i) => <Skeleton key={i} height={240} radius={12} />)}
  </div>

  return (
    <div>
      <TopBar title={`Группы (${groups.length})`} actions={<Btn icon="+" onClick={() => setShowAdd(true)}>Новая группа</Btn>} />
      <div style={{padding:'20px 28px'}}>
        {groups.length === 0 ? (
          <EmptyState icon="🏫" title="Нет групп" subtitle="Создайте первую группу" action="Новая группа" onAction={() => setShowAdd(true)} />
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
            {groups.map(g => {
              const teacher = (g as any).teacher
              const count = studentCounts[g.id] || 0
              return (
                <Card key={g.id} hover style={{padding:24,cursor:'pointer',overflow:'hidden'}} onClick={() => router.push(`/groups/${g.id}`)}>
                  <div style={{height:4,background:g.color,marginBottom:16,marginTop:-8,marginLeft:-8,marginRight:-8,borderRadius:'var(--radius) var(--radius) 0 0'}} />
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                    <div>
                      <div style={{fontSize:16,fontWeight:800,color:'var(--text)',marginBottom:4}}>{g.name}</div>
                      <Badge status={g.level} />
                    </div>
                    <div style={{padding:'6px 12px',borderRadius:10,background:g.color+'22',textAlign:'center'}}>
                      <div style={{fontSize:22,fontWeight:800,color:g.color}}>{count}</div>
                      <div style={{fontSize:10,color:g.color,fontWeight:600}}>учеников</div>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {[
                      ['👤', teacher?.name || '—'],
                      ['📦', g.kit_type],
                      ['🕐', `${g.days} · ${g.time} · ${g.duration} мин`],
                      ['🎂', `Возраст: ${g.age_range} лет`],
                    ].map(([icon, text]) => text && (
                      <div key={text as string} style={{display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--text-muted)'}}>
                        <span style={{fontSize:15}}>{icon}</span>{text}
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:16}}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-faint)',marginBottom:4}}>
                      <span>Заполненность</span><span>{count}/{g.max_students}</span>
                    </div>
                    <div style={{height:6,borderRadius:3,background:'var(--border)'}}>
                      <div style={{height:'100%',borderRadius:3,background:g.color,width:`${Math.min((count/g.max_students)*100,100)}%`,transition:'width 0.3s'}} />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <AddGroupModal open={showAdd} onClose={() => setShowAdd(false)} employees={employees} onAdded={load} />
    </div>
  )
}

function AddGroupModal({ open, onClose, employees, onAdded }: { open: boolean; onClose: () => void; employees: Employee[]; onAdded: () => void }) {
  const [form, setForm] = useState({
    name:'', level:'beginner', teacherId:'', days:'', time:'16:00',
    duration:'90', maxStudents:'8', color:'#0ea5e9', ageRange:'', kitType:''
  })
  const [saving, setSaving] = useState(false)
  const set = (k: string) => (v: string) => setForm(f => ({...f,[k]:v}))

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('groups').insert({
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
    })
    setSaving(false)
    onAdded()
    onClose()
  }

  const teachers = employees.filter(e => e.role === 'Учитель')

  return (
    <Modal open={open} onClose={onClose} title="Новая группа">
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <Input label="Название группы" value={form.name} onChange={set('name')} placeholder="Mindstorms Начинающие" />
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
          <Input label="Возраст (напр. 9–12)" value={form.ageRange} onChange={set('ageRange')} placeholder="9–12" />
          <Input label="Набор (напр. LEGO EV3)" value={form.kitType} onChange={set('kitType')} placeholder="Mindstorms EV3" />
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
          <Btn variant="outline" onClick={onClose}>Отмена</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : 'Создать группу'}</Btn>
        </div>
      </div>
    </Modal>
  )
}
