import React, { useMemo, useState } from "react"
import { CalendarDays } from "lucide-react"
import SectionTitle from "../components/SectionTitle"

export default function Dashboard({ data }) {
  const [filterClient, setFilterClient] = useState("")
  const [filterPartner, setFilterPartner] = useState("")

  const inputStyle = {
    height: "28px",
    background: "#e9e9e9",
    color: "#111",
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "0 0.4rem",
    fontSize: "0.9rem",
    outline: "none",
    width: "160px"
  }

  // Fast lookup: project id → project
  const projectById = useMemo(() => {
    const map = {}
    for (const p of data.projects || []) map[String(p.id)] = p
    return map
  }, [data.projects])

  const getDotColor = (date) => {
    const today = new Date().toISOString().split("T")[0]
    if (!date) return "#777"
    if (date < today) return "#F44336"
    if (date === today) return "#FFC107"
    return "#4CAF50"
  }

  // Only include clients that appear in follow-ups
  const clientsInFollowups = new Set((data.followups || []).map(f => f.clientId))
  const allClients = (data.clients || [])
    .filter(c => clientsInFollowups.has(c.id))
    .sort((a, b) => a.name.localeCompare(b.name))

  const allPartners = [...(data.partners || [])].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  // Apply filters
  const upcoming = [...(data.followups || [])]
    .filter((f) => {
      const okClient = !filterClient || String(f.clientId) === String(filterClient)
      const okPartner = !filterPartner || String(f.partnerId) === String(filterPartner)
      return okClient && okPartner
    })
    .filter((f) => f.nextDate)
    .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate))

  return (
    <div className="dashboard">
      <div className="card" style={{ textAlign: "left" }}>
        <SectionTitle icon={CalendarDays} title="Upcoming Follow-ups" />

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
            style={inputStyle}
          >
            <option value="">All Clients</option>
            {allClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filterPartner}
            onChange={(e) => setFilterPartner(e.target.value)}
            style={inputStyle}
          >
            <option value="">All Partners</option>
            {allPartners.map((p) => (
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
              style={{
                height: "30px",
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

        {/* === TABLE === */}
        <table
          className="followups-table table--has-actions"
          style={{
            tableLayout: "fixed",
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left"
          }}
        >
          <thead>
            <tr style={{ color: "#ffa733", fontWeight: 600, fontSize: "0.9rem" }}>
              <th style={{ width: 18 }}></th>
              <th style={{ width: 90, textAlign: "left" }}>Date</th>
              <th style={{ width: 180, textAlign: "left" }}>Client</th>
              <th style={{ width: 180, textAlign: "left" }}>Project</th>
              <th style={{ width: 160, textAlign: "left" }}>Partner</th>
              <th style={{ width: 200, textAlign: "left" }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {upcoming.length > 0 ? (
              upcoming.map((f) => {
                const proj = projectById[String(f.projectId)]
                const client =
                  (data.clients || []).find((c) => c.id === f.clientId)?.name || ""
                const partner =
                  (data.partners || []).find((p) => p.id === f.partnerId)?.name || ""
                const projectName = proj?.name || ""
                const dotColor = getDotColor(f.nextDate)

                return (
                  <tr key={String(f.id)}>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: dotColor
                        }}
                      />
                    </td>
                    <td style={{ color: "#ccc" }}>{f.nextDate}</td>
                    <td style={{ color: "#fff" }}>{client}</td>
                    <td style={{ color: "#eee" }}>{projectName}</td>
                    <td style={{ color: "#ccc" }}>{partner}</td>
                    <td style={{ color: "#f0f0f0" }}>{f.action}</td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#888" }}>
                  No follow-ups found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
