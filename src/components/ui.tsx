'use client'
import React, { useState, useEffect, CSSProperties } from 'react'

export function Avatar({ name, size = 36, src }: { name?: string; size?: number; src?: string }) {
  const colors = ['#0ea5e9','#8b5cf6','#f59e0b','#10b981','#f43f5e','#06b6d4']
  const hue = name ? name.charCodeAt(0) % colors.length : 0
  const initials = name ? name.split(' ').slice(0,2).map(w=>w[0]).join('') : '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: colors[hue],
      display:'flex', alignItems:'center', justifyContent:'center',
      fontWeight: 700, fontSize: size * 0.36, color: '#fff', flexShrink: 0,
      userSelect: 'none', overflow: 'hidden'
    }}>
      {src ? <img src={src} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={name} /> : initials}
    </div>
  )
}

type BadgeStatus = 'paid'|'overdue'|'due_soon'|'present'|'absent'|'late'|'excused'|'beginner'|'intermediate'|'advanced'|'active'|'archived'|'neutral'
export function Badge({ status, text, size='sm' }: { status?: BadgeStatus|string; text?: string; size?: 'sm'|'md' }) {
  const map: Record<string, {bg:string;color:string;label:string}> = {
    paid:        { bg:'var(--green-bg)',       color:'var(--green)',   label: text||'Оплачено' },
    overdue:     { bg:'var(--red-bg)',         color:'var(--red)',     label: text||'Просрочено' },
    due_soon:    { bg:'var(--amber-bg)',       color:'var(--amber)',   label: text||'Скоро срок' },
    present:     { bg:'var(--green-bg)',       color:'var(--green)',   label: text||'Присутствует' },
    absent:      { bg:'var(--red-bg)',         color:'var(--red)',     label: text||'Отсутствует' },
    late:        { bg:'var(--amber-bg)',       color:'var(--amber)',   label: text||'Опоздал' },
    excused:     { bg:'var(--grey-bg)',        color:'var(--grey)',    label: text||'По уважит.' },
    beginner:    { bg:'var(--green-bg)',       color:'var(--green)',   label: text||'Начинающий' },
    intermediate:{ bg:'var(--amber-bg)',       color:'var(--amber)',   label: text||'Средний' },
    advanced:    { bg:'var(--primary-light)', color:'var(--primary)', label: text||'Продвинутый' },
    active:      { bg:'var(--green-bg)',       color:'var(--green)',   label: text||'Активный' },
    archived:    { bg:'var(--grey-bg)',        color:'var(--grey)',    label: text||'Архив' },
    neutral:     { bg:'var(--grey-bg)',        color:'var(--grey)',    label: text||'' },
  }
  const s = map[status||'neutral'] || map.neutral
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      background: s.bg, color: s.color,
      padding: size==='sm' ? '2px 8px' : '4px 12px',
      borderRadius: 20, fontSize: size==='sm' ? 12 : 13, fontWeight: 600,
      whiteSpace: 'nowrap', lineHeight: 1.5
    }}>{s.label}</span>
  )
}

type BtnVariant = 'primary'|'secondary'|'ghost'|'danger'|'outline'|'accent'
export function Btn({ children, variant='primary', size='md', onClick, disabled, style, icon, full, type='button' }: {
  children?: React.ReactNode; variant?: BtnVariant; size?: 'sm'|'md'|'lg'
  onClick?: (e: React.MouseEvent) => void; disabled?: boolean; style?: CSSProperties
  icon?: string; full?: boolean; type?: 'button'|'submit'
}) {
  const sizes = { sm:{padding:'6px 12px',fontSize:13}, md:{padding:'9px 18px',fontSize:14}, lg:{padding:'12px 24px',fontSize:15} }
  const variants: Record<BtnVariant, CSSProperties> = {
    primary:  { background:'var(--primary)', color:'#fff' },
    secondary:{ background:'var(--primary-light)', color:'var(--primary)' },
    ghost:    { background:'transparent', color:'var(--text-muted)' },
    danger:   { background:'var(--red-bg)', color:'var(--red)' },
    outline:  { background:'transparent', color:'var(--text)', border:'1.5px solid var(--border)' },
    accent:   { background:'var(--accent)', color:'#fff' },
  }
  const [hovered, setHovered] = useState(false)
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
        border:'none', cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily:'inherit', fontWeight:600, transition:'all 0.15s',
        borderRadius:10, whiteSpace:'nowrap', width: full ? '100%' : undefined,
        opacity: disabled ? 0.55 : 1,
        ...sizes[size], ...variants[variant],
        ...(hovered && !disabled ? { filter:'brightness(0.93)', transform:'translateY(-1px)' } : {}),
        ...style
      }}>
      {icon && <span style={{fontSize:16}}>{icon}</span>}
      {children}
    </button>
  )
}

