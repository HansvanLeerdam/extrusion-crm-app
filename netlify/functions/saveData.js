// netlify/functions/saveData.js

export async function handler(event) {
  try {
    // Parse the POST body (your app's data)
    const body = JSON.parse(event.body || "{}")

    // --- GitHub repo details ---
    const token = process.env.GITHUB_TOKEN   // stored safely in Netlify
    const repoOwner = "HansvanLeerdam"
    const repoName = "extrusion-crm-app"
    const filePath = "public/data.json"

    // Get current SHA (required for updating existing files)
    const shaRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
      { headers: { Authorization: `token ${token}` } }
    )
    const shaData = await shaRes.json()
    const sha = shaData.sha || null

    // Prepare new content
    const content = Buffer.from(JSON.stringify(body, null, 2)).toString("base64")

    // Push to GitHub
    const result = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "CRM sync update via Netlify Function",
          content,
          sha
        })
      }
    )

    if (!result.ok) {
      const txt = await result.text()
      return { statusCode: 500, body: JSON.stringify({ error: txt }) }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
