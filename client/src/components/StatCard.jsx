
import React from 'react'
export default function StatCard({label, value}){
  return (
    <div className="card">
      <h3>{label}</h3>
      <div className="big">{value}</div>
    </div>
  )
}
