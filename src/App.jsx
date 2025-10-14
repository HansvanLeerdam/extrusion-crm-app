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

      // Clients (dedupe by name, collect contacts)
      const rawClients = toJSON(wb.Sheets["Clients"])
      const clients = []
      rawClients.forEach((r) => {
        const clientName = (r["Client Name"] || "").trim()
        if (!clientName) return
        let client = clients.find(
          (c) => c.name.toLowerCase() === clientName.toLowerCase()
        )
        if (!client) {
          client = {
            id: String(r["Client ID"] || crypto.randomUUID()),
            name: clientName,
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

      // Partners (dedupe by name, collect contacts)
      const rawPartners = toJSON(wb.Sheets["Partners"])
      const partners = []
      rawPartners.forEach((r) => {
        const partnerName = (r["Partner Name"] || "").trim()
        if (!partnerName) return
        let partner = partners.find(
          (p) => p.name.toLowerCase() === partnerName.toLowerCase()
        )
        if (!partner) {
          partner = {
            id: String(r["Partner ID"] || crypto.randomUUID()),
            name: partnerName,
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

      // Products (group by partner)
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

      // Projects
      const projects = toJSON(wb.Sheets["Projects"]).map((r) => ({
        id: String(r["Project ID"] || crypto.randomUUID()),
        name: r["Project Name"] || "",
        clientId: r["Client ID"] ? String(r["Client ID"]) : null,
        partnerId: r["Partner ID"] ? String(r["Partner ID"]) : null,
        productId: r["Product"] || "",
        startDate: r["Start Date"] || "",
        status: r["Status"] || ""
      }))

      // Follow-ups
      const followups = toJSON(wb.Sheets["Follow-ups"]).map((r) => ({
        id: String(r["Follow-Up ID"] || crypto.randomUUID()),
        clientId: r["Client ID"] ? String(r["Client ID"]) : null,
        projectId: r["Project ID"] ? String(r["Project ID"]) : null,
        partnerId: r["Partner ID"] ? String(r["Partner ID"]) : null,
        productId: r["Product"] ? String(r["Product"]) : "",
        nextDate: r["Next Date"] || r["Date"] || "",
        action: r["Action"] || ""
      }))

      // Project Comments
      const projectComments = (toJSON(wb.Sheets["Project Comments"]) || []).map(
        (r) => ({
          id: String(r["Comment ID"] || crypto.randomUUID()),
          projectId: r["Project ID"] ? String(r["Project ID"]) : null,
          type: r["Type"] || "note",
          text: r["Comment"] || "",
          date: r["Date"] || new Date().toISOString().split("T")[0]
        })
      )

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

    // Example: export clients with their contacts flattened
    const clientsFlat = (data.clients || []).flatMap((c) =>
      c.contacts && c.contacts.length
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

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(clientsFlat),
      "Clients"
    )

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
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* === STICKY HEADER === */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "#111",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.6rem 1rem",
          borderBottom: "1px solid #333"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <img
            src="/logo.png"
            alt="Extrusion CRM"
            style={{ height: "28px", width: "28px", objectFit: "contain" }}
          />
          <div>Partners & Projects CRM</div>
        </div>

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
      </header>

      {/* === BODY === */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* === SIDEBAR === */}
        <aside
          style={{
            width: "180px",
            background: "#000",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1px solid #333"
          }}
        >
          {/* Menu */}
          <div style={{ padding: "1rem 0.6rem" }}>
            {[
              { id: "dashboard", name: "Dashboard" },
              { id: "clients", name: "Clients" },
              { id: "partners", name: "Partners" },
              { id: "products", name: "Products" },
              { id: "projects", name: "Projects" },
              { id: "followups", name: "Follow-ups" }
            ].map((item) => {
              const isActive = tab === item.id
              return (
                <div key={item.id} style={{ marginBottom: "0.35rem" }}>
                  <button
                    onClick={() => setTab(item.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: isActive ? "#ffa733" : "#fff",
                      fontSize: isActive ? "1.02rem" : "0.95rem",
                      fontWeight: isActive ? 600 : 400,
                      width: "100%",
                      textAlign: "left",
                      padding: "0.3rem 0.5rem",
                      cursor: "pointer",
                      transition: "color 0.15s ease, font-size 0.1s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#ffa733"
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = "#fff"
                    }}
                  >
                    {item.name}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Tools (bottom) */}
          <div style={{ padding: "1rem 0.6rem" }}>
            <button
              onClick={importExcel}
              style={toolBtn}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffa733")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
            >
              📂 Import Excel
            </button>
            <button
              onClick={exportExcel}
              style={toolBtn}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffa733")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
            >
              💾 Export Excel
            </button>
            <button
              onClick={downloadCalendar}
              style={toolBtn}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffa733")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
            >
              📅 Export .ics
            </button>
          </div>
        </aside>

        {/* === MAIN === */}
        <main
          style={{
            flex: 1,
            overflowY: "auto",
            background: "#111",
            padding: "1rem"
          }}
        >
          {tab === "dashboard" && <Dashboard data={data} />}
          {tab === "clients" && <Clients data={data} setData={setData} />}
          {tab === "partners" && <Partners data={data} setData={setData} />}
          {tab === "products" && <Products data={data} setData={setData} />}
          {tab === "projects" && <Projects data={data} setData={setData} />}
          {tab === "followups" && <Followups data={data} setData={setData} />}
        </main>
      </div>
    </div>
  )
}

const toolBtn = {
  display: "block",
  background: "transparent",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  width: "100%",
  textAlign: "left",
  padding: "0.5rem 0.6rem",
  fontWeight: 600,
  cursor: "pointer",
  marginBottom: "0.4rem",
  transition: "color 0.2s ease"
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
