export function buildICS({ events, calName = 'Followups' }) {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const toUTC = (d) => {
    const dt = new Date(d)
    return [
      dt.getUTCFullYear(),
      pad(dt.getUTCMonth() + 1),
      pad(dt.getUTCDate()),
      'T',
      pad(dt.getUTCHours()),
      pad(dt.getUTCMinutes()),
      pad(dt.getUTCSeconds()),
      'Z'
    ].join('')
  }
  const toDateOnly = (d) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}`
  }

  let ics = ''
  ics += 'BEGIN:VCALENDAR\r\n'
  ics += 'VERSION:2.0\r\n'
  ics += `PRODID:-//Partners & Projects CRM//EN\r\n`
  ics += `X-WR-CALNAME:${calName}\r\n`

  events.forEach((e, i) => {
    const uid = `${(e.uid || 'evt')}-${i}-${now.getTime()}@crm`
    ics += 'BEGIN:VEVENT\r\n'
    if (e.allDay) {
      ics += `DTSTART;VALUE=DATE:${toDateOnly(e.start)}\r\n`
      if (e.end) ics += `DTEND;VALUE=DATE:${toDateOnly(e.end)}\r\n`
    } else {
      ics += `DTSTART:${toUTC(e.start)}\r\n`
      if (e.end) ics += `DTEND:${toUTC(e.end)}\r\n`
    }
    ics += `DTSTAMP:${toUTC(now)}\r\n`
    ics += `UID:${uid}\r\n`
    if (e.summary) ics += `SUMMARY:${escapeICS(e.summary)}\r\n`
    if (e.description) ics += `DESCRIPTION:${escapeICS(e.description)}\r\n`
    if (e.location) ics += `LOCATION:${escapeICS(e.location)}\r\n`
    ics += 'END:VEVENT\r\n'
  })

  ics += 'END:VCALENDAR\r\n'
  return ics
}

function escapeICS(text = '') {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}
