let alleOrd = []
let filtreradeOrd = []
let nuvarandeSida = 0
const ORDPERSIDA = 2

async function hämtaOrd() {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.SHEET_NAME}!A2:C1000?key=${CONFIG.API_KEY}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      visaFel("API-fel: " + data.error.message)
      return
    }

    const rader = data.values

    if (!rader || rader.length === 0) {
      visaFel("Inga ord hittades i Sheetet.")
      return
    }

    alleOrd = rader
    filtreradeOrd = rader
    visaSida(0)

  } catch (error) {
    visaFel("Kunde inte hämta data. Kontrollera din API-nyckel.")
  }
}

function sök(text) {
  filtreradeOrd = alleOrd.filter(rad => {
    return rad[0]?.toLowerCase().includes(text.toLowerCase())
  })
  nuvarandeSida = 0
  visaSida(0)
}

function visaSida(sida) {
  nuvarandeSida = sida

  const start = sida * ORDPERSIDA
  const slut  = start + ORDPERSIDA
  const sidan = filtreradeOrd.slice(start, slut)
  const totaltSidor = Math.ceil(filtreradeOrd.length / ORDPERSIDA)

  const status = document.getElementById("status")
  status.textContent = `${filtreradeOrd.length} ord — sida ${sida + 1} av ${totaltSidor}`

  const lista = document.getElementById("word-list")

  if (filtreradeOrd.length === 0) {
    lista.innerHTML = `<p class="ingen-träff">Inga ord matchar sökningen.</p>`
    document.getElementById("paginering").innerHTML = ""
    return
  }

  lista.innerHTML = sidan.map((rad, index) => {
    const globalIndex   = start + index
    const ord           = rad[0] || ""
    const minForklaring = rad[1] || ""
    const saForklaring  = rad[2] || ""

    return `
      <div class="word-card" id="card-${globalIndex}">
        <div class="word-header">
          <h2 class="word-title">${ord}</h2>
          <button class="edit-btn" onclick="öppnaRedigera(${globalIndex})">✏️ Redigera</button>
        </div>

        <div class="explanations" id="visa-${globalIndex}">
          <div class="explanation">
            <span class="explanation-label">Min förklaring</span>
            <p>${minForklaring || "Ingen förklaring"}</p>
          </div>
          <div class="explanation">
            <span class="explanation-label sa">Svenska Akademin</span>
            <p>${saForklaring || "Ingen förklaring"}</p>
          </div>
        </div>

        <div class="edit-form hidden" id="redigera-${globalIndex}">
          <div class="form-group">
            <label>Ord</label>
            <input type="text" id="edit-ord-${globalIndex}" value="${ord}" />
          </div>
          <div class="form-group">
            <label>Min förklaring</label>
            <textarea id="edit-min-${globalIndex}">${minForklaring}</textarea>
          </div>
          <div class="form-group">
            <label>Svenska Akademin</label>
            <textarea id="edit-sa-${globalIndex}">${saForklaring}</textarea>
          </div>
          <div class="edit-actions">
            <button class="spara-btn" onclick="sparaRedigering(${globalIndex}, '${ord}')">Spara</button>
            <button class="avbryt-btn" onclick="stängRedigera(${globalIndex})">Avbryt</button>
          </div>
          <p class="edit-status" id="edit-status-${globalIndex}"></p>
        </div>
      </div>
    `
  }).join("")

  // Paginering
  const pag = document.getElementById("paginering")
  pag.innerHTML = `
    <button class="pag-btn" onclick="visaSida(${sida - 1})" ${sida === 0 ? "disabled" : ""}>← Föregående</button>
    <span class="pag-info">${sida + 1} / ${totaltSidor}</span>
    <button class="pag-btn" onclick="visaSida(${sida + 1})" ${sida >= totaltSidor - 1 ? "disabled" : ""}>Nästa →</button>
  `
}

function öppnaRedigera(index) {
  document.getElementById(`visa-${index}`).classList.add("hidden")
  document.getElementById(`redigera-${index}`).classList.remove("hidden")
}

function stängRedigera(index) {
  document.getElementById(`visa-${index}`).classList.remove("hidden")
  document.getElementById(`redigera-${index}`).classList.add("hidden")
}

async function sparaRedigering(index, gammaltOrd) {
  const nyttOrd       = document.getElementById(`edit-ord-${index}`).value
  const minForklaring = document.getElementById(`edit-min-${index}`).value
  const saForklaring  = document.getElementById(`edit-sa-${index}`).value
  const statusEl      = document.getElementById(`edit-status-${index}`)

  statusEl.textContent = "Sparar..."
  statusEl.style.color = "var(--text-muted)"

  try {
    await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify({
        action: "uppdatera",
        gammaltOrd: gammaltOrd,
        ord: nyttOrd,
        minForklaring: minForklaring,
        saForklaring: saForklaring
      })
    })

    alleOrd = alleOrd.map(rad => {
      if (rad[0] === gammaltOrd) return [nyttOrd, minForklaring, saForklaring]
      return rad
    })
    filtreradeOrd = filtreradeOrd.map(rad => {
      if (rad[0] === gammaltOrd) return [nyttOrd, minForklaring, saForklaring]
      return rad
    })

    statusEl.textContent = "✓ Sparat!"
    statusEl.style.color = "#4caf82"

    setTimeout(() => visaSida(nuvarandeSida), 800)

  } catch (error) {
    statusEl.textContent = "Något gick fel."
    statusEl.style.color = "#ff6b6b"
  }
}

function visaFel(meddelande) {
  const status = document.getElementById("status")
  status.textContent = meddelande
  status.classList.add("error")
}

hämtaOrd()
