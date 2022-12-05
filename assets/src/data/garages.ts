export interface Garage {
  name: string
  lat: number
  lon: number
}

const albany: Garage = {
  name: "Albany",
  lat: 42.340615979089385,
  lon: -71.06492183084201,
}

const arborway: Garage = {
  name: "Arborway",
  lat: 42.303761454681926,
  lon: -71.10906324311202,
}
const cabot: Garage = {
  name: "Cabot",
  lat: 42.340229502144965,
  lon: -71.05782441576152,
}

const charelstownSomerville: Garage = {
  name: "Charlestown and Somerville",
  lat: 42.38840991628405,
  lon: -71.07348077649227,
}
const fellsway: Garage = {
  name: "Fellsway",
  lat: 42.42173173182341,
  lon: -71.08886594187817,
}

const lynn: Garage = {
  name: "Lynn",
  lat: 42.45536187908166,
  lon: -70.97446260200391,
}

const northCambridge: Garage = {
  name: "North Cambridge",
  lat: 42.397057803688156,
  lon: -71.12876028736464,
}

const quincy: Garage = {
  name: "Quincy",
  lat: 42.25975478299841,
  lon: -71.00919883735509,
}

const southampton: Garage = {
  name: "Southampton",
  lat: 42.33173416200229,
  lon: -71.06509478685597,
}

export default [
  albany,
  arborway,
  cabot,
  charelstownSomerville,
  fellsway,
  lynn,
  northCambridge,
  quincy,
  southampton,
]
