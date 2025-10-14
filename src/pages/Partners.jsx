import React, { useState } from "react"
import { Handshake, Pencil, Trash2, Save } from "lucide-react"
import SectionTitle from "../components/SectionTitle"

export default function Partners({ data, setData }) {
  const [form, setForm] = useState({ name: "", contact: "", email: "", phone: "" })
  const [editing, setEditing] = useState({ partnerId: null, contactIndex: null })
  const [openMap, setOpenMap] = useState({}) // { [partnerId]: boolean }

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

  const toggleOpen = (id) =>
    setOpenMap((m) => ({ ...m, [id]: m[id] === false ? true : false }))

  const sortedPartners = [...(data.partners || [])].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  )

  const addOrUpdate = () => {
    if (!form.name.trim()) return alert("Partner name is required.")

    const updated = [...(data.partners || [])]
    let partner = updated.find((p) => p.name.trim() === form.name.trim())

    if (!partner) {
      partner = {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? "partner-" + crypto.randomUUID()
            : "partner-" + Date.now() + "-" + Math.floor(Math.random() * 100000),
        name: form.name.trim(),
        contacts: []
      }
      updated.push(partner)
    }

    if (editing.partnerId !== null) {
      const pi = updated.findIndex((p) => p.id === editing.partnerId)
      if (pi !== -1) {
        updated[pi].contacts[editing.contactIndex] = {
          contact: form.contact,
          email: form.email,
          phone: form.phone
        }
      }
      setEditing({ partnerId: null, contactIndex: null })
    } else {
      partner.contacts.push({
        contact: form.contact,
        email: form.email,
        phone: form.phone
      })
    }

    setForm({ name: "", contact: "", email: "", phone: "" })
    setData({
      ...data,
      partners: updated.sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    })
  }

  const deleteContact = (partnerId, index) => {
    if (!confirm("Delete this contact?")) return
    const updated = (data.partners || []).map((p) =>
      p.id === partnerId
        ? { ...p, contacts: (p.contacts || []).filter((_, i) => i !== index) }
        : p
    )
    setData({ ...data, partners: updated })
  }

  const editContact = (partner, index) => {
    const ct = (partner.contacts || [])[index]
    setForm({
      name: partner.name,
      contact: ct?.contact || "",
      email: ct?.email || "",
      phone: ct?.phone || ""
    })
    setEditing({ partnerId: partner.id, contactIndex: index })
  }

  return (
    <div className="card" style={{ textAlign: "left" }}>
      <SectionTitle icon={Handshake} title="Partners" />

      {/* Sticky input row */}
      <div
        className="sticky-input-row"
        style={{
          gridTemplateColumns: "20% 20% 20% 20% 36px",
          background: "#222",
          border: "1px solid #333",
          borderRadius: "6px",
          padding: "0.4rem",
          marginBottom: "0.8rem"
        }}
      >
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Partner"
        />
        <input
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
          placeholder="Contact"
        />
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
        />
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Phone"
        />
        <button className="btn-icon" onClick={addOrUpdate} title="Save">
          {editing.partnerId !== null ? <Save size={ICON_SIZE} /> : "+"}
        </button>
      </div>

      {/* Grouped collapsible sections by partner */}
      {sortedPartners.map((p) => {
        const contacts = [...(p.contacts || [])].sort((a, b) =>
          (a.contact || "").localeCompare(b.contact || "")
        )
        const isOpen = openMap[p.id] !== false
        return (
          <div
            key={p.id}
            style={{
              background: "#141414",
              borderRadius: "10px",
              padding: "0.8rem 1rem",
              marginBottom: "1rem",
              boxShadow: "0 0 6px rgba(0,0,0,0.4)"
            }}
          >
            <button
              onClick={() => toggleOpen(p.id)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                background: "transparent",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: 0,
                margin: 0
              }}
              aria-expanded={isOpen}
            >
              <h3
                style={{
                  color: "#fff",
                  fontSize: "1.05rem",
                  borderBottom: "1px solid #333",
                  paddingBottom: "0.5rem",
                  marginBottom: "0.6rem"
                }}
              >
                {p.name}
              </h3>
              <span
                style={{
                  transform: `rotate(${isOpen ? 90 : 0}deg)`,
                  transition: "transform 0.15s ease",
                  color: "#ccc"
                }}
              >
                ▶
              </span>
            </button>

            {isOpen && (
              <table
                className="partners-table table--has-actions"
                style={{ width: "100%", borderSpacing: 0 }}
              >
                <thead>
                  <tr style={{ background: "#1f1f1f" }}>
                    <th>Contact</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th style={{ width: 120, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length > 0 ? (
                    contacts.map((ct, i) => {
                      const rowBg = i % 2 === 0 ? "#1a1a1a" : "#111"
                      return (
                        <tr key={`${p.id}-${i}`} style={{ background: rowBg }}>
                          <td>{ct.contact}</td>
                          <td>{ct.email}</td>
                          <td>{ct.phone}</td>
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
                                onClick={() => editContact(p, i)}
                              >
                                <Pencil size={ICON_SIZE} />
                              </button>
                              <button
                                title="Delete"
                                style={BTN_STYLE}
                                onClick={() => deleteContact(p.id, i)}
                              >
                                <Trash2 size={ICON_SIZE} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "#888" }}>
                        No contacts yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </div>
  )
}
