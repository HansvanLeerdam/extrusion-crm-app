import React, { useState } from "react"
import { CalendarDays, Pencil, Trash2, Save } from "lucide-react"
import SectionTitle from "../components/SectionTitle"

export default function Followups({ data, setData }) {
  const [form, setForm] = useState({
    clientId: "",
    projectId: "",
    partnerId: "",
    productId: "",
    nextDate: "",
    action: ""
  })
  const [editing, setEditing] = useState(null)

  const BTN_STYLE = {
    background: "#ffa733",
    color: "black",
    borderRadius: "8px",
    width: 28,
    height: 28,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    border: "none",
    cursor: "pointer"
  }
  const ICON_SIZE = 14

  const inputStyle = {
    background: "#e6e6e6",
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "0.35rem 0.5rem",
    height: "30px",
    fontSize: "0.9rem",
    color: "#111",
    width: "100%",
    outline: "none",
    boxSizing: "border-box"
  }

  const allClients = [...(data.clients || [])].sort((a, b) => a.name.localeCompare(b.name))
  const allPartners = [...(data.partners || [])].sort((a, b) => a.name.localeCompare(b.name))
  const allProducts = [...new Set((data.products || []).flatMap((p) => p.items || []))].sort((a, b) => a.localeCompare(b))
  const allProjects = [...(data.projects || [])].sort((a, b) => a.name.localeCompare(b.name))

  const addOrUpdate = () => {
    if (!form.clientId || !form.partnerId) return alert("Client and Partner are required.")

    const updated = [...(data.followups || [])]
    if (editing) {
      const i = updated.findIndex((f) => String(f.id) === String(editing))
      if (i !== -1) updated[i] = { ...form, id: editing }
      setEditing(null)
    } else {
      const newId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? "followup-" + crypto.randomUUID()
          : "followup-" + Date.now() + "-" + Math.floor(Math.random() * 100000)
      updated.push({ ...form, id: newId })
    }

    setData({ ...data, followups: updated })
    setForm({
      clientId: "",
      projectId: "",
      partnerId: "",
      productId: "",
      nextDate: "",
      action: ""
    })
  }

  const editFollowup = (f) => {
    setForm(f)
    setEditing(f.id)
  }

  const deleteFollowup = (id) => {
    if (!confirm("Delete this follow-up?")) return
    setData({
      ...data,
      followups: (data.followups || []).filter((f) => String(f.id) !== String(id))
    })
  }

  const getClientName = (id) =>
    (data.clients || []).find((c) => String(c.id) === String(id))?.name || ""

  const getPartnerName = (id) =>
    (data.partners || []).find((p) => String(p.id) === String(id))?.name || ""

  const getProjectName = (id) =>
    (data.projects || []).find((p) => String(p.id) === String(id))?.name || ""

  return (
    <div className="card" style={{ textAlign: "left" }}>
      <SectionTitle icon={CalendarDays} title="Follow-ups" />

      {/* Input row */}
      <div
        className="sticky-input-row"
        style={{
          display: "grid",
          width: "100%",
          boxSizing: "border-box",
          gridTemplateColumns: "repeat(6, 1fr) 36px",
          gap: "0.5rem",
          background: "#222",
          border: "1px solid #333",
          borderRadius: "6px",
          padding: "0.4rem",
          marginBottom: "0.8rem"
        }}
      >
        <select
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          style={inputStyle}
        >
          <option value="">Client</option>
          {allClients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={form.projectId}
          onChange={(e) => setForm({ ...form, projectId: e.target.value })}
          style={inputStyle}
        >
          <option value="">Project</option>
          {allProjects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={form.partnerId}
          onChange={(e) => setForm({ ...form, partnerId: e.target.value })}
          style={inputStyle}
        >
          <option value="">Partner</option>
          {allPartners.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={form.productId}
          onChange={(e) => setForm({ ...form, productId: e.target.value })}
          style={inputStyle}
        >
          <option value="">Product</option>
          {allProducts.map((pr, i) => (
            <option key={i} value={pr}>{pr}</option>
          ))}
        </select>

        <input
          type="date"
          value={form.nextDate}
          onChange={(e) => setForm({ ...form, nextDate: e.target.value })}
          style={inputStyle}
        />

        <input
          placeholder="Action"
          value={form.action}
          onChange={(e) => setForm({ ...form, action: e.target.value })}
          style={inputStyle}
        />

        <button className="btn-icon" onClick={addOrUpdate} title="Save follow-up">
          {editing ? <Save size={ICON_SIZE} /> : "+"}
        </button>
      </div>

      {/* Table */}
      <table className="followups-table table--has-actions" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ color: "#ffa733", fontWeight: 600 }}>
            <th>Date</th>
            <th>Client</th>
            <th>Project</th>
            <th>Partner</th>
            <th>Product</th>
            <th>Action</th>
            <th style={{ width: 80, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {(data.followups || []).length > 0 ? (
            data.followups.map((f) => (
              <tr key={f.id}>
                <td>{f.nextDate}</td>
                <td>{getClientName(f.clientId)}</td>
                <td>{getProjectName(f.projectId)}</td>
                <td>{getPartnerName(f.partnerId)}</td>
                <td>{f.productId}</td>
                <td>{f.action}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: 6 }}>
                    <button title="Edit" style={BTN_STYLE} onClick={() => editFollowup(f)}>
                      <Pencil size={ICON_SIZE} />
                    </button>
                    <button title="Delete" style={BTN_STYLE} onClick={() => deleteFollowup(f.id)}>
                      <Trash2 size={ICON_SIZE} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={7} style={{ textAlign: "center", color: "#888" }}>No follow-ups found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
