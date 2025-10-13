import React from "react"

export default function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="section-title">
      {Icon && <Icon size={20} style={{ marginRight: "8px" }} />}
      {title}
    </div>
  )
}
