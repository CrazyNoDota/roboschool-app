'use client'
import React, { useState, useEffect } from 'react'
import { Avatar } from './ui'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Главная',    icon: '⊞',  href: '/dashboard' },
  { id: 'students',   label: 'Ученики',    icon: '👤',  href: '/students' },
  { id: 'groups',     label: 'Группы',     icon: '🏫',  href: '/groups' },
  { id: 'schedule',   label: 'Расписание', icon: '📅',  href: '/schedule' },
  { id: 'payments',   label: 'Платежи',    icon: '💳',  href: '/payments' },
  { id: 'employees',  label: 'Сотрудники', icon: '👥',  href: '/employees' },
  { id: 'finances',   label: 'Финансы',    icon: '📊',  href: '/finances' },
  { id: 'settings',   label: 'Настройки',  icon: '⚙️',  href: '/settings' },
]

export function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean|((c:boolean)=>boolean)) => void }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside style={{
      width: collapsed ? 64 : 240, flexShrink: 0,
      background: 'var(--surface)', borderRight: '1.5px solid var(--border)',
      display: 'flex', flexDirection: 'column', height: '100vh',
      position: 'sticky', top: 0, transition: 'width 0.2s ease', overflow: 'hidden',
      zIndex: 10
    }}>
      <div style={{
        padding: collapsed ? '20px 0' : '20px 16px',
        borderBottom: '1.5px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        minHeight: 64
      }}>
        <div style={{
          width:36, height:36, borderRadius:10, flexShrink:0,
          background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:18, fontWeight:800, color:'#fff'
        }}>⚙</div>
        {!collapsed && (
          <div>
            <div style={{fontSize:15,fontWeight:800,color:'var(--text)',lineHeight:1.2}}>RoboSchool</div>
            <div style={{fontSize:11,color:'var(--text-faint)',fontWeight:500}}>Алматы</div>
          </div>
        )}
      </div>

      <nav style={{flex:1,padding:'8px 8px',overflowY:'auto',overflowX:'hidden'}}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <button key={item.id} onClick={() => router.push(item.href)}
              title={collapsed ? item.label : undefined}
              style={{
                display:'flex', alignItems:'center',
                gap: collapsed ? 0 : 10, width:'100%',
                padding: collapsed ? '10px 0' : '10px 12px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius:10, border:'none', cursor:'pointer',
                background: active ? 'var(--primary-light)' : 'transparent',
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                fontFamily:'inherit', fontSize:14, fontWeight: active ? 700 : 500,
                transition:'all 0.12s', marginBottom:2,
              }}
              onMouseEnter={e => { if(!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)' }}
              onMouseLeave={e => { if(!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <span style={{fontSize:18,flexShrink:0}}>{item.icon}</span>
              {!collapsed && <span style={{whiteSpace:'nowrap'}}>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      <div style={{borderTop:'1.5px solid var(--border)',padding:'12px 8px',display:'flex',flexDirection:'column',gap:6}}>
        <button onClick={() => setCollapsed((c: boolean) => !c)} style={{
          display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'flex-end',
          gap:8, padding:'8px', borderRadius:8, border:'none', background:'none',
          cursor:'pointer', color:'var(--text-faint)', fontSize:14
        }}>
          <span style={{fontSize:18,transform:collapsed?'rotate(180deg)':'none',transition:'transform 0.2s'}}>◀</span>
        </button>
        {!collapsed && (
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:10,background:'var(--bg)',cursor:'pointer'}}
            onClick={handleLogout} title="Выйти">
            <Avatar name="Admin" size={30} />
            <div style={{overflow:'hidden',flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Администратор</div>
              <div style={{fontSize:11,color:'var(--text-faint)'}}>Выйти</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export function MobileNav() {
  const router = useRouter()
  const pathname = usePathname()
  const top5 = NAV_ITEMS.slice(0, 5)
  return (
    <nav style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:50,
      background:'var(--surface)', borderTop:'1.5px solid var(--border)',
      display:'flex', padding:'6px 0 6px'
    }}>
      {top5.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <button key={item.id} onClick={() => router.push(item.href)} style={{
            flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            padding:'4px 0', border:'none', background:'none', cursor:'pointer',
            color: active ? 'var(--primary)' : 'var(--text-faint)',
            fontFamily:'inherit', fontSize:10, fontWeight: active ? 700 : 500,
          }}>
            <span style={{fontSize:22}}>{item.icon}</span>
            <span style={{whiteSpace:'nowrap'}}>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function TopBar({ title, onBack, actions }: { title: string; onBack?: () => void; actions?: React.ReactNode }) {
  return (
    <div style={{
      height:56, display:'flex', alignItems:'center', gap:12,
      padding:'0 24px', borderBottom:'1.5px solid var(--border)',
      background:'var(--surface)', flexShrink:0, position:'sticky', top:0, zIndex:5
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)',
          fontSize:18, padding:4, borderRadius:6, display:'flex', alignItems:'center'
        }}>←</button>
      )}
      <div style={{flex:1,fontSize:16,fontWeight:700,color:'var(--text)'}}>{title}</div>
      {actions && <div style={{display:'flex',gap:8}}>{actions}</div>}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'var(--bg)'}}>
      {!isMobile && <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />}
      <main style={{flex:1,overflow:'auto',display:'flex',flexDirection:'column',paddingBottom:isMobile?70:0}}>
        {children}
      </main>
      {isMobile && <MobileNav />}
    </div>
  )
}
