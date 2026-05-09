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
    ru: { title:'Добро пожаловать!', sub:'Войдите в систему управления', email:'Email', pass:'Пароль', btn:'Войти', forgot:'Забыли пароль?' },
    kz: { title:'Қош келдіңіз!',    sub:'Басқару жүйесіне кіріңіз',    email:'Email', pass:'Құпия сөз', btn:'Кіру', forgot:'Құпия сөзді ұмыттыңыз ба?' },
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
        <div style={{
          position:'relative',zIndex:1,
          width:160,height:160,borderRadius:24,
          border:'2.5px dashed rgba(255,255,255,0.35)',
          background:'rgba(255,255,255,0.08)',
          display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10
        }}>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',fontWeight:600,letterSpacing:1,textTransform:'uppercase'}}>Логотип</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>placeholder</div>
        </div>
        <div style={{textAlign:'center',position:'relative',zIndex:1}}>
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
            <div style={{
              width:40,height:40,borderRadius:10,flexShrink:0,
              border:'2px dashed var(--border)',background:'var(--bg)',
              display:'flex',alignItems:'center',justifyContent:'center'
            }}>
              <span style={{fontSize:9,color:'var(--text-faint)',fontWeight:600,letterSpacing:0.5,textTransform:'uppercase',lineHeight:1.2,textAlign:'center'}}>logo</span>
            </div>
            <span style={{fontSize:18,fontWeight:800,color:'var(--text)'}}>Robostars</span>
          </div>
          <h2 style={{margin:0,fontSize:24,fontWeight:800,color:'var(--text)'}}>{t.title}</h2>
          <p style={{margin:'6px 0 0',fontSize:14,color:'var(--text-muted)'}}>{t.sub}</p>
        </div>

        <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:16}}>
          <Input label={t.email} value={email} onChange={setEmail} type="email"
            placeholder="admin@robostars.kz" icon="✉" error={error && !email ? error : ''} />
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
        </form>

        <div style={{position:'absolute',bottom:24,left:40,right:40,textAlign:'center',fontSize:12,color:'var(--text-faint)'}}>
          © 2026 Robostars · Алматы, Казахстан
        </div>
      </div>
    </div>
  )
}
