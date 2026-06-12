let alleOrd = []
let frågor = []
let nuvarandeFråga = 0
let poäng = 0

async function startaQuiz() {
  nuvarandeFråga = 0
  poäng = 0
  frågor = []

  document.getElementById("loading").classList.remove("hidden")
  document.getElementById("quiz-card").classList.add("hidden")
  document.getElementById("result-card").classList.add("hidden")

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${CONFIG.SHEET_NAME}!A2:C1000?key=${CONFIG.API_KEY}`

  try {
    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      console.log("API-fel:", data.error.message)
      return
    }

    const rader = data.values

    if (!rader || rader.length === 0) {
      console.log("Inga ord hittades.")
      return
    }

    alleOrd = rader
    skapaFrågor()

    document.getElementById("loading").classList.add("hidden")
    document.getElementById("quiz-card").classList.remove("hidden")

    visaFråga()

  } catch (error) {
    console.log("Kunde inte hämta data:", error)
  }
}

function skapaFrågor() {
  let blandade = [...alleOrd].sort(() => Math.random() - 0.5)
  let urval = blandade.slice(0, 10)

  for (let i = 0; i < urval.length; i++) {
    let rad = urval[i]
    let användSA = Math.random() > 0.5

    let fråga = {
      ord: rad[0],
      rättSvar: användSA ? rad[2] : rad[1],
      typ: användSA ? "Svenska Akademin" : "Min förklaring"
    }

    let felAlternativ = alleOrd
      .filter(r => r[0] !== rad[0])
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(r => användSA ? r[2] : r[1])

    fråga.alternativ = [fråga.rättSvar, ...felAlternativ].sort(() => Math.random() - 0.5)

    frågor.push(fråga)
  }
}

function visaFråga() {
  let fråga = frågor[nuvarandeFråga]
  let totalt = frågor.length

  document.getElementById("progress-text").textContent = `Fråga ${nuvarandeFråga + 1} av ${totalt}`
  document.getElementById("progress-fill").style.width = `${(nuvarandeFråga / totalt) * 100}%`
  document.getElementById("question-type").textContent = fråga.typ
  document.getElementById("question").textContent = fråga.ord
  document.getElementById("feedback").classList.add("hidden")
  document.getElementById("next-btn").classList.add("hidden")

  const container = document.getElementById("alternatives")
  container.innerHTML = ""

  for (let i = 0; i < fråga.alternativ.length; i++) {
    let alt = fråga.alternativ[i]
    let knapp = document.createElement("button")
    knapp.className = "alt-btn"
    knapp.textContent = alt
    knapp.onclick = () => väljSvar(alt, fråga.rättSvar, knapp)
    container.appendChild(knapp)
  }
}

function väljSvar(valtSvar, rättSvar, knapp) {
  let knappar = document.querySelectorAll(".alt-btn")
  knappar.forEach(k => k.disabled = true)

  let feedback = document.getElementById("feedback")
  feedback.classList.remove("hidden", "correct", "wrong")

  if (valtSvar === rättSvar) {
    poäng++
    knapp.classList.add("correct")
    feedback.textContent = "✓ Rätt!"
    feedback.classList.add("correct")
  } else {
    knapp.classList.add("wrong")
    feedback.textContent = `✗ Fel! Rätt svar: ${rättSvar}`
    feedback.classList.add("wrong")
    knappar.forEach(k => {
      if (k.textContent === rättSvar) k.classList.add("correct")
    })
  }

  document.getElementById("next-btn").classList.remove("hidden")
}

function nästaFråga() {
  nuvarandeFråga++

  if (nuvarandeFråga >= frågor.length) {
    document.getElementById("quiz-card").classList.add("hidden")
    document.getElementById("result-card").classList.remove("hidden")
    document.getElementById("result-text").textContent = `Du fick ${poäng} av ${frågor.length} rätt`

    let procent = poäng / frågor.length
    let emoji = procent >= 0.8 ? "🎉" : procent >= 0.5 ? "👍" : "📚"
    document.querySelector(".result-emoji").textContent = emoji
  } else {
    visaFråga()
  }
}

startaQuiz()