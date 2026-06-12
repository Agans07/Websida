async function läggTillOrd() {
    
    
    let ord = document.getElementById("input-ord").value
    let minForklaring = document.getElementById("input-min").value
    let saForklaring = document.getElementById("input-sa").value
    if (ord === "" || minForklaring === "" || saForklaring === "") {
        return
    }
    const url = CONFIG.APPS_SCRIPT_URL


    await fetch(url, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ action: "läggTill", ord: ord, minForklaring: minForklaring, saForklaring: saForklaring })
    })
}