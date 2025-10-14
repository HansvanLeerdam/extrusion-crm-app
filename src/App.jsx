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
import { CloudUpload } from "lucide-react"   // ✅ correct placement

function App() {
  const { data, setData } = useStore()
  const [tab, setTab] = useState("dashboard")

  useEffect(() => {
    console.log("Loaded data:", data)
  }, [data])

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
        { headers: { Authorization: `Bearer ${token}` } }
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

  // === Import / Export XLSX ===
  useEffect(() => {
    const exportBtn = document.getElementById("btn-export")
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
    <div>
      {/* ✅ Fixed Save to Cloud button (orange, Lucide icon) */}
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

      {/* === Page Tabs === */}
      {tab === "dashboard" && <Dashboard data={data} />}
      {tab === "clients" && <Clients data={data} setData={setData} />}
      {tab === "partners" && <Partners data={data} setData={setData} />}
      {tab === "products" && <Products data={data} setData={setData} />}
      {tab === "projects" && <Projects data={data} setData={setData} />}
      {tab === "followups" && <Followups data={data} setData={setData} />}
    </div>
  )
}

export default App
