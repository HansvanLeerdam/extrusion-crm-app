import React, { useState } from "react"
import { User, Pencil, Trash2, Save, X } from "lucide-react"
import SectionTitle from "../components/SectionTitle"

export default function Clients({ data, setData }) {
  const [form, setForm] = useState({ name: "", country: "", contact: "", email: "", phone: "" })
  const [filterCountry, setFilterCountry] = useState("")
  const [filterSearch, setFilterSearch] = useState("")
  const [openClients, setOpenClients] = useState({}) // all collapsed by default
  const [editKey, setEditKey] = useState(null)       // `${clientId}-${index}`
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

  const countries = [...new Set((data.clients || []).map(c => c.country).filter(Boolean))].sort()

  const filteredClients = (data.clients || [])
    .filter(c => (!filterCountry || c.country === filterCountry))
    .filter(c =>
      c.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      (c.country || "").toLowerCase().includes(filterSearch.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  const addClient = () => {
    if (!form.name.trim()) return alert("Client name is required.")
    const exists = (data.clients || []).some(
      c => c.name.toLowerCase() === form.name.trim().toLowerCase()
    )
    if (exists) return alert("Client already exists.")

    const newClient = {
      id: "client-" + Date.now(),
      name: form.name.trim(),
      country: form.country.trim(),
      contacts: [
        {
          contact: form.contact || "",
          email: form.email || "",
          phone: form.phone || ""
        }
      ]
    }
    setData({ ...data, clients: [...(data.clients || []), newClient] })
    setForm({ name: "", country: "", contact: "", email: "", phone: "" })
  }

  const toggleClient = (id) => {
    setOpenClients(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const startEdit = (clientId, idx, ct) => {
    // ensure the panel is open and load the values into inputs
    setOpenClients(prev => ({ ...prev, [clientId]: true }))
    setEditKey(`${clientId}-${idx}`)
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

  const saveEdit = (clientId, idx) => {
    const updated = (data.clients || []).map(c => {
      if (c.id !== clientId) return c
      const contacts = [...(c.contacts || [])]
      contacts[idx] = {
        contact: (editContact.contact || "").trim(),
        email: (editContact.email || "").trim(),
        phone: (editContact.phone || "").trim()
      }
      return { ...c, contacts }
    })
    setData({ ...data, clients: updated })
    cancelEdit()
  }

  const deleteContact = (clientId, idx) => {
    if (!confirm("Delete this contact?")) return
    let updated = (data.clients || []).map(c => {
      if (c.id !== clientId) return c
      const contacts = [...(c.contacts || [])]
      contacts.splice(idx, 1)
      return { ...c, contacts }
    })
    // remove clients that have no contacts left
    updated = updated.filter(c => (c.contacts && c.contacts.length > 0))
    setData({ ...data, clients: updated })
    // clear edit state if needed
    cancelEdit()
  }

  return (
    <div className="card">
      <SectionTitle icon={User} title="Clients" />

{/* === FILTERS === */}
<div
  className="table-filters"
  style={{
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
    alignItems: "center"
  }}
>
  <select
    value={filterCountry}
    onChange={(e) => setFilterCountry(e.target.value)}
    style={{
      width: "160px",
      height: "36px",
      background: "#e9e9e9",
      color: "#111",
      border: "1px solid #ccc",
      borderRadius: "4px"
    }}
  >
    <option value="">All Countries</option>
    {countries.map((country, i) => (
      <option key={i} value={country}>
        {country}
      </option>
    ))}
  </select>

  <input
    type="text"
    placeholder="Search..."
    value={filterSearch}
    onChange={(e) => setFilterSearch(e.target.value)}
    style={{
      width: "160px",
      height: "36px",
      background: "#e9e9e9",
      color: "#111",
      border: "1px solid #ccc",
      borderRadius: "4px",
      padding: "0 0.4rem"
    }}
  />

  {(filterCountry || filterSearch) && (
    <button
      className="btn-icon"
      onClick={() => {
        setFilterCountry("")
        setFilterSearch("")
      }}
      title="Clear filters"
      style={{
        height: "36px",
        background: "transparent",
        border: "none",
        color: "#444",
        cursor: "pointer",
        fontSize: "1rem"
      }}
    >
      ✖
    </button>
  )}
</div>

      {/* INPUT ROW */}
      <div
        className="sticky-input-row"
        style={{ gridTemplateColumns: "15% 15% 15% 15% 15% 36px" }}
      >
        <input
          placeholder="Client Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Country"
          value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
        />
        <input
          placeholder="Contact"
          value={form.contact}
          onChange={(e) => setForm({ ...form, contact: e.target.value })}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <button className="btn-icon" onClick={addClient}>+</button>
      </div>

      {/* CLIENT LIST (collapsed by default) */}
      {filteredClients.map((client) => {
        const isOpen = !!openClients[client.id]
        return (
          <div
            key={client.id}
            style={{
              background: "#141414",
              borderRadius: "10px",
              padding: "0.8rem 1rem",
              marginBottom: "1rem",
              boxShadow: "0 0 6px rgba(0,0,0,0.4)"
            }}
          >
            {/* Header / toggle */}
            <div
              onClick={() => toggleClient(client.id)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer"
              }}
            >
              <h3 style={{ color: "#fff", fontSize: "1.1rem", margin: 0 }}>
                {client.name}
              </h3>
              <span style={{ color: "#aaa" }}>{isOpen ? "▲" : "▼"}</span>
            </div>

            <p style={{ color: "#aaa", margin: "0.2rem 0 0" }}>
              Country: {client.country || "—"}
            </p>

            {isOpen && (
              <table
                className="clients-table table--has-actions"
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
                  {(client.contacts || []).map((ct, i) => {
                    const rowKey = `${client.id}-${i}`
                    const editing = editKey === rowKey

                    return (
                      <tr key={rowKey}>
                        {editing ? (
                          <>
                            <td>
                              <input
                                value={editContact.contact}
                                onChange={(e) =>
                                  setEditContact({ ...editContact, contact: e.target.value })
                                }
                                placeholder="Contact person"
                              />
                            </td>
                            <td>
                              <input
                                value={editContact.email}
                                onChange={(e) =>
                                  setEditContact({ ...editContact, email: e.target.value })
                                }
                                placeholder="Email"
                              />
                            </td>
                            <td>
                              <input
                                value={editContact.phone}
                                onChange={(e) =>
                                  setEditContact({ ...editContact, phone: e.target.value })
                                }
                                placeholder="Phone"
                              />
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "inline-flex", gap: 6 }}>
                                <button
                                  title="Save"
                                  style={BTN_STYLE}
                                  onClick={() => saveEdit(client.id, i)}
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
                                    startEdit(client.id, i, ct)
                                  }}
                                >
                                  <Pencil size={ICON_SIZE} />
                                </button>
                                <button
                                  title="Delete"
                                  style={BTN_STYLE}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteContact(client.id, i)
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
