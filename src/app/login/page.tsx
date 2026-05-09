'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Btn, Input } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [lang, setLang] = useState<'ru'|'kz'>('ru')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  const t = {
    ru: { title:'Добро пожаловать!', sub:'Войдите в систему управления', email:'Email', pass:'Пароль', btn:'Войти', forgot:'Забыли пароль?', demo:'Войти как демо' },
    kz: { title:'Қош келдіңіз!',    sub:'Басқару жүйесіне кіріңіз',    email:'Email', pass:'Құпия сөз', btn:'Кіру', forgot:'Құпия сөзді ұмыттыңыз ба?', demo:'Демо ретінде кіру' },
  }[lang]

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!email) { setError('Введите email'); return }
    if (!password) { setError('Введите пароль'); return }
    setError(''); setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Неверный email или пароль')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleDemo = async () => {
    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@roboschool.kz',
      password: 'demo123456'
    })
    if (authError) {
      setError('Демо-аккаунт временно недоступен')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',background:'var(--bg)',fontFamily:'inherit'}}>
      {/* Left panel */}
      <div style={{
        flex:1, background:'var(--primary)', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', padding:48, gap:24,
        position:'relative', overflow:'hidden'
      }} className="login-left">
        <div style={{position:'absolute',top:-80,right:-80,width:320,height:320,borderRadius:'50%',background:'rgba(255,255,255,0.07)'}} />
        <div style={{position:'absolute',bottom:-60,left:-60,width:240,height:240,borderRadius:'50%',background:'rgba(255,255,255,0.05)'}} />
        <svg width="220" height="240" viewBox="0 0 220 240" fill="none" style={{position:'relative',zIndex:1}}>
          <rect x="60" y="100" width="100" height="90" rx="16" fill="white" fillOpacity="0.18"/>
          <rect x="60" y="100" width="100" height="90" rx="16" stroke="white" strokeOpacity="0.5" strokeWidth="2"/>
          <rect x="72" y="52" width="76" height="58" rx="14" fill="white" fillOpacity="0.22"/>
          <rect x="72" y="52" width="76" height="58" rx="14" stroke="white" strokeOpacity="0.5" strokeWidth="2"/>
          <circle cx="96" cy="74" r="10" fill="var(--accent)" fillOpacity="0.9"/>
          <circle cx="124" cy="74" r="10" fill="var(--accent)" fillOpacity="0.9"/>
          <circle cx="99" cy="71" r="3" fill="white"/>
          <circle cx="127" cy="71" r="3" fill="white"/>
          <rect x="90" y="92" width="40" height="8" rx="4" fill="white" fillOpacity="0.6"/>
          <line x1="110" y1="52" x2="110" y2="28" stroke="white" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="110" cy="22" r="7" fill="var(--accent)" fillOpacity="0.9"/>
          <rect x="24" y="108" width="36" height="22" rx="11" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
          <rect x="160" y="108" width="36" height="22" rx="11" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
          <rect x="76" y="190" width="28" height="36" rx="10" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
          <rect x="116" y="190" width="28" height="36" rx="10" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.4" strokeWidth="1.5"/>
          <rect x="82" y="120" width="56" height="32" rx="8" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.3" strokeWidth="1.5"/>
          <circle cx="99" cy="136" r="5" fill="var(--accent)" fillOpacity="0.7"/>
          <circle cx="110" cy="136" r="5" fill="white" fillOpacity="0.4"/>
          <circle cx="121" cy="136" r="5" fill="white" fillOpacity="0.4"/>
        </svg>
        <div style={{textAlign:'center',position:'relative',zIndex:1}}>
          <div style={{fontSize:22,fontWeight:800,color:'#fff',marginBottom:8}}>RoboSchool</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,0.75)',lineHeight:1.5,maxWidth:260}}>
            {lang==='ru' ? 'Управляйте занятиями, учениками и финансами в одном месте' : 'Сабақтарды, оқушыларды және қаражатты бір жерде басқарыңыз'}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{width:420,display:'flex',flexDirection:'column',justifyContent:'center',padding:'48px 40px',background:'var(--surface)',position:'relative'}} className="login-right">
        <div style={{position:'absolute',top:24,right:24,display:'flex',gap:6}}>
          {(['ru','kz'] as const).map(l => (
            <button key={l} onClick={()=>setLang(l)} style={{
              padding:'5px 12px', borderRadius:20, fontSize:13, fontWeight:700,
              border:`1.5px solid ${lang===l ? 'var(--primary)' : 'var(--border)'}`,
              background: lang===l ? 'var(--primary-light)' : 'transparent',
              color: lang===l ? 'var(--primary)' : 'var(--text-muted)',
              cursor:'pointer', transition:'all 0.15s', textTransform:'uppercase'
            }}>{l}</button>
          ))}
        </div>

        <div style={{marginBottom:32}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
            <div style={{width:40,height:40,borderRadius:10,background:'var(--primary)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>⚙</div>
            <span style={{fontSize:18,fontWeight:800,color:'var(--text)'}}>RoboSchool</span>
          </div>
          <h2 style={{margin:0,fontSize:24,fontWeight:800,color:'var(--text)'}}>{t.title}</h2>
          <p style={{margin:'6px 0 0',fontSize:14,color:'var(--text-muted)'}}>{t.sub}</p>
        </div>

        <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:16}}>
          <Input label={t.email} value={email} onChange={setEmail} type="email"
            placeholder="admin@roboschool.kz" icon="✉" error={error && !email ? error : ''} />
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:13,fontWeight:600,color:'var(--text-muted)'}}>{t.pass}</label>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text-faint)',fontSize:16,pointerEvents:'none'}}>🔒</span>
              <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width:'100%',padding:'10px 40px 10px 38px',border:`1.5px solid ${error && !password ? 'var(--red)':'var(--border)'}`,
                  borderRadius:10,fontSize:14,fontFamily:'inherit',background:'var(--surface)',color:'var(--text)',outline:'none',boxSizing:'border-box'
                }}
              />
              <button type="button" onClick={()=>setShowPass(s=>!s)} style={{
                position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
                background:'none',border:'none',cursor:'pointer',color:'var(--text-faint)',fontSize:16
              }}>{showPass ? '🙈' : '👁'}</button>
            </div>
          </div>

          {error && email && password && (
            <div style={{padding:'10px 14px',borderRadius:10,background:'var(--red-bg)',color:'var(--red)',fontSize:13,fontWeight:600}}>{error}</div>
          )}

          <Btn type="submit" full disabled={loading} size="lg" style={{marginTop:4}}>
            {loading ? '⏳ Загрузка...' : t.btn}
          </Btn>

          <div style={{borderTop:'1.5px solid var(--border)',paddingTop:16,textAlign:'center'}}>
            <Btn variant="outline" full onClick={handleDemo} disabled={loading}>{t.demo}</Btn>
          </div>
        </form>

        <div style={{position:'absolute',bottom:24,left:40,right:40,textAlign:'center',fontSize:12,color:'var(--text-faint)'}}>
          © 2026 RoboSchool · Алматы, Казахстан
        </div>
      </div>
    </div>
  )
}
