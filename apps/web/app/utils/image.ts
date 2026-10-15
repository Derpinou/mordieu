// L'image à partager : la traduction recopiée sur un parchemin, avec sa lettrine, dessinée dans un canvas.

const LARGEUR = 1080
const MARGE = 100
/** La lettrine descend sur 3 lignes, comme dans les manuscrits. */
const LIGNES_LETTRINE = 3

const COULEURS = {
  parchemin: '#f2e3c4',
  encre: '#2a1b0d',
  encreDouce: '#5a4126',
  rubrique: '#8f1d14',
  or: '#c9a24a',
  orClair: '#ecd28a',
  azur: '#1f3a6e',
}

// Les polices de la page (@nuxt/fonts), avec un repli si elles ne se chargent pas.
const POLICES = {
  titre: '"Grenze Gotisch", serif',
  texte: '"EB Garamond", serif',
  vieux: '"IM Fell English", serif',
}

interface Contenu {
  original: string
  traduction: string
  /** Petite ligne en bas de l'image, pour savoir d'où elle vient. */
  signature: string
}

/** Dessine la traduction et renvoie l'image en PNG. */
export async function imageDeTraduction({ original, traduction, signature }: Contenu): Promise<Blob> {
  // Un canvas n'attend pas les polices : sans cela, la première image partirait en Times.
  await Promise.all([
    document.fonts.load(`600 76px ${POLICES.titre}`),
    document.fonts.load(`italic 30px ${POLICES.texte}`),
    document.fonts.load(`56px ${POLICES.vieux}`),
  ])

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponible')

  // Mise en page : plus le texte est long, plus la plume s'affine.
  const taille = traduction.length > 300 ? 40 : traduction.length > 150 ? 48 : 56
  const interligne = Math.round(taille * 1.42)
  const largeur = LARGEUR - 2 * MARGE
  const [premiere = '', ...suite] = Array.from(traduction.trim())
  const avecLettrine = /\p{L}/u.test(premiere)
  // De la hauteur de capitale de la 1re ligne à la ligne de base de la 3e.
  const cote = Math.round((LIGNES_LETTRINE - 1) * interligne + 0.72 * taille)
  const retrait = cote + 24

  ctx.font = `${taille}px ${POLICES.vieux}`
  const lignes = avecLettrine
    ? couper(ctx, suite.join('').trimStart(), (i) => largeur - (i < LIGNES_LETTRINE ? retrait : 0))
    : couper(ctx, traduction, () => largeur)
  ctx.font = `italic 30px ${POLICES.texte}`
  const lignesOriginal = couper(ctx, `« ${original} »`, () => largeur)

  const yTitre = MARGE + 64
  const yOriginal = yTitre + 70
  const yFilet = yOriginal + (lignesOriginal.length - 1) * 40 + 52
  const yTraduction = yFilet + 44
  const lignesOccupees = Math.max(lignes.length, avecLettrine ? LIGNES_LETTRINE : 1)
  const ySignature = yTraduction + (lignesOccupees - 1) * interligne + taille + 84
  canvas.width = LARGEUR
  canvas.height = ySignature + MARGE - 20

  peindreParchemin(ctx, canvas.width, canvas.height)
  peindreCadre(ctx, canvas.width, canvas.height)

  ctx.textAlign = 'center'
  ctx.fillStyle = COULEURS.rubrique
  ctx.font = `600 76px ${POLICES.titre}`
  ctx.fillText('Mordieu', LARGEUR / 2, yTitre)

  ctx.fillStyle = COULEURS.encreDouce
  ctx.font = `italic 30px ${POLICES.texte}`
  lignesOriginal.forEach((ligne, i) => ctx.fillText(ligne, LARGEUR / 2, yOriginal + i * 40))

  peindreFilet(ctx, LARGEUR / 2, yFilet, 230)

  ctx.textAlign = 'left'
  const base = (i: number) => yTraduction + i * interligne + Math.round(0.9 * taille)
  if (avecLettrine) peindreLettrine(ctx, premiere, MARGE, base(0) - Math.round(0.72 * taille), cote)
  ctx.fillStyle = COULEURS.encre
  ctx.font = `${taille}px ${POLICES.vieux}`
  lignes.forEach((ligne, i) => {
    ctx.fillText(ligne, MARGE + (avecLettrine && i < LIGNES_LETTRINE ? retrait : 0), base(i))
  })

  ctx.textAlign = 'center'
  ctx.fillStyle = COULEURS.encreDouce
  ctx.font = `24px ${POLICES.texte}`
  ctx.fillText(signature, LARGEUR / 2, ySignature)

  return new Promise((resoudre, rejeter) => {
    canvas.toBlob((image) => (image ? resoudre(image) : rejeter(new Error('Image vide'))), 'image/png')
  })
}

