import React, { useState, useEffect } from "react"
import * as XLSX from "xlsx"
import { useStore } from "./store"
import Dashboard from "./pages/Dashboard.jsx"
import Clients from "./pages/Clients.jsx"
import Partners from "./pages/Partners.jsx"
import Products from "./pages/Products.jsx"
import Projects from "./pages/Projects.jsx"
import Followups from "./pages/Followups.jsx"
import { buildICS } from "./ics"
import { CloudUpload } from "lucide-react"

export default function App() {
  const { data, setData } = useStore()
  const [tab, setTab] = useState("dashboard")

  // === Load shared data.json on start ===
  useEffect(() => {
    fetch("/data.json")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Error loading shared data.json", err))
  }, [setData])

  // === Save to GitHub (via Netlify Function) ===
  const saveDataToGitHub = async () => {
    try {
      const res = await fetch("/.netlify/functions/saveData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        alert("✅ Data successfully saved to GitHub (via Netlify Function)!")
      } else {
        const err = await res.text()
        console.error("GitHub save error:", err)
        alert("❌ Save failed — check console.")
      }
    } catch (e) {
      console.error("Save error:", e)
      alert("❌ Save failed — network or function error.")
    }
  }

  // === Import / Export / Calendar ===
  const importExcel = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".xlsx,.xls"
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf, { type: "array" })
      const toJSON = (sh) => (sh ? XLSX.utils.sheet_to_json(sh) : [])

      const rawClients = toJSON(wb.Sheets["Clients"])
      const clients = []
      rawClients.forEach((r) => {
        const name = (r["Client Name"] || "").trim()
        if (!name) return
        let client = clients.find((c) => c.name.toLowerCase() === name.toLowerCase())
        if (!client) {
          client = {
            id: String(r["Client ID"] || crypto.randomUUID()),
            name,
            country: r["Country"] || "",
            contacts: []
          }
          clients.push(client)
        }
        if (r["Contact Person"] || r["Email"] || r["Phone"]) {
          const exists = client.contacts.some(
            (ct) =>
              ct.contact === r["Contact Person"] &&
              ct.email === r["Email"] &&
              ct.phone === r["Phone"]
          )
          if (!exists) {
            client.contacts.push({
              contact: r["Contact Person"] || "",
              email: r["Email"] || "",
              phone: r["Phone"] || ""
            })
          }
        }
      })

      const rawPartners = toJSON(wb.Sheets["Partners"])
      const partners = []
      rawPartners.forEach((r) => {
        const name = (r["Partner Name"] || "").trim()
        if (!name) return
        let partner = partners.find((p) => p.name.toLowerCase() === name.toLowerCase())
        if (!partner) {
          partner = {
            id: String(r["Partner ID"] || crypto.randomUUID()),
            name,
            contacts: []
          }
          partners.push(partner)
        }
        if (r["Contact Person"] || r["Email"] || r["Phone"]) {
          const exists = partner.contacts.some(
            (ct) =>
              ct.contact === r["Contact Person"] &&
              ct.email === r["Email"] &&
              ct.phone === r["Phone"]
          )
          if (!exists) {
            partner.contacts.push({
              contact: r["Contact Person"] || "",
              email: r["Email"] || "",
              phone: r["Phone"] || ""
            })
          }
        }
      })

      const rawProducts = toJSON(wb.Sheets["Products"]) || []
      const groupedProducts = []
      rawProducts.forEach((r) => {
        const partner = r["Partner"]
        const product = r["Product"]
        if (!partner || !product) return
        let group = groupedProducts.find((p) => p.partner === partner)
        if (!group) {
          group = { partner, items: [] }
          groupedProducts.push(group)
        }
        if (!group.items.includes(product)) group.items.push(product)
      })
      const products = groupedProducts.length ? groupedProducts : []

      const projects = toJSON(wb.Sheets["Projects"]).map((r) => ({
        id: String(r["Project ID"] || crypto.randomUUID()),
        name: r["Project Name"] || "",
        clientId: r["Client ID"] ? String(r["Client ID"]) : null,
        partnerId: r["Partner ID"] ? String(r["Partner ID"]) : null,
        productId: r["Product"] || "",
        startDate: r["Start Date"] || "",
        status: r["Status"] || ""
      }))

      const followups = toJSON(wb.Sheets["Follow-ups"]).map((r) => ({
        id: String(r["Follow-Up ID"] || crypto.randomUUID()),
        clientId: r["Client ID"] ? String(r["Client ID"]) : null,
        projectId: r["Project ID"] ? String(r["Project ID"]) : null,
        partnerId: r["Partner ID"] ? String(r["Partner ID"]) : null,
        productId: r["Product"] ? String(r["Product"]) : "",
        nextDate: r["Next Date"] || r["Date"] || "",
        action: r["Action"] || ""
      }))

      const projectComments = (toJSON(wb.Sheets["Project Comments"]) || []).map((r) => ({
        id: String(r["Comment ID"] || crypto.randomUUID()),
        projectId: r["Project ID"] ? String(r["Project ID"]) : null,
        type: r["Type"] || "note",
        text: r["Comment"] || "",
        date: r["Date"] || new Date().toISOString().split("T")[0]
      }))

      setData({
        clients,
        partners,
        products,
        projects,
        followups,
        projectComments
      })
    }
    input.click()
  }

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    const clientsFlat = data.clients.flatMap((c) =>
      c.contacts.length > 0
        ? c.contacts.map((ct) => ({
            "Client ID": String(c.id),
            "Client Name": c.name,
            Country: c.country,
            "Contact Person": ct.contact,
            Email: ct.email,
            Phone: ct.phone
          }))
        : [
            {
              "Client ID": String(c.id),
              "Client Name": c.name,
              Country: c.country,
              "Contact Person": "",
              Email: "",
              Phone: ""
            }
          ]
    )
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientsFlat), "Clients")
    XLSX.writeFile(wb, "crm_data.xlsx")
  }

  const downloadCalendar = () => {
    const ics = buildICS(data.followups || [])
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "followups.ics"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-container">
      {/* === HEADER === */}
      <div
        style={{
          background: "#111",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.6rem 1rem",
          fontWeight: 600
        }}
      >
        <div>Partners & Projects CRM</div>
        <div>
          <button
            onClick={saveDataToGitHub}
            title="Save to Cloud"
            style={{
              background: "#ffa733",
              color: "black",
              borderRadius: "8px",
              width: 34,
              height: 34,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s ease, transform 0.1s ease",
              boxShadow: "0 0 6px rgba(0,0,0,0.3)"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#ffb84d")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffa733")}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <CloudUpload size={16} />
          </button>
        </div>
      </div>

      {/* === BODY === */}
      <div style={{ display: "flex", height: "calc(100vh - 48px)" }}>
        {/* SIDEBAR */}
        <div
          style={{
            width: "200px",
            background: "#141414",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "1rem"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "clients", label: "Clients" },
              { id: "partners", label: "Partners" },
              { id: "products", label: "Products" },
              { id: "projects", label: "Projects" },
              { id: "followups", label: "Follow-ups" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: tab === t.id ? "#ffa733" : "transparent",
                  color: tab === t.id ? "black" : "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  textAlign: "left",
                  cursor: "pointer",
                  fontWeight: tab === t.id ? "600" : "400"
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Orange divider line */}
          <div
            style={{
              borderTop: "2px solid #ffa733",
              margin: "1rem 0"
            }}
          />

          {/* Utility buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button
              onClick={importExcel}
              style={{
                background: "#ffa733",
                color: "black",
                border: "none",
                borderRadius: "6px",
                padding: "8px 12px",
                cursor: "pointer",
                textAlign: "left",
                fontWeight: "500"
              }}
            >
              ⬆ Import Excel
            </button>

            <button
              onClick={exportExcel}
              style={{
                background: "#ffa733",
                color: "black",
                border: "none",
                borderRadius: "6px",
                padding: "8px 12px",
                cursor: "pointer",
                textAlign: "left",
                fontWeight: "500"
              }}
            >
              ⬇ Export Excel
            </button>

            <button
              onClick={downloadCalendar}
              style={{
                background: "#ffa733",
                color: "black",
                border: "none",
                borderRadius: "6px",
                padding: "8px 12px",
                cursor: "pointer",
                textAlign: "left",
                fontWeight: "500"
              }}
            >
              📅 Calendar
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
          {tab === "dashboard" && <Dashboard data={data} />}
          {tab === "clients" && <Clients data={data} setData={setData} />}
          {tab === "partners" && <Partners data={data} setData={setData} />}
          {tab === "products" && <Products data={data} setData={setData} />}
          {tab === "projects" && <Projects data={data} setData={setData} />}
          {tab === "followups" && <Followups data={data} setData={setData} />}
        </div>
      </div>
    </div>
  )
}
