'use client'
import React, { useState } from 'react'
import { Btn, Card, Input } from '@/components/ui'
import { TopBar } from '@/components/layout'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleChangePassword = async () => {
    if (!newPassword) { setMessage('Введите новый пароль'); return }
    if (newPassword !== confirmPassword) { setMessage('Пароли не совпадают'); return }
    if (newPassword.length < 6) { setMessage('Пароль должен быть не менее 6 символов'); return }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setMessage('Ошибка: ' + error.message)
    else { setMessage('Пароль успешно изменён!'); setNewPassword(''); setConfirmPassword('') }
    setSaving(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div>
      <TopBar title="Настройки" />
      <div style={{padding:'24px 28px',maxWidth:600,display:'flex',flexDirection:'column',gap:20}}>
        <Card style={{padding:24}}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>🔒 Изменить пароль</div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <Input label="Новый пароль" value={newPassword} onChange={setNewPassword} type="password" placeholder="Минимум 6 символов" />
            <Input label="Подтвердить пароль" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Повторите пароль" />
            {message && (
              <div style={{padding:'10px 14px',borderRadius:10,background:message.includes('успешно')?'var(--green-bg)':'var(--red-bg)',color:message.includes('успешно')?'var(--green)':'var(--red)',fontSize:13,fontWeight:600}}>
                {message}
              </div>
            )}
            <Btn onClick={handleChangePassword} disabled={saving}>{saving ? 'Сохранение...' : 'Изменить пароль'}</Btn>
          </div>
        </Card>

        <Card style={{padding:24}}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>ℹ️ О системе</div>
          <div style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.6}}>
            <div>Robostars — система управления школой робототехники</div>
            <div style={{marginTop:4}}>Версия 1.0 MVP · Алматы, Казахстан</div>
          </div>
        </Card>

        <Card style={{padding:24,border:'1.5px solid var(--red-bg)'}}>
          <div style={{fontWeight:700,fontSize:15,marginBottom:8,color:'var(--red)'}}>⚠️ Выход из системы</div>
          <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:16}}>Вы будете перенаправлены на страницу входа</div>
          <Btn variant="danger" onClick={handleLogout}>Выйти из системы</Btn>
        </Card>
      </div>
    </div>
  )
}
