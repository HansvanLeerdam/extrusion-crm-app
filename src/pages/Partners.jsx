import React, { useState } from "react"
import { Users, Pencil, Trash2, Save, X } from "lucide-react"
import SectionTitle from "../components/SectionTitle"

export default function Partners({ data, setData }) {
  const [form, setForm] = useState({ name: "", contact: "", email: "", phone: "" })
  const [openPartners, setOpenPartners] = useState({})
  const [editKey, setEditKey] = useState(null)
  const [editContact, setEditContact] = useState({ contact: "", email: "", phone: "" })

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

  const addPartner = () => {
    if (!form.name.trim()) return alert("Partner name is required.")
    const exists = (data.partners || []).some(
      (p) => p.name.toLowerCase() === form.name.trim().toLowerCase()
    )
    if (exists) return alert("Partner already exists.")

    const newPartner = {
      id: "partner-" + Date.now(),
      name: form.name.trim(),
      contacts: [
        {
          contact: form.contact || "",
          email: form.email || "",
          phone: form.phone || ""
        }
      ]
    }
    setData({ ...data, partners: [...(data.partners || []), newPartner] })
    setForm({ name: "", contact: "", email: "", phone: "" })
  }

  const togglePartner = (id) => {
    setOpenPartners((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const startEdit = (partnerId, idx, ct) => {
    setOpenPartners((prev) => ({ ...prev, [partnerId]: true }))
    setEditKey(`${partnerId}-${idx}`)
    setEditContact({
      contact: ct?.contact ?? "",
      email: ct?.email ?? "",
      phone: ct?.phone ?? ""
    })
  }

  const cancelEdit = () => {
    setEditKey(null)
    setEditContact({ contact: "", email: "", phone: "" })
  }

  const saveEdit = (partnerId, idx) => {
    const updated = (data.partners || []).map((p) => {
      if (p.id !== partnerId) return p
      const contacts = [...(p.contacts || [])]
      contacts[idx] = {
        contact: (editContact.contact || "").trim(),
        email: (editContact.email || "").trim(),
        phone: (editContact.phone || "").trim()
      }
      return { ...p, contacts }
    })
    setData({ ...data, partners: updated })
    cancelEdit()
  }

  const deleteContact = (partnerId, idx) => {
    if (!confirm("Delete this contact?")) return
    let updated = (data.partners || []).map((p) => {
      if (p.id !== partnerId) return p
      const contacts = [...(p.contacts || [])]
      contacts.splice(idx, 1)
      return { ...p, contacts }
    })
    updated = updated.filter((p) => (p.contacts && p.contacts.length > 0))
    setData({ ...data, partners: updated })
    cancelEdit()
  }

  return (
    <div className="card">
      <SectionTitle icon={Users} title="Partners" />

      {/* INPUT ROW */}
      <div
        className="sticky-input-row"
        style={{
          gridTemplateColumns: "20% 20% 20% 20% 36px",
          marginBottom: "0.8rem"
        }}
      >
        <input
          placeholder="Partner Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="Contact"
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          style={inputStyle}
        />
        <button className="btn-icon" onClick={addPartner}>
          +
        </button>
      </div>

      {/* PARTNERS LIST */}
      {(data.partners || [])
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((partner) => {
          const isOpen = !!openPartners[partner.id]
          return (
            <div
              key={partner.id}
              style={{
                background: "#141414",
                borderRadius: "10px",
                padding: "0.8rem 1rem",
                marginBottom: "1rem",
                boxShadow: "0 0 6px rgba(0,0,0,0.4)"
              }}
            >
              <div
                onClick={() => togglePartner(partner.id)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer"
                }}
              >
                <h3 style={{ color: "#fff", fontSize: "1.1rem", margin: 0 }}>
                  {partner.name}
                </h3>
                <span style={{ color: "#aaa" }}>{isOpen ? "▲" : "▼"}</span>
              </div>

              {isOpen && (
                <table
                  className="partners-table table--has-actions"
                  style={{ marginTop: "0.5rem", width: "100%" }}
                >
                  <thead>
                    <tr>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th style={{ width: 98, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(partner.contacts || []).map((ct, i) => {
                      const rowKey = `${partner.id}-${i}`
                      const editing = editKey === rowKey

                      return (
                        <tr key={rowKey}>
                          {editing ? (
                            <>
                              <td>
                                <input
                                  value={editContact.contact}
                                  onChange={(e) =>
                                    setEditContact({
                                      ...editContact,
                                      contact: e.target.value
                                    })
                                  }
                                  placeholder="Contact"
                                  style={inputStyle}
                                />
                              </td>
                              <td>
                                <input
                                  value={editContact.email}
                                  onChange={(e) =>
                                    setEditContact({
                                      ...editContact,
                                      email: e.target.value
                                    })
                                  }
                                  placeholder="Email"
                                  style={inputStyle}
                                />
                              </td>
                              <td>
                                <input
                                  value={editContact.phone}
                                  onChange={(e) =>
                                    setEditContact({
                                      ...editContact,
                                      phone: e.target.value
                                    })
                                  }
                                  placeholder="Phone"
                                  style={inputStyle}
                                />
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <div style={{ display: "inline-flex", gap: 6 }}>
                                  <button
                                    title="Save"
                                    style={BTN_STYLE}
                                    onClick={() => saveEdit(partner.id, i)}
                                  >
                                    <Save size={ICON_SIZE} />
                                  </button>
                                  <button
                                    title="Cancel"
                                    style={BTN_STYLE}
                                    onClick={cancelEdit}
                                  >
                                    <X size={ICON_SIZE} />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td>{ct.contact}</td>
                              <td>{ct.email}</td>
                              <td>{ct.phone}</td>
                              <td style={{ textAlign: "right" }}>
                                <div style={{ display: "inline-flex", gap: 6 }}>
                                  <button
                                    title="Modify"
                                    style={BTN_STYLE}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      startEdit(partner.id, i, ct)
                                    }}
                                  >
                                    <Pencil size={ICON_SIZE} />
                                  </button>
                                  <button
                                    title="Delete"
                                    style={BTN_STYLE}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteContact(partner.id, i)
                                    }}
                                  >
                                    <Trash2 size={ICON_SIZE} />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )
        })}
    </div>
  )
}
