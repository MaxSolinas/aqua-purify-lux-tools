// CONFIGURATION DE VOTRE DEPOT GITHUB
const GITHUB_TOKEN = "VOTRE_TOKEN_PAT_GITHUB"; // Gardez cela secret
const REPO_OWNER = "MaxSolinas";
const REPO_NAME = "aqua-purify-lux-tools";
const BRANCH = "main";

/**
 * Crée un menu Aqua Purify directement dans la barre d'outils Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('💧 Aqua Purify')
      .addItem('🚀 Synchroniser le Simulateur', 'syncDataWithGitHub')
      .addToUi();
}

function syncDataWithGitHub() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Extraction et formatage de l'onglet Produits
  const sheetProd = ss.getSheetByName("Produits");
  const dataProd = sheetProd.getDataRange().getValues();
  let jsonProduits = [];
  
  for (let i = 1; i < dataProd.length; i++) {
    let row = dataProd[i];
    let obj = {};
    obj.limit = parseFloat(row[0]);
    obj.name = String(row[1]);
    if (row[2] !== "") obj.maxSelectTH = parseFloat(row[2]);
    if (row[3] !== "") obj.volLimit = parseFloat(row[3]);
    obj.resin = String(row[4]);
    obj.flow1b = String(row[5]);
    obj.flow2b = String(row[6]);
    obj.hardness = String(row[7]);
    obj.conn = String(row[8]);
    obj.dims = String(row[9]);
    obj.pressure = String(row[10]);
    obj.temp = String(row[11]);
    jsonProduits.push(obj);
  }

  // 2. Extraction et formatage de l'onglet Communes
  const sheetCommunes = ss.getSheetByName("Communes");
  const dataCommunes = sheetCommunes.getDataRange().getValues();
  let jsonCommunes = {};
  
  for (let i = 1; i < dataCommunes.length; i++) {
    let row = dataCommunes[i];
    let key = String(row[0]).trim();
    if (!key) continue;
    
    let obj = {};
    obj.th = parseFloat(row[1]);
    if (row[2] && String(row[2]).trim() !== "") {
      obj.city = String(row[2]).trim();
    }
    if (row[3] && String(row[3]).trim() !== "") {
      obj.localities = String(row[3]).split(",").map(item => item.trim());
    }
    jsonCommunes[key] = obj;
  }

  // 3. Push vers GitHub
  try {
    pushToGitHub("src/data/produits.json", JSON.stringify(jsonProduits, null, 2), "Mise à jour des produits via Google Sheets");
    pushToGitHub("src/data/communes.json", JSON.stringify(jsonCommunes, null, 2), "Mise à jour des communes via Google Sheets");
    SpreadsheetApp.getUi().alert("✅ Synchronisation réussie ! Cloudflare Pages va recompiler votre widget d'ici 1 à 2 minutes.");
  } catch(e) {
    SpreadsheetApp.getUi().alert("❌ Erreur de synchronisation : " + e.toString());
  }
}

/**
 * Fonction interne gérant l'API GitHub (Récupère le SHA existant si le fichier existe pour écraser proprement)
 */
function pushToGitHub(path, content, commitMessage) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
  
  // Vérification de l'existence du fichier pour obtenir son SHA
  let sha = null;
  let optionsGet = {
    "method": "get",
    "headers": {
      "Authorization": "token " + GITHUB_TOKEN,
      "Accept": "application/vnd.github.v3+json"
    },
    "muteHttpExceptions": true
  };
  
  let responseGet = UrlFetchApp.fetch(url, optionsGet);
  if (responseGet.getResponseCode() === 200) {
    let fileInfo = JSON.parse(responseGet.getContentText());
    sha = fileInfo.sha;
  }
  
  // Préparation du payload
  let payload = {
    "message": commitMessage,
    "content": Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    "branch": BRANCH
  };
  if (sha) payload.sha = sha;

  let optionsPut = {
    "method": "put",
    "headers": {
      "Authorization": "token " + GITHUB_TOKEN,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  let responsePut = UrlFetchApp.fetch(url, optionsPut);
  if (responsePut.getResponseCode() !== 200 && responsePut.getResponseCode() !== 201) {
    throw new Error("GitHub API a répondu avec le code " + responsePut.getResponseCode() + " : " + responsePut.getContentText());
  }
}