export function Input({ label, value, onChange, placeholder, type='text', icon, style, error }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string
  type?: string; icon?: string; style?: CSSProperties; error?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4,...style}}>
      {label && <label style={{fontSize:13,fontWeight:600,color:'var(--text-muted)'}}>{label}</label>}
      <div style={{position:'relative',display:'flex',alignItems:'center'}}>
        {icon && <span style={{position:'absolute',left:12,color:'var(--text-faint)',fontSize:16,pointerEvents:'none'}}>{icon}</span>}
        <input type={type} value={value} onChange={e=>onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
          style={{
            width:'100%', padding: icon ? '10px 12px 10px 38px' : '10px 12px',
            border: `1.5px solid ${error ? 'var(--red)' : focused ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius:10, fontSize:14, fontFamily:'inherit',
            background:'var(--surface)', color:'var(--text)', outline:'none',
            transition:'border-color 0.15s', boxSizing:'border-box',
          }}
        />
      </div>
      {error && <span style={{fontSize:12,color:'var(--red)'}}>{error}</span>}
    </div>
  )
}

export function Select({ label, value, onChange, options, style }: {
  label?: string; value: string; onChange: (v: string) => void
  options: {value:string;label:string}[]; style?: CSSProperties
}) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:4,...style}}>
      {label && <label style={{fontSize:13,fontWeight:600,color:'var(--text-muted)'}}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)} style={{
        padding:'10px 12px', border:'1.5px solid var(--border)', borderRadius:10,
        fontSize:14, fontFamily:'inherit', background:'var(--surface)', color:'var(--text)',
        outline:'none', cursor:'pointer'
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export function Card({ children, style, onClick, hover }: {
  children: React.ReactNode; style?: CSSProperties; onClick?: () => void; hover?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onClick={onClick}
      onMouseEnter={()=>hover&&setHovered(true)}
      onMouseLeave={()=>hover&&setHovered(false)}
      style={{
        background:'var(--surface)', borderRadius:'var(--radius)',
        border:'1.5px solid var(--border)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow)',
        transition:'box-shadow 0.15s, transform 0.15s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}>{children}</div>
  )
}

export function KpiCard({ label, value, sub, color, icon, onClick }: {
  label: string; value: string|number; sub?: string; color?: string; icon?: string; onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onClick={onClick}
      style={{
        background:'var(--surface)', borderRadius:'var(--radius)',
        border:`1.5px solid ${hovered && color ? color+'44' : 'var(--border)'}`,
        boxShadow: hovered && color ? `0 4px 16px ${color}22` : 'var(--shadow)',
        padding:'20px 24px', cursor: onClick?'pointer':'default',
        transition:'all 0.2s', transform: hovered ? 'translateY(-2px)' : 'none',
        display:'flex', flexDirection:'column', gap:8,
      }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <span style={{fontSize:13,fontWeight:600,color:'var(--text-muted)'}}>{label}</span>
        <div style={{width:36,height:36,borderRadius:10,background:(color||'var(--primary)')+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>{icon}</div>
      </div>
      <div style={{fontSize:28,fontWeight:800,color:color||'var(--text)',lineHeight:1}}>{value}</div>
      {sub && <div style={{fontSize:12,color:'var(--text-faint)'}}>{sub}</div>}
    </div>
  )
}

export function Modal({ open, onClose, title, children, width=520 }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if(e.key==='Escape') onClose() }
    if(open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])
  if(!open) return null
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:'var(--surface)',borderRadius:16,width:'100%',maxWidth:width,maxHeight:'90vh',overflow:'auto',boxShadow:'var(--shadow-lg)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 24px',borderBottom:'1.5px solid var(--border)'}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:700}}>{title}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'var(--text-faint)',lineHeight:1,padding:4}}>✕</button>
        </div>
        <div style={{padding:'24px'}}>{children}</div>
      </div>
    </div>
  )
}

export function Skeleton({ width='100%', height=16, radius=6, style }: { width?: string|number; height?: number; radius?: number; style?: CSSProperties }) {
  return (
    <div style={{
      width, height, borderRadius:radius,
      background:'linear-gradient(90deg, var(--border) 25%, var(--bg) 50%, var(--border) 75%)',
      backgroundSize:'200% 100%',
      animation:'shimmer 1.4s infinite',
      ...style
    }} />
  )
}

export function EmptyState({ icon='🤖', title, subtitle, action, onAction }: {
  icon?: string; title: string; subtitle?: string; action?: string; onAction?: () => void
}) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:'60px 24px',textAlign:'center'}}>
      <div style={{fontSize:48,lineHeight:1}}>{icon}</div>
      <div style={{fontSize:16,fontWeight:700,color:'var(--text)'}}>{title}</div>
      {subtitle && <div style={{fontSize:14,color:'var(--text-muted)',maxWidth:280}}>{subtitle}</div>}
      {action && <Btn onClick={onAction} style={{marginTop:8}}>{action}</Btn>}
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder='Поиск...' }: { value: string; onChange: (v:string)=>void; placeholder?: string }) {
  return (
    <div style={{position:'relative',display:'flex',alignItems:'center'}}>
      <span style={{position:'absolute',left:12,color:'var(--text-faint)',fontSize:16,pointerEvents:'none'}}>🔍</span>
      <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{
          padding:'9px 12px 9px 38px', border:'1.5px solid var(--border)', borderRadius:10,
          fontSize:14, fontFamily:'inherit', background:'var(--surface)', color:'var(--text)',
          outline:'none', width:260, transition:'border-color 0.15s'
        }}
        onFocus={e=>(e.target as HTMLInputElement).style.borderColor='var(--primary)'}
        onBlur={e=>(e.target as HTMLInputElement).style.borderColor='var(--border)'}
      />
    </div>
  )
}

export function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:600,
      border:`1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
      background: active ? 'var(--primary-light)' : 'var(--surface)',
      color: active ? 'var(--primary)' : 'var(--text-muted)',
      cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap'
    }}>{label}</button>
  )
}

