import React, { useState } from "react"
import { FolderKanban, Pencil, Trash2, Save, MessageSquare } from "lucide-react"
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
  const [editing, setEditing] = useState(null)
  const [activeProject, setActiveProject] = useState(null)
  const [newComment, setNewComment] = useState("")
  const [commentType, setCommentType] = useState("note")
  const [filterClient, setFilterClient] = useState("")
  const [filterPartner, setFilterPartner] = useState("")

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

  const getPartnerName = (id) =>
    (data.partners || []).find((p) => String(p.id) === String(id))?.name || ""

  const getProductName = (val) =>
    typeof val === "string" ? val : String(val ?? "")

  const selectedPartnerId = form.partnerId
  const selectedPartnerName =
    (data.partners || []).find((p) => String(p.id) === String(selectedPartnerId))
      ?.name || ""

  const partnerProducts =
    ((data.products || []).find(
      (p) =>
        String(p.partnerId) === String(selectedPartnerId) ||
        (p.partner && p.partner === selectedPartnerName)
    )?.items || [])

  const allProducts = [
    ...new Set((data.products || []).flatMap((p) => p.items || []))
  ].sort((a, b) => a.localeCompare(b))

  const displayedProducts =
    partnerProducts && partnerProducts.length > 0 ? partnerProducts : allProducts

  const allClients = [...(data.clients || [])].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  const clientsMap = new Map(allClients.map((c) => [String(c.id), c]))
  const clientIdsInProjects = Array.from(
    new Set(
      (data.projects || [])
        .map((p) => String(p.clientId))
        .filter((id) => clientsMap.has(id))
    )
  )

  const clientsInProjects = clientIdsInProjects
    .map((id) => clientsMap.get(id))
    .sort((a, b) => a.name.localeCompare(b.name))

  const addOrUpdate = () => {
    if (!form.name) return
    const updated = [...(data.projects || [])]

    if (editing) {
      const i = updated.findIndex((p) => String(p.id) === String(editing))
      if (i !== -1) updated[i] = { ...form, id: editing }
      setEditing(null)
      setData({ ...data, projects: updated })
    } else {
      const newProjectId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? "project-" + crypto.randomUUID()
          : "project-" + Date.now() + "-" + Math.floor(Math.random() * 100000)

      updated.push({ id: newProjectId, ...form })

      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      const newFollowup = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? "followup-" + crypto.randomUUID()
            : "followup-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
        clientId: form.clientId || null,
        projectId: newProjectId,
        partnerId: form.partnerId || null,
        productId: form.productId || null,
        nextDate: nextWeek.toISOString().split("T")[0],
        action: "Initial follow-up for new project"
      }

      setData({
        ...data,
        projects: updated,
        followups: [...(data.followups || []), newFollowup]
      })
    }

    setForm({
      name: "",
      clientId: "",
      partnerId: "",
      productId: "",
      startDate: "",
      status: ""
    })
  }

  const deleteProject = (id) => {
    setData({
      ...data,
      projects: (data.projects || []).filter((p) => String(p.id) !== String(id)),
      projectComments: (data.projectComments || []).filter(
        (c) => String(c.projectId) !== String(id)
      )
    })
  }

  const editProject = (p) => {
    setForm(p)
    setEditing(p.id)
  }

  const getComments = (projectId) =>
    (data.projectComments || []).filter(
      (c) => String(c.projectId) === String(projectId)
    )

  const addComment = (projectId) => {
    if (!newComment.trim()) return
    const newC = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? "comment-" + crypto.randomUUID()
          : "comment-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
      projectId: String(projectId),
      type: commentType,
      text: newComment.trim(),
      date: new Date().toISOString().split("T")[0]
    }
    setData({
      ...data,
      projectComments: [...(data.projectComments || []), newC]
    })
    setNewComment("")
    setCommentType("note")
    setActiveProject(null)
  }

  const deleteComment = (commentId) => {
    setData({
      ...data,
      projectComments: (data.projectComments || []).filter(
        (c) => String(c.id) !== String(commentId)
      )
    })
  }

  const groupedBase = clientsInProjects
    .map((c) => ({
      client: c.name,
      id: c.id,
      projects: (data.projects || []).filter(
        (p) => String(p.clientId) === String(c.id)
      )
    }))
    .filter((g) => g.projects.length > 0)

  const grouped = groupedBase
    .map((g) => ({
      ...g,
      projects: g.projects.filter((p) => {
        const okClient =
          !filterClient || String(p.clientId) === String(filterClient)
        const okPartner =
          !filterPartner || String(p.partnerId) === String(filterPartner)
        return okClient && okPartner
      })
    }))
    .filter((g) => g.projects.length > 0)

  const icons = {
    call: "📞",
    email: "✉️",
    offer: "💼",
    visit: "🚗",
    note: "📝"
  }

  return (
    <div className="card" style={{ textAlign: "left" }}>
      <SectionTitle icon={FolderKanban} title="Projects" />

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
        <input placeholder="Project" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
        <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} style={inputStyle}>
          <option value="">Client</option>
          {allClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value, productId: "" })} style={inputStyle}>
          <option value="">Partner</option>
          {(data.partners || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} style={inputStyle}>
          <option value="">Product</option>
          {displayedProducts.map((it, idx) => <option key={idx} value={it}>{it}</option>)}
        </select>
        <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} style={inputStyle} />
        <input placeholder="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle} />
        <button className="btn-icon" onClick={addOrUpdate} title="Save project">{editing ? <Save size={ICON_SIZE} /> : "+"}</button>
      </div>
    </div>
  )
}
