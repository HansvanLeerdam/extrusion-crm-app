exports.handler = async (event) => {
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

    const body = JSON.parse(event.body || "{}")

    // === Get current SHA ===
    const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json"
      }
    })

    if (!getRes.ok) {
      const msg = await getRes.text()
      throw new Error(`Failed to fetch file: ${msg}`)
    }

    const fileData = await getRes.json()
    const sha = fileData.sha

    // === Update file on GitHub ===
    const commitRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Update data.json from CRM app",
        content: Buffer.from(JSON.stringify(body, null, 2)).toString("base64"),
        sha
      })
    })

    if (!commitRes.ok) {
      const msg = await commitRes.text()
      throw new Error(`GitHub update failed: ${msg}`)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Data saved to GitHub" })
    }
  } catch (err) {
    console.error("❌ Function error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}
