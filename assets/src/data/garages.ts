export interface Garage {
  name: string
  lat: number
  lon: number
}

const albany: Garage = {
  name: "Albany",
  lat: 42.340616,
  lon: -71.0671051,
}

const arborway: Garage = {
  name: "Arborway",
  lat: 42.3037585,
  lon: -71.1112559,
}
const cabot: Garage = {
  name: "Cabot",
  lat: 42.3398069,
  lon: -71.0596828,
}

const charelstownSomerville: Garage = {
  name: "Charlestown and Somerville",
  lat: 42.3882827,
  lon: -71.0734092,
}
const fellsway: Garage = {
  name: "Fellsway",
  lat: 42.4217315,
  lon: -71.0910619,
}

const lynn: Garage = {
  name: "Lynn",
  lat: 42.4553619,
  lon: -70.9766566,
}

const northCambridge: Garage = {
  name: "North Cambridge",
  lat: 42.3970497,
  lon: -71.1309482,
}

const quincy: Garage = {
  name: "Quincy",
  lat: 42.2597519,
  lon: -71.0113901,
}

const southampton: Garage = {
  name: "Southampton",
  lat: 42.3317363,
  lon: -71.0650967,
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
