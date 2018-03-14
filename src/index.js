import ecka from './ecka.json'


const GET_PARENT_RX = /(?!^e\d+)[a-gi]+$/
const getEParent = (e) => e.replace(GET_PARENT_RX, '')

const getEData = (e) => {
  const desc = ecka[e]
  return desc || ecka[getEParent(e)]
}

export { getEParent, getEData }
export { default as getAdditives } from './getAdditives'
