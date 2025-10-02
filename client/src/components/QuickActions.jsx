
import React from 'react'
import { Link } from 'react-router-dom'

export default function QuickActions(){
  return (
    <div className="sidebar">
      <div className="card" style={{display:'flex', flexDirection:'column', gap:12}}>
        <Link className="btn ghost" to="/surgeries/new">Log New Surgery</Link>
        <Link className="btn ghost" to="/patients/new">Add New Patient</Link>
      </div>
    </div>
  )
}
