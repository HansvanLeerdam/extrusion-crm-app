export const handler = async () => {
  try {
    const REPO = "HansvanLeerdam/extrusion-crm-app"
    const FILE_PATH = "public/data.json"

    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
      headers: { Accept: "application/vnd.github.v3.raw" } // tells GitHub to return file content directly
    })

    if (!res.ok) {
      throw new Error(`GitHub fetch failed: ${res.status}`)
    }

    const json = await res.json()

    return {
      statusCode: 200,
      body: JSON.stringify(json)
    }
  } catch (err) {
    console.error("getData error:", err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    }
  }
}
