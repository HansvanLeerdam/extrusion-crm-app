import React, { useState } from "react"
import { Package, Pencil, Trash2, Save } from "lucide-react"
import SectionTitle from "../components/SectionTitle"

export default function Products({ data, setData }) {
  const [form, setForm] = useState({ partnerId: "", product: "" })
  const [editing, setEditing] = useState({ partnerId: null, index: null })
  const [openMap, setOpenMap] = useState({}) // { [partnerKey]: boolean }

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

  const toggleOpen = (key) =>
    setOpenMap((m) => ({ ...m, [key]: m[key] === false ? true : false }))

  const mergeDuplicatePartners = (products) => {
    const merged = {}
    for (const p of products || []) {
      const key = p.partnerId || p.partner || "unknown"
      if (!merged[key]) {
        merged[key] = {
          partnerId: p.partnerId || "",
          partner: p.partner || "",
          items: [...(p.items || [])]
        }
      } else {
        merged[key].items.push(...(p.items || []))
      }
    }
    return Object.values(merged).map((p) => ({
      ...p,
      items: [...new Set(p.items)].sort((a, b) => a.localeCompare(b))
    }))
  }

  const addOrUpdateProduct = () => {
    if (!form.partnerId || !form.product.trim()) return alert("Partner and Product are required.")

    const updatedProducts = JSON.parse(JSON.stringify(data.products || []))
    const partnerName =
      (data.partners || []).find((p) => p.id === form.partnerId)?.name || ""

    let partnerGroup = updatedProducts.find(
      (p) =>
        p.partnerId === form.partnerId ||
        (!p.partnerId && p.partner === partnerName)
    )

    if (!partnerGroup) {
      partnerGroup = { partnerId: form.partnerId, partner: partnerName, items: [] }
      updatedProducts.push(partnerGroup)
    }

    const cleanProduct = form.product.trim()

    if (editing.partnerId && editing.index !== null) {
      const target = updatedProducts.find((p) => p.partnerId === editing.partnerId)
      if (target && target.items[editing.index] !== undefined) {
        target.items[editing.index] = cleanProduct
      }
      setEditing({ partnerId: null, index: null })
    } else {
      if (!partnerGroup.items.includes(cleanProduct)) {
        partnerGroup.items.push(cleanProduct)
      }
    }

    const normalized = mergeDuplicatePartners(updatedProducts).sort((a, b) =>
      (a.partner || "").localeCompare(b.partner || "")
    )

    setData({ ...data, products: normalized })
    setForm({ partnerId: "", product: "" })
  }

  const deleteProduct = (partnerId, idx) => {
    if (!confirm("Delete this product?")) return
    const updated = JSON.parse(JSON.stringify(data.products || []))
    const partnerIndex = updated.findIndex(
      (p) => p.partnerId === partnerId || (!p.partnerId && p.partner === partnerId)
    )
    if (partnerIndex !== -1) {
      updated[partnerIndex].items.splice(idx, 1)
      if (updated[partnerIndex].items.length === 0) updated.splice(partnerIndex, 1)
    }
    const normalized = mergeDuplicatePartners(updated)
    setData({ ...data, products: normalized })
  }

  const editProduct = (partnerId, idx, value) => {
    setForm({ partnerId, product: value })
    setEditing({ partnerId, index: idx })
  }

  const displayedProducts = mergeDuplicatePartners(data.products || []).sort((a, b) =>
    (a.partner || "").localeCompare(b.partner || "")
  )

  return (
    <div className="card" style={{ textAlign: "left" }}>
      <SectionTitle icon={Package} title="Products" />

      {/* Input row */}
      <div
        className="sticky-input-row"
        style={{
          gridTemplateColumns: "20% 20% 36px",
          background: "#222",
          border: "1px solid #333",
          borderRadius: "6px",
          padding: "0.4rem",
          marginBottom: "0.8rem"
        }}
      >
        <select
          value={form.partnerId}
          onChange={(e) => setForm({ ...form, partnerId: e.target.value })}
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

        <input
          value={form.product}
          onChange={(e) => setForm({ ...form, product: e.target.value })}
          placeholder="Product name"
        />

        <button className="btn-icon" onClick={addOrUpdateProduct} title="Save">
          {editing.partnerId ? <Save size={ICON_SIZE} /> : "+"}
        </button>
      </div>

      {/* Grouped collapsible sections by partner */}
      {displayedProducts.map((group) => {
        const partnerName =
          (data.partners || []).find((x) => x.id === group.partnerId)?.name ||
          group.partner ||
          "Unknown"
        const partnerKey = group.partnerId || partnerName
        const isOpen = openMap[partnerKey] !== false

        return (
          <div
            key={partnerKey}
            style={{
              background: "#141414",
              borderRadius: "10px",
              padding: "0.8rem 1rem",
              marginBottom: "1rem",
              boxShadow: "0 0 6px rgba(0,0,0,0.4)"
            }}
          >
            <button
              onClick={() => toggleOpen(partnerKey)}
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
                {partnerName}
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
                className="products-table table--has-actions"
                style={{ width: "100%", borderSpacing: 0 }}
              >
                <thead>
                  <tr style={{ background: "#1f1f1f" }}>
                    <th>Product</th>
                    <th style={{ width: 120, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(group.items || []).map((item, idx) => {
                    const rowBg = idx % 2 === 0 ? "#1a1a1a" : "#111"
                    return (
                      <tr key={`${partnerKey}-${idx}`} style={{ background: rowBg }}>
                        <td>{item}</td>
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
                              onClick={() => editProduct(group.partnerId, idx, item)}
                            >
                              <Pencil size={ICON_SIZE} />
                            </button>
                            <button
                              title="Delete"
                              style={BTN_STYLE}
                              onClick={() => deleteProduct(group.partnerId, idx)}
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
            )}
          </div>
        )
      })}
    </div>
  )
}