export function AttendanceDot({ status }: { status: string }) {
  const colors: Record<string,string> = { present:'var(--green)', absent:'var(--red)', late:'var(--amber)', excused:'var(--grey)' }
  return <div style={{width:10,height:10,borderRadius:'50%',background:colors[status]||colors.absent,flexShrink:0}} title={status} />
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24,flexWrap:'wrap',gap:12}}>
      <div>
        <h1 style={{margin:0,fontSize:22,fontWeight:800,color:'var(--text)'}}>{title}</h1>
        {subtitle && <p style={{margin:'4px 0 0',fontSize:14,color:'var(--text-muted)'}}>{subtitle}</p>}
      </div>
      {actions && <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>{actions}</div>}
    </div>
  )
}

export function Tabs({ tabs, active, onChange }: { tabs:{id:string;label:string}[]; active:string; onChange:(id:string)=>void }) {
  return (
    <div style={{display:'flex',gap:2,borderBottom:'2px solid var(--border)',marginBottom:24}}>
      {tabs.map(t => (
        <button key={t.id} onClick={()=>onChange(t.id)} style={{
          padding:'10px 18px', border:'none', background:'none', cursor:'pointer',
          fontSize:14, fontWeight:600, fontFamily:'inherit',
          color: active===t.id ? 'var(--primary)' : 'var(--text-muted)',
          borderBottom: `2px solid ${active===t.id ? 'var(--primary)' : 'transparent'}`,
          marginBottom:-2, transition:'all 0.15s', whiteSpace:'nowrap'
        }}>{t.label}</button>
      ))}
    </div>
  )
}

export const fmt = {
  money: (v: number) => v.toLocaleString('ru-RU') + ' ₸',
  date: (s: string) => new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
  shortDate: (s: string) => new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
  age: (b: string) => {
    const d = new Date(b); const now = new Date()
    let a = now.getFullYear() - d.getFullYear()
    if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--
    return a
  }
}