/** Fait télécharger le fichier au navigateur. */
export function enregistrer(fichier: Blob, nom: string): void {
  const url = URL.createObjectURL(fichier)
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nom
  document.body.append(lien)
  lien.click()
  lien.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Répartit les mots en lignes ; `largeurLigne` donne la place disponible pour la ligne n°i. */
function couper(ctx: CanvasRenderingContext2D, texte: string, largeurLigne: (i: number) => number): string[] {
  const lignes: string[] = []
  let ligne = ''
  // Espaces ordinaires seulement : les insécables (« ») ne coupent pas.
  for (const mot of texte.split(/[ \t\r\n]+/).filter(Boolean)) {
    const essai = ligne ? `${ligne} ${mot}` : mot
    if (!ligne || ctx.measureText(essai).width <= largeurLigne(lignes.length)) {
      ligne = essai
    } else {
      lignes.push(ligne)
      ligne = mot
    }
  }
  if (ligne) lignes.push(ligne)
  return lignes
}

/** Générateur pseudo-aléatoire à graine (mulberry32) : le même parchemin à chaque image. */
function hasard(graine: number): () => number {
  return () => {
    graine = (graine + 0x6d2b79f5) | 0
    let t = Math.imul(graine ^ (graine >>> 15), 1 | graine)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

function peindreParchemin(ctx: CanvasRenderingContext2D, l: number, h: number) {
  ctx.fillStyle = COULEURS.parchemin
  ctx.fillRect(0, 0, l, h)
  const alea = hasard(1515)

  for (let i = 0; i < 7; i++) {
    const [x, y, r] = [alea() * l, alea() * h, 60 + alea() * 170]
    const tache = ctx.createRadialGradient(x, y, 0, x, y, r)
    tache.addColorStop(0, `rgb(150 100 45 / ${0.04 + alea() * 0.07})`)
    tache.addColorStop(1, 'rgb(150 100 45 / 0)')
    ctx.fillStyle = tache
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r)
  }

  for (let i = 0; i < (l * h) / 150; i++) {
    ctx.fillStyle = `rgb(95 62 25 / ${alea() * 0.09})`
    ctx.fillRect(alea() * l, alea() * h, 1 + alea() * 1.5, 1 + alea() * 1.5)
  }

  ctx.lineWidth = 1
  for (let i = 0; i < 80; i++) {
    const [x, y, longueur, angle] = [alea() * l, alea() * h, 20 + alea() * 60, (alea() - 0.5) * 0.6]
    ctx.strokeStyle = `rgb(110 75 35 / ${0.04 + alea() * 0.06})`
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(angle) * longueur, y + Math.sin(angle) * longueur)
    ctx.stroke()
  }

  const bords = ctx.createRadialGradient(l / 2, h / 2, Math.min(l, h) * 0.35, l / 2, h / 2, Math.hypot(l, h) / 2)
  bords.addColorStop(0, 'rgb(120 75 25 / 0)')
  bords.addColorStop(1, 'rgb(120 75 25 / 0.45)')
  ctx.fillStyle = bords
  ctx.fillRect(0, 0, l, h)
}

function peindreCadre(ctx: CanvasRenderingContext2D, l: number, h: number) {
  ctx.strokeStyle = COULEURS.rubrique
  ctx.lineWidth = 4
  ctx.strokeRect(40, 40, l - 80, h - 80)
  ctx.lineWidth = 1.5
  ctx.strokeRect(52, 52, l - 104, h - 104)
  for (const [x, y] of [
    [46, 46],
    [l - 46, 46],
    [46, h - 46],
    [l - 46, h - 46],
  ] as const) {
    losange(ctx, x, y, 10, COULEURS.or)
  }
}

function peindreFilet(ctx: CanvasRenderingContext2D, x: number, y: number, demiLargeur: number) {
  ctx.strokeStyle = COULEURS.rubrique
  ctx.lineWidth = 1.5
  ctx.globalAlpha = 0.6
  ctx.beginPath()
  ctx.moveTo(x - demiLargeur, y)
  ctx.lineTo(x - 20, y)
  ctx.moveTo(x + 20, y)
  ctx.lineTo(x + demiLargeur, y)
  ctx.stroke()
  ctx.globalAlpha = 1
  losange(ctx, x, y, 8, COULEURS.rubrique)
}

/** Lettre d'or sur champ d'azur semé de points blancs, dans un double cadre d'or. */
function peindreLettrine(ctx: CanvasRenderingContext2D, lettre: string, x: number, y: number, cote: number) {
  const fond = ctx.createLinearGradient(x, y, x + cote, y + cote)
  fond.addColorStop(0, '#2c4f92')
  fond.addColorStop(0.55, COULEURS.azur)
  fond.addColorStop(1, '#13274d')
  ctx.fillStyle = fond
  ctx.fillRect(x, y, cote, cote)

  ctx.fillStyle = 'rgb(255 255 255 / 0.35)'
  const pas = cote / 9
  for (let px = x + pas / 2; px < x + cote; px += pas) {
    for (let py = y + pas / 2; py < y + cote; py += pas) {
      ctx.beginPath()
      ctx.arc(px, py, 1.6, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  ctx.strokeStyle = COULEURS.or
  ctx.lineWidth = 5
  ctx.strokeRect(x + 2.5, y + 2.5, cote - 5, cote - 5)
  ctx.lineWidth = 1.5
  ctx.strokeRect(x + 11, y + 11, cote - 22, cote - 22)

  // Centrée sur son dessin réel, pas sur sa chasse : les gothiques débordent volontiers.
  ctx.font = `600 ${Math.round(cote * 0.74)}px ${POLICES.titre}`
  const mesure = ctx.measureText(lettre)
  const lx = x + cote / 2 + (mesure.actualBoundingBoxLeft - mesure.actualBoundingBoxRight) / 2
  const ly = y + cote / 2 + (mesure.actualBoundingBoxAscent - mesure.actualBoundingBoxDescent) / 2
  ctx.fillStyle = COULEURS.rubrique
  ctx.fillText(lettre, lx + 3, ly + 3)
  ctx.fillStyle = COULEURS.orClair
  ctx.fillText(lettre, lx, ly)
}

function losange(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, couleur: string) {
  ctx.fillStyle = couleur
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.lineTo(x + r, y)
  ctx.lineTo(x, y + r)
  ctx.lineTo(x - r, y)
  ctx.closePath()
  ctx.fill()
}
