import fetch from "node-fetch"

export const handler = async (event) => {
  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN
    const REPO = "HansvanLeerdam/extrusion-crm-app"
    const FILE_PATH = "public/data.json"

    if (!GITHUB_TOKEN) {
      return {
        statusCode: 500,
        body: "Missing GITHUB_TOKEN environment variable"
      }
    }

    const body = JSON.parse(event.body)

    // === Get SHA of current data.json (needed by GitHub API)
    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json"
      }
    })

    if (!res.ok) {
      throw new Error(`Failed to get file SHA: ${res.statusText}`)
    }

    const { sha } = await res.json()

    // === Create commit with updated content
    const updateRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: "Update data.json from CRM app",
        content: Buffer.from(JSON.stringify(body, null, 2)).toString("base64"),
        sha
      })
    })

    if (!updateRes.ok) {
      const errText = await updateRes.text()
      throw new Error(`GitHub update failed: ${errText}`)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }
  } catch (err) {
    console.error("Error saving data:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}
