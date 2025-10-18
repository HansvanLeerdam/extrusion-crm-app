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
    height: "28px",
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

      {/* === FILTERS === */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1rem",
          alignItems: "center"
        }}
      >
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          style={inputStyle}
        >
          <option value="">All Clients</option>
          {groupedBase.map((g) => (
            <option key={g.id} value={g.id}>
              {g.client}
            </option>
          ))}
        </select>

        <select
          value={filterPartner}
          onChange={(e) => setFilterPartner(e.target.value)}
          style={inputStyle}
        >
          <option value="">All Partners</option>
          {(data.partners || []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {(filterClient || filterPartner) && (
          <button
            className="btn-icon"
            onClick={() => {
              setFilterClient("")
              setFilterPartner("")
            }}
            title="Clear filters"
          >
            ✖
          </button>
        )}
      </div>

      {/* === ADD / EDIT ROW === */}
      <div
        className="sticky-input-row"
        style={{
          display: "grid",
          width: "100%",
          gridTemplateColumns: "15% 15% 15% 15% 15% 15% 36px",
          gap: "0.5rem",
          background: "#222",
          border: "1px solid #333",
          borderRadius: "6px",
          padding: "0.4rem"
        }}
      >
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Project"
          style={inputStyle}
        />
        <select
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          style={inputStyle}
        >
          <option value="">Client</option>
          {allClients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={form.partnerId}
          onChange={(e) =>
            setForm({ ...form, partnerId: e.target.value, productId: "" })
          }
          style={inputStyle}
        >
          <option value="">Partner</option>
          {(data.partners || []).map((p) => (
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
          {displayedProducts.map((it, idx) => (
            <option key={idx} value={it}>
              {it}
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
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          placeholder="Status"
          style={inputStyle}
        />
        <button className="btn-icon" onClick={addOrUpdate} title="Save project">
          {editing ? <Save size={ICON_SIZE} /> : "+"}
        </button>
      </div>

      {/* === TABLE === */}
      <div style={{ width: "100%", overflowX: "auto" }}>
        {grouped.map((g) => (
          <div
            key={g.client}
            style={{
              background: "#141414",
              borderRadius: "10px",
              padding: "0.8rem 1rem",
              marginBottom: "1rem",
              boxShadow: "0 0 6px rgba(0,0,0,0.4)"
            }}
          >
            <h3
              style={{
                marginBottom: "1rem",
                color: "#fff",
                fontSize: "1.1rem",
                borderBottom: "1px solid #333",
                paddingBottom: "0.5rem"
              }}
            >
              {g.client}
            </h3>

            {/* TABLE CONTENT */}
            <table
              className="projects-table table--has-actions"
              style={{ width: "100%", borderSpacing: 0 }}
            >
              <thead>
                <tr style={{ background: "#1f1f1f" }}>
                  <th style={{ width: "25%" }}>Project</th>
                  <th style={{ width: "20%" }}>Partner</th>
                  <th style={{ width: "20%" }}>Product</th>
                  <th style={{ width: "15%" }}>Start</th>
                  <th style={{ width: "15%" }}>Status</th>
                  <th style={{ width: "100px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {g.projects.map((p, idx) => {
                  const comments = getComments(p.id)
                  const isActive = activeProject === p.id
                  const rowBg = idx % 2 === 0 ? "#1a1a1a" : "#111"
                  return (
                    <React.Fragment key={String(p.id)}>
                      <tr style={{ background: rowBg }}>
                        <td>{p.name}</td>
                        <td>{getPartnerName(p.partnerId)}</td>
                        <td>{getProductName(p.productId)}</td>
                        <td>{p.startDate}</td>
                        <td>{p.status}</td>
                        <td className="actions" style={{ textAlign: "right" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              gap: 6,
                              justifyContent: "flex-end"
                            }}
                          >
                            <button
                              title="Modify"
                              style={BTN_STYLE}
                              onClick={() => editProject(p)}
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
                            <button
                              title="Add comment"
                              style={BTN_STYLE}
                              onClick={() =>
                                setActiveProject(isActive ? null : p.id)
                              }
                            >
                              <MessageSquare size={ICON_SIZE} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {(comments.length > 0 || isActive) && (
                        <tr>
                          <td
                            colSpan="6"
                            style={{
                              background: "#1a1a1a",
                              padding: "0.8rem 1rem"
                            }}
                          >
                            {comments.map((c) => (
                              <div
                                key={String(c.id)}
                                style={{
                                  background: "#1f1f1f",
                                  borderLeft: "4px solid #ffa733",
                                  borderRadius: 8,
                                  padding: "0.5rem 0.7rem",
                                  marginBottom: "0.4rem",
                                  fontSize: "0.9rem",
                                  lineHeight: 1.4,
                                  display: "flex",
                                  alignItems: "center"
                                }}
                              >
                                {icons[c.type]}{" "}
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color: "#ffa733",
                                    marginRight: "0.4rem"
                                  }}
                                >
                                  {c.type.charAt(0).toUpperCase() +
                                    c.type.slice(1)}
                                </span>{" "}
                                {c.text}
                                <button
                                  onClick={() => deleteComment(c.id)}
                                  title="Delete comment"
                                  style={{
                                    marginLeft: "auto",
                                    border: "none",
                                    background: "#333",
                                    color: "#ff6666",
                                    cursor: "pointer",
                                    fontSize: ".75rem",
                                    padding: "0 4px",
                                    borderRadius: 3
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}

                            {isActive && (
                              <div style={{ marginTop: ".6rem" }}>
                                <select
                                  value={commentType}
                                  onChange={(e) =>
                                    setCommentType(e.target.value)
                                  }
                                  style={{
                                    ...inputStyle,
                                    width: "auto",
                                    display: "inline-block",
                                    marginRight: ".4rem"
                                  }}
                                >
                                  <option value="note">📝 Note</option>
                                  <option value="call">📞 Call</option>
                                  <option value="email">✉️ Email</option>
                                  <option value="offer">💼 Offer</option>
                                  <option value="visit">🚗 Visit</option>
                                </select>
                                <input
                                  value={newComment}
                                  onChange={(e) =>
                                    setNewComment(e.target.value)
                                  }
                                  placeholder="Add a comment..."
                                  style={{
                                    ...inputStyle,
                                    width: "60%",
                                    marginRight: ".4rem"
                                  }}
                                />
                                <button
                                  title="Save comment"
                                  style={BTN_STYLE}
                                  onClick={() => addComment(p.id)}
                                >
                                  <Save size={ICON_SIZE} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  )
}

const inputStyle = {
  background: "#e6e6e6",
  border: "1px solid #ccc",
  borderRadius: "8px",
  padding: "0.35rem 0.5rem",
  height: "30px",
  fontSize: "0.9rem",
  color: "#111",
  width: "100%",
  outline: "none"
}
