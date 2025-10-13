import React, { useState } from "react"
import { CalendarDays } from "lucide-react"
import SectionTitle from "../components/SectionTitle"

export default function Followups({ data, setData }) {
  const [form, setForm] = useState({
    date: "",
    clientId: "",
    partnerId: "",
    projectId: "",
    productId: "",
    action: ""
  })
  const [editingId, setEditingId] = useState(null)

  // === FILTERS (Clients in projects + Partners) ===
  const [filterClient, setFilterClient] = useState("")
  const [filterPartner, setFilterPartner] = useState("")

  // === CLIENTS ONLY FROM PROJECTS ===
  const projectClientIds = Array.from(
    new Set((data.projects || []).map((p) => String(p.clientId)))
  )
  const clientsInProjects = (data.clients || [])
    .filter((c) => projectClientIds.includes(String(c.id)))
    .sort((a, b) => a.name.localeCompare(b.name))

  // === PRODUCT DROPDOWN LINKED TO PARTNER ===
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

  // === ADD / UPDATE FOLLOW-UP ===
  const addOrUpdate = () => {
    if (!form.date || !form.clientId || !form.action) return
    const updated = [...(data.followups || [])]

    if (editingId) {
      const i = updated.findIndex((f) => String(f.id) === String(editingId))
      if (i !== -1) {
        updated[i] = {
          ...updated[i],
          nextDate: form.date,
          clientId: String(form.clientId),
          partnerId: form.partnerId ? String(form.partnerId) : "",
          projectId: form.projectId ? String(form.projectId) : "",
          productId: form.productId || "",
          action: form.action
        }
      }
    } else {
      const newFollowup = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? "followup-" + crypto.randomUUID()
            : "followup-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
        nextDate: form.date,
        clientId: String(form.clientId),
        partnerId: form.partnerId ? String(form.partnerId) : "",
        projectId: form.projectId ? String(form.projectId) : "",
        productId: form.productId || "",
        action: form.action
      }
      updated.push(newFollowup)
    }

    setData({ ...data, followups: updated })
    setForm({
      date: "",
      clientId: "",
      partnerId: "",
      projectId: "",
      productId: "",
      action: ""
    })
    setEditingId(null)
  }

  const editFollowup = (id) => {
    const f = (data.followups || []).find((x) => String(x.id) === String(id))
    if (!f) return
    setForm({
      date: f.nextDate || "",
      clientId: f.clientId || "",
      partnerId: f.partnerId || "",
      projectId: f.projectId || "",
      productId: f.productId || "",
      action: f.action || ""
    })
    setEditingId(f.id)
  }

  const deleteFollowup = (id) => {
    const updated = (data.followups || []).filter(
      (f) => String(f.id) !== String(id)
    )
    setData({ ...data, followups: updated })
    if (editingId === id) {
      setEditingId(null)
      setForm({
        date: "",
        clientId: "",
        partnerId: "",
        projectId: "",
        productId: "",
        action: ""
      })
    }
  }

  // === FILTER + SORT ===
  const sorted = [...(data.followups || [])]
    .filter((f) => {
      const okClient = !filterClient || String(f.clientId) === String(filterClient)
      const okPartner = !filterPartner || String(f.partnerId) === String(filterPartner)
      return okClient && okPartner
    })
    .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate))

  // === GROUP FOLLOWUPS BY CLIENT ===
  const grouped = clientsInProjects
    .map((client) => ({
      client,
      followups: sorted.filter((f) => String(f.clientId) === String(client.id))
    }))
    .filter((g) => g.followups.length > 0)

  return (
    <div className="card" style={{ textAlign: "left" }}>
      <SectionTitle icon={CalendarDays} title="Follow-ups" />

      {/* === FILTERS === */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "0.8rem",
          alignItems: "center"
        }}
      >
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          style={{ width: "160px" }}
        >
          <option value="">All Clients</option>
          {clientsInProjects.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={filterPartner}
          onChange={(e) => setFilterPartner(e.target.value)}
          style={{ width: "160px" }}
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

      {/* === INPUT ROW === */}
      <div
        className="sticky-input-row"
        style={{
          gridTemplateColumns: "15% 15% 15% 15% 15% 15% 36px",
          background: "#222",
          border: "1px solid #333",
          borderRadius: "6px",
          padding: "0.4rem"
        }}
      >
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        <select
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
        >
          <option value="">Client</option>
          {clientsInProjects.map((c) => (
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
        >
          <option value="">Product</option>
          {displayedProducts.map((p, idx) => (
            <option key={idx} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={form.projectId}
          onChange={(e) => setForm({ ...form, projectId: e.target.value })}
        >
          <option value="">Project</option>
          {(data.projects || []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          value={form.action}
          onChange={(e) => setForm({ ...form, action: e.target.value })}
          placeholder="Action"
        />

        <button className="btn-icon" onClick={addOrUpdate}>
          {editingId ? "💾" : "+"}
        </button>
      </div>

      {/* === TABLE GROUPED BY CLIENT === */}
      {grouped.map((g) => (
        <div
          key={g.client.id}
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
              color: "#fff",
              fontSize: "1.1rem",
              borderBottom: "1px solid #333",
              paddingBottom: "0.5rem",
              marginBottom: "1rem"
            }}
          >
            {g.client.name}
          </h3>

          <table
            className="followups-table table--has-actions"
            style={{ width: "100%", borderSpacing: 0 }}
          >
            <thead>
              <tr style={{ background: "#1f1f1f" }}>
                <th>Date</th>
                <th>Partner</th>
                <th>Product</th>
                <th>Project</th>
                <th>Action</th>
                <th style={{ width: "100px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {g.followups.map((f, i) => {
                const partner =
                  data.partners.find((p) => String(p.id) === String(f.partnerId))
                    ?.name || ""
                const product = f.productId || ""
                const project =
                  data.projects.find((p) => String(p.id) === String(f.projectId))
                    ?.name || ""
                const rowBg = i % 2 === 0 ? "#1a1a1a" : "#111"

                return (
                  <tr key={f.id} style={{ background: rowBg }}>
                    <td>{f.nextDate}</td>
                    <td>{partner}</td>
                    <td>{product}</td>
                    <td>{project}</td>
                    <td>{f.action}</td>
                    <td className="actions" style={{ textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "0.4rem"
                        }}
                      >
                        <button
                          className="btn-icon"
                          onClick={() => editFollowup(f.id)}
                          title="Edit"
                        >
                          ✏
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => deleteFollowup(f.id)}
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
