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

  // === Save manually to GitHub ===
  const saveDataToGitHub = async () => {
    const token = import.meta.env.VITE_GITHUB_TOKEN
    const repoOwner = "HansvanLeerdam"
    const repoName = "extrusion-crm-app"
    const filePath = "public/data.json"

    try {
      const shaResponse = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
        { headers: { Authorization: `token ${token}` } }
      )

      const shaData = await shaResponse.json()
      const sha = shaData.sha || null
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))))

      const result = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: "CRM sync update",
            content,
            sha
          })
        }
      )

      if (result.ok) {
        alert("✅ Data successfully saved to GitHub!")
      } else {
        console.error("❌ GitHub save error:", await result.text())
        alert("❌ Save failed — check console or token.")
      }
    } catch (error) {
      console.error("❌ Error saving to GitHub:", error)
      alert("❌ Save failed — check console or token.")
    }
  }

  // === Import / Export to Excel ===
  useEffect(() => {
    const importBtn = document.getElementById("btn-import")
    const exportBtn = document.getElementById("btn-export")

    if (importBtn) {
      importBtn.onclick = () => {
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
            const clientName = (r["Client Name"] || "").trim()
            if (!clientName) return
            let client = clients.find((c) => c.name.toLowerCase() === clientName.toLowerCase())
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
    }

    if (exportBtn) {
      exportBtn.onclick = () => {
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
    }
  }, [data, setData])

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* === SIDEBAR === */}
      <div
        className="sidebar"
        style={{
          width: "200px",
          background: "#111",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          padding: "1rem",
          gap: "0.5rem"
        }}
      >
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
            className={tab === t.id ? "active" : ""}
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

      {/* === MAIN CONTENT === */}
      <div style={{ flex: 1, position: "relative", padding: "1rem" }}>
        {/* Save to Cloud Button */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "20px",
            zIndex: 5000
          }}
        >
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

        {tab === "dashboard" && <Dashboard data={data} />}
        {tab === "clients" && <Clients data={data} setData={setData} />}
        {tab === "partners" && <Partners data={data} setData={setData} />}
        {tab === "products" && <Products data={data} setData={setData} />}
        {tab === "projects" && <Projects data={data} setData={setData} />}
        {tab === "followups" && <Followups data={data} setData={setData} />}
      </div>
    </div>
  )
}
export default App

