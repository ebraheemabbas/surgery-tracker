
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../components/API'

export default function NewPatient(){
  const nav = useNavigate()
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth:'', sex:'', phone:'', email:'', allergies:''
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  async function submit(e){
    e.preventDefault()
    setSaving(true); setErr(null)
    try{
      await api('/api/patients', { method: 'POST', body: JSON.stringify(form) })
      nav('/')
    }catch(e){ setErr(String(e.message||e)) }
    finally{ setSaving(false) }
  }

  function bind(name){ return { value: form[name]||'', onChange: e=> setForm(f=>({...f, [name]: e.target.value})) } }

  return (
    <div>
      <h2 className="section-title">Add New Patient</h2>
      {err && <div style={{color:'crimson', marginBottom:12}}>Error: {err}</div>}
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label>First Name</label>
          <input required placeholder="e.g., John" {...bind('firstName')} />
        </div>
        <div className="field">
          <label>Last Name</label>
          <input required placeholder="e.g., Doe" {...bind('lastName')} />
        </div>
        <div className="field">
          <label>Date of Birth</label>
          <input type="date" {...bind('dateOfBirth')} />
        </div>
        <div className="field">
          <label>Sex</label>
          <select {...bind('sex')}>
            <option value="">--</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="field">
          <label>Phone</label>
          <input placeholder="e.g., +1 555 0101" {...bind('phone')} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" placeholder="name@example.com" {...bind('email')} />
        </div>
        <div className="field" style={{gridColumn:'1 / -1'}}>
          <label>Allergies</label>
          <textarea placeholder="Optional" {...bind('allergies')} />
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={()=>nav('/')}>Cancel</button>
          <button className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}
