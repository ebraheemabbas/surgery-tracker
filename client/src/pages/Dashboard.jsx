
import React, { useEffect, useState } from 'react'
import { api } from '../components/API'
import StatCard from '../components/StatCard'
import QuickActions from '../components/QuickActions'

export default function Dashboard(){
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load(){
    setLoading(true)
    try{
      const res = await api('/api/stats')
      setStats(res.data)
    }catch(e){
      setError(String(e.message||e))
    }finally{
      setLoading(false)
    }
  }
  useEffect(()=>{ load() }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div style={{color:'crimson'}}>Error: {error}</div>

  return (
    <div>
      <p className="muted">Overview of your surgical practice</p>
      <div className="grid-cards">
        <StatCard label="Total Patients" value={stats.totalPatients} />
        <StatCard label="Today's Surgeries" value={stats.todaySurgeries} />
        <StatCard label="Total Surgeries" value={stats.totalSurgeries} />
        <StatCard label="Success Rate" value={`${stats.successRate}%`} />
      </div>

      <div className="layout">
        <div>
          <div className="section-title">Recent Surgeries</div>
          <div className="stack">
            {stats.recent.map(s => (
              <div key={s.id} className="surgery-item">
                <div className="surgery-title">{s.title}</div>
                <div className="row" style={{marginBottom:8}}>
                  <span className={`chip ${s.type}`}>{s.type}</span>
                  <span className={`chip ${s.status}`}>{s.status}</span>
                </div>
                <div className="muted">
                  {new Date(s.datetime).toLocaleString()} · {s.surgeon ?? 'Unknown'}{s.durationMin ? ` · ${s.durationMin} min` : ''}{' '}
                  · {s.patientName}
                </div>
                {s.notes ? <div className="muted" style={{marginTop:6}}>{s.notes}</div> : null}
              </div>
            ))}
          </div>
        </div>
        <QuickActions/>
      </div>
    </div>
  )
}
