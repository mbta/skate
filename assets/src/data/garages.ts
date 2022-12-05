export interface Garage {
  name: string
  lat: number
  lon: number
}

const albany: Garage = {
  name: "Albany",
  lat: 42.34062390934881,
  lon: -71.06491110199285,
}

const arborway: Garage = {
  name: "Arborway",
  lat: 42.303766413998346,
  lon: -71.10907263082902,
}
const cabot: Garage = {
  name: "Cabot",
  lat: 42.339806879089416,
  lon: -71.05748880181748,
}

const charelstownSomerville: Garage = {
  name: "Charlestown and Somerville",
  lat: 42.38845701224413,
  lon: -71.07340920181632,
}
const fellsway: Garage = {
  name: "Fellsway",
  lat: 42.421755239144375,
  lon: -71.08885717297913,
}

const lynn: Garage = {
  name: "Lynn",
  lat: 42.455369794853446,
  lon: -70.97447333065087,
}

const northCambridge: Garage = {
  name: "North Cambridge",
  lat: 42.39704175594631,
  lon: -71.12875420181608,
}

const quincy: Garage = {
  name: "Quincy",
  lat: 42.25976775999477,
  lon: -71.0091961019948,
}

const southampton: Garage = {
  name: "Southampton",
  lat: 42.33174421046923,
  lon: -71.06510743082846,
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
