
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../components/API'
import { useAuth } from '../context/AuthContext'

export default function NewSurgery(){
  const nav = useNavigate()
  const { user, logout } = useAuth()
  const [patients, setPatients] = useState([])
  const [form, setForm] = useState({
    title:'', patientId:'', type:'emergency', status:'scheduled',
    datetime: new Date().toISOString().slice(0,16), durationMin:'', surgeon:user.email, surgeonEmail:user.email, notes:''
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  useEffect(()=>{
    api('/api/patients').then(r => setPatients(r.data))
  },[])

  async function submit(e){
    e.preventDefault()
    setSaving(true); setErr(null)
    try{
      const payload = {
        ...form,
        durationMin: form.durationMin ? Number(form.durationMin) : null,
        datetime: form.datetime.length === 16 ? new Date(form.datetime).toISOString() : form.datetime
      }
      await api('/api/surgeries', { method: 'POST', body: JSON.stringify(payload) })
      nav('/')
    }catch(e){ setErr(String(e.message||e)) }
    finally{ setSaving(false) }
  }

  function bind(name){ return { value: form[name]||'', onChange: e=> setForm(f=>({...f, [name]: e.target.value})) } }

  return (
    <div>
      <h2 className="section-title">Log New Surgery</h2>
      <p className="muted">Record a surgical procedure</p>
      {err && <div style={{color:'crimson', marginBottom:12}}>Error: {err}</div>}
      <form className="form" onSubmit={submit}>
        <div className="field">
          <label>Title</label>
          <input required placeholder="Appendectomy" {...bind('title')} />
        </div>
        <div className="field">
          <label>Patient</label>
          <select required {...bind('patientId')}>
            <option value="">Select patient...</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} ({p.id})</option>)}
          </select>
        </div>
        <div className="field">
          <label>Type</label>
          <select {...bind('type')}>
            <option value="emergency">emergency</option>
            <option value="elective">elective</option>
          </select>
        </div>
        <div className="field">
          <label>Status</label>
          <select {...bind('status')}>
            <option value="scheduled">scheduled</option>
            <option value="successful">successful</option>
            <option value="failed">failed</option>
          </select>
        </div>
        <div className="field">
          <label>Date Time</label>
          <input type="datetime-local" {...bind('datetime')} />
        </div>
        <div className="field">
          <label>Duration (min)</label>
          <input type="number" min={0} placeholder="e.g., 75" {...bind('durationMin')} />
        </div>
        <div className="field" style={{gridColumn:'1 / -1'}}>
          <label>Notes</label>
          <textarea placeholder="Optional notes" {...bind('notes')} />
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={()=>nav('/')}>Cancel</button>
          <button className="btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}
