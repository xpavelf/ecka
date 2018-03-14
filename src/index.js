export { default as ecka } from './ecka.json'
export { default as getAdditives } from './getAdditives'

const GET_PARENT_RX = /(?!^e\d+)[a-gi]+$/
export function getEParent(e) {
  return e.replace(GET_PARENT_RX, '')
}
