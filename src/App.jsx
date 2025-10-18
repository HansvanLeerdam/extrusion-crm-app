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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768

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
      if (res.ok) alert("✅ Data successfully saved to GitHub (via Netlify Function)!")
      else {
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

      // === Clients ===
      const rawClients = toJSON(wb.Sheets["Clients"])
      const clients = []
      rawClients.forEach((r) => {
        const clientName = (r["Client Name"] || "").trim()
        if (!clientName) return
        let client = clients.find((c) => c.name.toLowerCase() === clientName.toLowerCase())
        if (!client) {
          client = {
            id: String(r["Client ID"] || crypto.randomUUID()),
            name: clientName,
            country: r["Country"] || "",
            contacts: [],
            details: {
              address: r["Address"] || "",
              notes: r["Notes"] || "",
              notebook: r["Notebook"] || ""
            }
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
          if (!exists)
            client.contacts.push({
              contact: r["Contact Person"] || "",
              email: r["Email"] || "",
              phone: r["Phone"] || ""
            })
        }
      })

      // === Partners ===
      const rawPartners = toJSON(wb.Sheets["Partners"])
      const partners = []
      rawPartners.forEach((r) => {
        const partnerName = (r["Partner Name"] || "").trim()
        if (!partnerName) return
        let partner = partners.find((p) => p.name.toLowerCase() === partnerName.toLowerCase())
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
          if (!exists)
            partner.contacts.push({
              contact: r["Contact Person"] || "",
              email: r["Email"] || "",
              phone: r["Phone"] || ""
            })
        }
      })

      // === Products ===
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

      // === Projects ===
      const projects = toJSON(wb.Sheets["Projects"]).map((r) => ({
        id: String(r["Project ID"] || crypto.randomUUID()),
        name: r["Project Name"] || "",
        clientId: r["Client ID"] ? String(r["Client ID"]) : null,
        partnerId: r["Partner ID"] ? String(r["Partner ID"]) : null,
        productId: r["Product"] || "",
        startDate: r["Start Date"] || "",
        status: r["Status"] || ""
      }))

      // === Follow-ups ===
      const followups = toJSON(wb.Sheets["Follow-ups"]).map((r) => ({
        id: String(r["Follow-Up ID"] || crypto.randomUUID()),
        clientId: r["Client ID"] ? String(r["Client ID"]) : null,
        projectId: r["Project ID"] ? String(r["Project ID"]) : null,
        partnerId: r["Partner ID"] ? String(r["Partner ID"]) : null,
        productId: r["Product"] ? String(r["Product"]) : "",
        nextDate: r["Next Date"] || r["Date"] || "",
        action: r["Action"] || ""
      }))

      // === Project Comments ===
      const projectComments = (toJSON(wb.Sheets["Project Comments"]) || []).map((r) => ({
        id: String(r["Comment ID"] || crypto.randomUUID()),
        projectId: r["Project ID"] ? String(r["Project ID"]) : null,
        type: r["Type"] || "note",
        text: r["Comment"] || "",
        date: r["Date"] || new Date().toISOString().split("T")[0]
      }))

      setData({ clients, partners, products, projects, followups, projectComments })
    }
    input.click()
  }

  // === Export all sheets ===
  const exportExcel = () => {
    const wb = XLSX.utils.book_new()

    // === Clients ===
    const clientsFlat = (data.clients || []).flatMap((c) =>
      c.contacts && c.contacts.length
        ? c.contacts.map((ct) => ({
            "Client ID": String(c.id),
            "Client Name": c.name,
            Country: c.country,
            Address: c.details?.address || "",
            Notes: c.details?.notes || "",
            Notebook: c.details?.notebook || "",
            "Contact Person": ct.contact,
            Email: ct.email,
            Phone: ct.phone
          }))
        : [
            {
              "Client ID": String(c.id),
              "Client Name": c.name,
              Country: c.country,
              Address: c.details?.address || "",
              Notes: c.details?.notes || "",
              Notebook: c.details?.notebook || "",
              "Contact Person": "",
              Email: "",
              Phone: ""
            }
          ]
    )
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clientsFlat), "Clients")

    // === Partners ===
    const partnersFlat = (data.partners || []).flatMap((p) =>
      p.contacts && p.contacts.length
        ? p.contacts.map((ct) => ({
            "Partner ID": String(p.id),
            "Partner Name": p.name,
            "Contact Person": ct.contact,
            Email: ct.email,
            Phone: ct.phone
          }))
        : [
            {
              "Partner ID": String(p.id),
              "Partner Name": p.name,
              "Contact Person": "",
              Email: "",
              Phone: ""
            }
          ]
    )
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(partnersFlat), "Partners")

    // === Products ===
    const productsFlat = (data.products || []).flatMap((p) =>
      (p.items || []).map((prod) => ({ Partner: p.partner, Product: prod }))
    )
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(productsFlat), "Products")

    // === Projects ===
    const projectsSheet = (data.projects || []).map((p) => ({
      "Project ID": String(p.id),
      "Project Name": p.name,
      "Client ID": p.clientId,
      "Partner ID": p.partnerId,
      Product: p.productId,
      "Start Date": p.startDate,
      Status: p.status
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(projectsSheet), "Projects")

    // === Follow-ups ===
    const followupsSheet = (data.followups || []).map((f) => ({
      "Follow-Up ID": String(f.id),
      "Client ID": f.clientId,
      "Project ID": f.projectId,
      "Partner ID": f.partnerId,
      Product: f.productId,
      "Next Date": f.nextDate,
      Action: f.action
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(followupsSheet), "Follow-ups")

    // === Project Comments ===
    const commentsSheet = (data.projectComments || []).map((c) => ({
      "Comment ID": String(c.id),
      "Project ID": c.projectId,
      Type: c.type,
      Comment: c.text,
      Date: c.date
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(commentsSheet), "Project Comments")

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

  // === UI ===
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
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
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "transparent",
                border: "none",
                color: "#ffa733",
                fontSize: "1.4rem",
                cursor: "pointer"
              }}
            >
              ☰
            </button>
          )}
          <img
            src="/logo.png"
            alt="Extrusion CRM"
            style={{ height: "36px", width: "36px", objectFit: "contain" }}
          />
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", letterSpacing: "0.4px" }}>
            Partners & Projects <span style={{ color: "#fff" }}>CRM</span>
          </div>
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
            cursor: "pointer"
          }}
        >
          <CloudUpload size={16} />
        </button>
      </header>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <aside
          style={{
            position: isMobile ? "fixed" : "static",
            left: isMobile ? (sidebarOpen ? "0" : "-200px") : "auto",
            top: 0,
            height: isMobile ? "100vh" : "auto",
            width: "180px",
            background: "#000",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1px solid #333",
            paddingTop: isMobile ? "3.5rem" : "0",
            transition: "left 0.3s ease",
            zIndex: 15
          }}
        >
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
                    onClick={() => {
                      setTab(item.id)
                      if (isMobile) setSidebarOpen(false)
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: isActive ? "#ffa733" : "#fff",
                      fontSize: isActive ? "1.02rem" : "0.95rem",
                      fontWeight: isActive ? 600 : 400,
                      width: "100%",
                      textAlign: "left",
                      padding: "0.3rem 0.5rem",
                      cursor: "pointer"
                    }}
                  >
                    {item.name}
                  </button>
                </div>
              )
            })}
          </div>

          <div style={{ padding: "1rem 0.6rem" }}>
            <button onClick={importExcel} style={toolBtn}>📂 Import Excel</button>
            <button onClick={exportExcel} style={toolBtn}>💾 Export Excel</button>
            <button onClick={downloadCalendar} style={toolBtn}>📅 Export .ics</button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflowY: "auto", background: "#111", padding: "1rem" }}>
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
