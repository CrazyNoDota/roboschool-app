'use client'
import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Btn, Card, Badge, EmptyState, Modal, Input, Select, FilterChip, fmt } from '@/components/ui'
import { TopBar } from '@/components/layout'
import { useRouter } from 'next/navigation'

const DAY_NAMES_SHORT = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб']
const DAY_NAMES_FULL  = ['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота']
const W_DAY_NAMES = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

const toDateStr = (d: Date) => d.toISOString().split('T')[0]
const timeToMin = (t: string) => { const [h,m] = t.split(':').map(Number); return h*60+m }
const shiftDate = (s: string, delta: number) => { const d = new Date(s); d.setDate(d.getDate()+delta); return toDateStr(d) }

export default function SchedulePage() {
  const router = useRouter()
  const [lessons, setLessons] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'day'|'group'|'week'>('day')
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()))
  const [selectedGroup, setSelectedGroup] = useState('')
  const [weekOffset, setWeekOffset] = useState(0)
  const [showAddLesson, setShowAddLesson] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const supabase = createClient()
    const [lesRes, grpRes] = await Promise.all([
      supabase.from('lessons').select('*, group:groups(*)').order('date').order('start_time'),
      supabase.from('groups').select('*').order('name'),
    ])
    if (lesRes.data) setLessons(lesRes.data)
    if (grpRes.data) {
      setGroups(grpRes.data)
      if (!selectedGroup && grpRes.data[0]) setSelectedGroup(grpRes.data[0].id)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const getGroup = (id: string) => groups.find(g => g.id === id)

  const formatDateFull = (s: string) => {
    const d = new Date(s)
    return `${d.getDate()} ${['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'][d.getMonth()]}, ${DAY_NAMES_FULL[d.getDay()]}`
  }

  // Week view helpers
  const baseMonday = new Date()
  baseMonday.setDate(baseMonday.getDate() - (baseMonday.getDay() === 0 ? 6 : baseMonday.getDay() - 1) + weekOffset * 7)
  const weekDays = Array.from({length:7}, (_,i) => { const d = new Date(baseMonday); d.setDate(d.getDate()+i); return d })

  const START_HOUR = 9, END_HOUR = 21, PX_PER_HOUR = 72
  const GRID_H = (END_HOUR - START_HOUR) * PX_PER_HOUR
  const hours = Array.from({length:END_HOUR-START_HOUR}, (_,i) => START_HOUR+i)

  const assignLanes = (dayLessons: any[]) => {
    const sorted = [...dayLessons].sort((a,b) => a.start_time.localeCompare(b.start_time))
    const laneEnds: number[] = []
    return sorted.map(lesson => {
      const grp = lesson.group || getGroup(lesson.group_id)
      const startMin = timeToMin(lesson.start_time)
      const endMin = startMin + (grp?.duration || 60)
      let lane = laneEnds.findIndex(end => end <= startMin)
      if (lane === -1) lane = laneEnds.length
      laneEnds[lane] = endMin
      const concurrent = sorted.filter(o => {
        const oStart = timeToMin(o.start_time)
        const oEnd = oStart + ((o.group || getGroup(o.group_id))?.duration || 60)
        return oStart < endMin && oEnd > startMin
      })
      return { ...lesson, lane, totalLanes: concurrent.length }
    })
  }

  if (loading) return <div style={{padding:32,color:'var(--text-muted)'}}>Загрузка расписания...</div>

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <TopBar title="Расписание"
        actions={
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <div style={{display:'flex',gap:0,borderRadius:10,overflow:'hidden',border:'1.5px solid var(--border)',flexShrink:0}}>
              {[['day','📅 День'],['group','🏫 Группа'],['week','🗓 Неделя']].map(([v,l]) => (
                <button key={v} onClick={() => setViewMode(v as any)} style={{
                  padding:'7px 16px',border:'none',fontFamily:'inherit',fontSize:13,fontWeight:600,
                  cursor:'pointer',transition:'all 0.12s',whiteSpace:'nowrap',
                  background:viewMode===v?'var(--primary)':'var(--surface)',
                  color:viewMode===v?'#fff':'var(--text-muted)',
                  borderRight:v!=='week'?'1px solid var(--border)':'none',
                }}>{l}</button>
              ))}
            </div>
            <Btn size="sm" icon="+" variant="secondary" onClick={() => setShowAddLesson(true)}>Добавить занятие</Btn>
          </div>
        }
      />

      {viewMode === 'day' && (
        <div style={{padding:'20px 28px'}}>
          {/* Date strip */}
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
            <button onClick={() => setSelectedDate(s => shiftDate(s,-1))} style={{width:34,height:34,borderRadius:8,border:'1.5px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>←</button>
            <div style={{display:'flex',gap:6,flex:1,justifyContent:'center',flexWrap:'wrap'}}>
              {Array.from({length:7},(_,i)=>{const d=new Date(selectedDate);d.setDate(d.getDate()-3+i);return d}).map((d,i)=>{
                const ds = toDateStr(d)
                const isSelected = ds === selectedDate
                const hasLessons = lessons.some(l => l.date === ds)
                return (
                  <button key={i} onClick={() => setSelectedDate(ds)} style={{
                    display:'flex',flexDirection:'column',alignItems:'center',padding:'8px 12px',
                    borderRadius:10,border:'1.5px solid',
                    borderColor:isSelected?'var(--primary)':'var(--border)',
                    background:isSelected?'var(--primary)':'var(--surface)',
                    cursor:'pointer',minWidth:52,gap:2,transition:'all 0.12s'
                  }}>
                    <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:isSelected?'rgba(255,255,255,0.8)':'var(--text-muted)'}}>{DAY_NAMES_SHORT[d.getDay()]}</span>
                    <span style={{fontSize:18,fontWeight:800,color:isSelected?'#fff':'var(--text)'}}>{d.getDate()}</span>
                    {hasLessons && <div style={{width:5,height:5,borderRadius:'50%',background:isSelected?'rgba(255,255,255,0.7)':'var(--primary)'}} />}
                  </button>
                )
              })}
            </div>
            <button onClick={() => setSelectedDate(s => shiftDate(s,1))} style={{width:34,height:34,borderRadius:8,border:'1.5px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>→</button>
          </div>
          <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:16,textTransform:'capitalize'}}>{formatDateFull(selectedDate)}</div>
          {lessons.filter(l=>l.date===selectedDate).length === 0 ? (
            <EmptyState icon="🎉" title="Занятий нет" subtitle="В этот день занятий не запланировано" />
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {lessons.filter(l=>l.date===selectedDate).sort((a,b)=>a.start_time.localeCompare(b.start_time)).map(lesson => {
                const grp = lesson.group || getGroup(lesson.group_id)
                const endMin = timeToMin(lesson.start_time) + (grp?.duration||60)
                return (
                  <Card key={lesson.id} style={{padding:'18px 20px',borderLeft:`4px solid ${grp?.color||'var(--primary)'}`,display:'flex',alignItems:'center',gap:20,cursor:'pointer'}}
                    hover onClick={() => router.push(`/attendance/${lesson.id}`)}>
                    <div style={{textAlign:'center',flexShrink:0,minWidth:56}}>
                      <div style={{fontSize:18,fontWeight:800,color:grp?.color||'var(--primary)'}}>{lesson.start_time}</div>
                      <div style={{fontSize:11,color:'var(--text-faint)',marginTop:2}}>{Math.floor(endMin/60)}:{String(endMin%60).padStart(2,'0')}</div>
                      <div style={{fontSize:11,color:'var(--text-faint)'}}>{grp?.duration} мин</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15,fontWeight:800,color:'var(--text)',marginBottom:4}}>{grp?.name}</div>
                      <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:4}}>{lesson.topic}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
                      <Badge status={lesson.status==='completed'?'neutral':'active'} text={lesson.status==='completed'?'Завершено':'Запланировано'} />
                      <Btn size="sm" variant="secondary" style={{color:grp?.color,background:grp?.color+'22',border:'none'}} onClick={e=>{e.stopPropagation();router.push(`/attendance/${lesson.id}`)}}>Отметить →</Btn>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {viewMode === 'group' && (
        <div style={{padding:'20px 28px'}}>
          <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
            {groups.map(g => (
              <button key={g.id} onClick={() => setSelectedGroup(g.id)} style={{
                display:'flex',alignItems:'center',gap:8,padding:'8px 16px',borderRadius:10,border:'2px solid',cursor:'pointer',transition:'all 0.12s',fontFamily:'inherit',fontSize:13,
                borderColor:selectedGroup===g.id?g.color:'var(--border)',
                background:selectedGroup===g.id?g.color+'22':'var(--surface)',
                fontWeight:selectedGroup===g.id?700:500
              }}>
                <div style={{width:8,height:8,borderRadius:'50%',background:g.color}} />
                {g.name}
              </button>
            ))}
          </div>
          {(() => {
            const grp = groups.find(g=>g.id===selectedGroup)
            if (!grp) return null
            const grpLessons = lessons.filter(l=>l.group_id===selectedGroup).sort((a,b)=>a.date.localeCompare(b.date))
            const upcoming = grpLessons.filter(l=>l.status==='scheduled')
            const past = grpLessons.filter(l=>l.status==='completed')
            return (
              <>
                {upcoming.length > 0 && <>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--text-muted)',marginBottom:10,letterSpacing:'0.05em'}}>ПРЕДСТОЯЩИЕ ЗАНЯТИЯ</div>
                  <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:20}}>
                    {upcoming.map(l => (
                      <Card key={l.id} style={{padding:'14px 18px',display:'flex',gap:14,alignItems:'center',cursor:'pointer'}} hover onClick={() => router.push(`/attendance/${l.id}`)}>
                        <div style={{width:4,alignSelf:'stretch',borderRadius:4,background:grp.color,flexShrink:0}} />
                        <div style={{flex:1}}>
                          <div style={{fontSize:14,fontWeight:700}}>{l.topic}</div>
                          <div style={{fontSize:12,color:'var(--text-faint)',marginTop:2}}>{fmt.date(l.date)} · {l.start_time}</div>
                        </div>
                        <Btn size="sm" variant="secondary" style={{color:grp.color,background:grp.color+'22',border:'none'}}>Отметить</Btn>
                      </Card>
                    ))}
                  </div>
                </>}
                {past.length > 0 && <>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--text-muted)',marginBottom:10,letterSpacing:'0.05em'}}>ПРОШЕДШИЕ ЗАНЯТИЯ</div>
                  {past.map(l => (
                    <div key={l.id} style={{display:'flex',gap:12,padding:'10px 14px',borderRadius:10,background:'var(--bg)',alignItems:'center',opacity:0.75,marginBottom:6}}>
                      <div style={{width:4,alignSelf:'stretch',borderRadius:4,background:'var(--grey)',flexShrink:0}} />
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600,color:'var(--text-muted)'}}>{l.topic}</div>
                        <div style={{fontSize:11,color:'var(--text-faint)',marginTop:1}}>{fmt.date(l.date)} · {l.start_time}</div>
                      </div>
                      <Badge status="neutral" text="Завершено" />
                    </div>
                  ))}
                </>}
                {grpLessons.length === 0 && <EmptyState icon="📅" title="Занятий нет" />}
              </>
            )
          })()}
        </div>
      )}

      {viewMode === 'week' && (
        <div style={{flex:1,overflow:'auto',padding:'0 28px 24px'}}>
          <div style={{minWidth:640}}>
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'14px 0',justifyContent:'center'}}>
              <Btn variant="outline" size="sm" onClick={() => setWeekOffset(w=>w-1)}>← Пред.</Btn>
              <span style={{fontSize:13,fontWeight:600,color:'var(--text-muted)',padding:'0 8px'}}>
                {weekDays[0].getDate()} – {weekDays[6].getDate()} {weekDays[6].toLocaleString('ru-RU',{month:'short'})}
              </span>
              <Btn variant="outline" size="sm" onClick={() => setWeekOffset(w=>w+1)}>След. →</Btn>
              <Btn variant="secondary" size="sm" onClick={() => setWeekOffset(0)}>Сегодня</Btn>
            </div>
            <div style={{display:'flex',borderBottom:'1.5px solid var(--border)'}}>
              <div style={{width:52,flexShrink:0}} />
              {weekDays.map((d,i) => {
                const ds = toDateStr(d)
                const isToday = ds === toDateStr(new Date())
                return (
                  <div key={i} style={{flex:1,textAlign:'center',padding:'10px 4px',cursor:'pointer',background:isToday?'var(--primary-light)':'transparent',borderLeft:'1px solid var(--border)'}}
                    onClick={() => { setSelectedDate(ds); setViewMode('day') }}>
                    <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',color:isToday?'var(--primary)':'var(--text-muted)'}}>{W_DAY_NAMES[i]}</div>
                    <div style={{fontSize:20,fontWeight:800,margin:'2px auto 0',width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%',background:isToday?'var(--primary)':'transparent',color:isToday?'#fff':'var(--text)'}}>{d.getDate()}</div>
                  </div>
                )
              })}
            </div>
            <div style={{display:'flex'}}>
              <div style={{width:52,flexShrink:0,position:'relative',height:GRID_H}}>
                {hours.map(h => (
                  <div key={h} style={{position:'absolute',top:(h-START_HOUR)*PX_PER_HOUR-8,right:8,fontSize:11,color:'var(--text-faint)',userSelect:'none'}}>{h}:00</div>
                ))}
              </div>
              {weekDays.map((d,dayIdx) => {
                const ds = toDateStr(d)
                const isToday = ds === toDateStr(new Date())
                const assigned = assignLanes(lessons.filter(l=>l.date===ds))
                return (
                  <div key={ds} style={{flex:1,position:'relative',height:GRID_H,borderLeft:'1px solid var(--border)',background:isToday?'oklch(0.95 0.05 222 / 0.2)':'transparent'}}>
                    {hours.map(h => (
                      <div key={h} style={{position:'absolute',top:(h-START_HOUR)*PX_PER_HOUR,left:0,right:0,borderTop:`1px solid ${h%3===0?'var(--border)':'oklch(0.91 0.008 225/0.5)'}`}} />
                    ))}
                    {assigned.map(item => {
                      const grp = item.group || getGroup(item.group_id)
                      if (!grp) return null
                      const topPx = (timeToMin(item.start_time)-START_HOUR*60)/60*PX_PER_HOUR
                      const heightPx = Math.max(grp.duration/60*PX_PER_HOUR-4,28)
                      const laneW = 100/item.totalLanes
                      return (
                        <div key={item.id} onClick={() => router.push(`/attendance/${item.id}`)}
                          style={{position:'absolute',top:topPx+2,left:`calc(${item.lane*laneW}% + 2px)`,width:`calc(${laneW}% - 4px)`,height:heightPx,background:grp.color,borderRadius:8,padding:'5px 8px',cursor:'pointer',overflow:'hidden',color:'#fff',boxShadow:'0 2px 6px rgba(0,0,0,0.15)',transition:'filter 0.12s',zIndex:2}}
                          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.filter='brightness(1.1)';(e.currentTarget as HTMLElement).style.zIndex='5'}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.filter='brightness(1)';(e.currentTarget as HTMLElement).style.zIndex='2'}}>
                          <div style={{fontSize:11,fontWeight:800,lineHeight:1.3,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{item.start_time}</div>
                          {heightPx>36&&<div style={{fontSize:10,opacity:0.9,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',marginTop:1}}>{grp.name}</div>}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
            <div style={{display:'flex',gap:14,marginTop:14,flexWrap:'wrap',paddingLeft:52}}>
              {groups.map(g => (
                <div key={g.id} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--text-muted)',cursor:'pointer'}}
                  onClick={() => { setSelectedGroup(g.id); setViewMode('group') }}>
                  <div style={{width:10,height:10,borderRadius:3,background:g.color}} />{g.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <AddLessonModal open={showAddLesson} onClose={() => setShowAddLesson(false)} groups={groups} defaultDate={selectedDate} onAdded={load} />
    </div>
  )
}

function AddLessonModal({ open, onClose, groups, defaultDate, onAdded }: { open: boolean; onClose: () => void; groups: any[]; defaultDate: string; onAdded: () => void }) {
  const [form, setForm] = useState({ groupId:'', date:defaultDate, startTime:'16:00', topic:'' })
  const [saving, setSaving] = useState(false)
  const set = (k: string) => (v: string) => setForm(f => ({...f,[k]:v}))

  const handleSave = async () => {
    if (!form.groupId || !form.date || !form.startTime) return
    setSaving(true)
    const supabase = createClient()
    const grp = groups.find(g=>g.id===form.groupId)
    await supabase.from('lessons').insert({
      group_id: form.groupId,
      date: form.date,
      start_time: form.startTime,
      duration: grp?.duration || 90,
      topic: form.topic || 'Занятие',
      status: 'scheduled',
    })
    setSaving(false)
    onAdded()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Добавить занятие" width={440}>
      <div style={{display:'flex',flexDirection:'column',gap:14}}>
        <Select label="Группа" value={form.groupId} onChange={set('groupId')}
          options={[{value:'',label:'Выберите группу'}, ...groups.map(g=>({value:g.id,label:g.name}))]} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <Input label="Дата" value={form.date} onChange={set('date')} type="date" />
          <Input label="Время" value={form.startTime} onChange={set('startTime')} placeholder="16:00" />
        </div>
        <Input label="Тема занятия" value={form.topic} onChange={set('topic')} placeholder="Сенсоры и обратная связь" />
        <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:8}}>
          <Btn variant="outline" onClick={onClose}>Отмена</Btn>
          <Btn onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : 'Добавить занятие'}</Btn>
        </div>
      </div>
    </Modal>
  )
}
