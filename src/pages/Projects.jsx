import React, { useState } from "react"
import { FolderKanban, Pencil, Trash2, Save } from "lucide-react"
import SectionTitle from "../components/SectionTitle"

export default function Projects({ data, setData }) {
  const [form, setForm] = useState({
    name: "",
    clientId: "",
    partnerId: "",
    productId: "",
    startDate: "",
    status: ""
  })
  const [editingId, setEditingId] = useState(null)

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
    height: "30px",
    background: "#e9e9e9",
    color: "#111",
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "0 0.4rem",
    fontSize: "0.9rem",
    outline: "none",
    width: "100%"
  }

  const addOrUpdateProject = () => {
    if (!form.name.trim() || !form.clientId)
      return alert("Project name and client are required.")

    const updated = [...(data.projects || [])]

    if (editingId) {
      const i = updated.findIndex((p) => p.id === editingId)
      if (i !== -1) {
        updated[i] = { ...updated[i], ...form }
      }
    } else {
      const newProject = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? "project-" + crypto.randomUUID()
            : "project-" + Date.now(),
        ...form
      }
      updated.push(newProject)
    }

    setData({ ...data, projects: updated })
    setForm({
      name: "",
      clientId: "",
      partnerId: "",
      productId: "",
      startDate: "",
      status: ""
    })
    setEditingId(null)
  }

  const editProject = (id) => {
    const p = (data.projects || []).find((x) => x.id === id)
    if (!p) return
    setForm({ ...p })
    setEditingId(p.id)
  }

  const deleteProject = (id) => {
    if (!confirm("Delete this project?")) return
    const updated = (data.projects || []).filter((p) => p.id !== id)
    setData({ ...data, projects: updated })
    if (editingId === id) {
      setEditingId(null)
      setForm({
        name: "",
        clientId: "",
        partnerId: "",
        productId: "",
        startDate: "",
        status: ""
      })
    }
  }

  const sorted = [...(data.projects || [])].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  )

  return (
    <div className="card" style={{ textAlign: "left" }}>
      <SectionTitle icon={FolderKanban} title="Projects" />

      {/* Input row */}
      <div
        className="sticky-input-row"
        style={{
          gridTemplateColumns: "16% 14% 14% 14% 14% 14% 36px",
          background: "#222",
          border: "1px solid #333",
          borderRadius: "6px",
          padding: "0.4rem",
          marginBottom: "0.8rem"
        }}
      >
        <input
          placeholder="Project Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
        />

        <select
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          style={inputStyle}
        >
          <option value="">Client</option>
          {(data.clients || [])
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>

        <select
          value={form.partnerId}
          onChange={(e) => setForm({ ...form, partnerId: e.target.value })}
          style={inputStyle}
        >
          <option value="">Partner</option>
          {(data.partners || [])
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>

        <select
          value={form.productId}
          onChange={(e) => setForm({ ...form, productId: e.target.value })}
          style={inputStyle}
        >
          <option value="">Product</option>
          {[
            ...new Set((data.products || []).flatMap((p) => p.items || []))
          ]
            .sort((a, b) => a.localeCompare(b))
            .map((p, i) => (
              <option key={i} value={p}>
                {p}
              </option>
            ))}
        </select>

        <input
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          style={inputStyle}
        />

        <input
          placeholder="Status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          style={inputStyle}
        />

        <button className="btn-icon" onClick={addOrUpdateProject}>
          {editingId ? <Save size={ICON_SIZE} /> : "+"}
        </button>
      </div>

      {/* Table */}
      <table
        className="projects-table table--has-actions"
        style={{ width: "100%", borderSpacing: 0 }}
      >
        <thead>
          <tr style={{ background: "#1f1f1f" }}>
            <th>Name</th>
            <th>Client</th>
            <th>Partner</th>
            <th>Product</th>
            <th>Start Date</th>
            <th>Status</th>
            <th style={{ width: 100, textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => {
            const rowBg = i % 2 === 0 ? "#1a1a1a" : "#111"
            const client =
              (data.clients || []).find((c) => c.id === p.clientId)?.name || ""
            const partner =
              (data.partners || []).find((x) => x.id === p.partnerId)?.name || ""
            return (
              <tr key={p.id} style={{ background: rowBg }}>
                <td>{p.name}</td>
                <td>{client}</td>
                <td>{partner}</td>
                <td>{p.productId}</td>
                <td>{p.startDate}</td>
                <td>{p.status}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: 6 }}>
                    <button
                      title="Modify"
                      style={BTN_STYLE}
                      onClick={() => editProject(p.id)}
                    >
                      <Pencil size={ICON_SIZE} />
                    </button>
                    <button
                      title="Delete"
                      style={BTN_STYLE}
                      onClick={() => deleteProject(p.id)}
                    >
                      <Trash2 size={ICON_SIZE} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
