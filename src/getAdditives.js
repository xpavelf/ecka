const ecka = require('./ecka.json')
const removeDiacritics = require('diacritics').remove

const E_SUF_RX = '\\d{3,4}([a-g]|i{0,3})'
const E_RX = `e[-\\s]?${E_SUF_RX}`
const ECKO_REGEX = new RegExp(`\\b(${E_RX})`, 'gi')
const MULTIPLE_ECKO_RX = new RegExp(`\\b${E_RX}\\b(,\\s?${E_SUF_RX}\\b(?!g))+`, 'gi')

const ECKO_REGEX_OLD = /\b(e[-\s]?\d{3,4}([a-g]|i{0,3}))/gi


const eckaStriped = Object.keys(ecka).reduce((sum, k) => {
  let rxStr = ecka[k].names
    .map(s => removeDiacritics(s))
    .join('|')

  let rx = new RegExp(`\\b(${rxStr})\\b`, "gi")
  return Object.assign({}, sum, {[k]: rx})
}, {})

const __getListedE = (str) => {
  let listed = []
  let m, m1
  while (m = ECKO_REGEX.exec(str)) {
    listed.push(m[0].replace(/-|\s/g, ''))
  }

  while (m1 = MULTIPLE_ECKO_RX.exec(str)) {
    m1[0]
      .split(/,\s?/)
      .slice(1)
      .filter(e => !e.match(/\d\s?g/)) // napr. E150, 200g
      .forEach(e => listed.push('e'+e))
  }

  return listed
}

const __isOverlaping = (hitX, hitY) => {
  let hitX0 = hitX.index
  let hitX1 = hitX0 + hitX.length - 1
  let hitY0 = hitY.index
  let hitY1 = hitY0 + hitY.length - 1

  return hitX0 <= hitY1 && hitY0 <= hitX1
}

const __getLongestHitForE = (str, eNum) => {
  let rx = eckaStriped[eNum]
  let m
  let retVal = null
  while ((m = rx.exec(str)) !== null) {
    if (!retVal || retVal.length < m[0].length) {
      retVal = { index: m.index, length: m[0].length, eNum }
    }
  }

  return retVal
}

// filter hits that are overlaping and shorther
// f.ex. for 'Amoniakovy karamel' only e150c is valid
// 'e150a Karamel'
// 'e150c Amoniakový karamel'
// 'e150d Amoniak,Sulfitový karamel'
const __filterInvalidHits = (hits) => {
  return hits.reduce((sum, hit) => {
    let inc = hits
      .every(thit => {
        if (__isOverlaping(thit, hit)) {
          return thit.length <= hit.length
        }
        return true
      })

    return inc ? sum.concat(hit.eNum) : sum
  }, [])
}

const ingredientsTextToArr = (str) => str
  .toLowerCase()
  .split(/,(?![^\(]*\))(?!\d)/g)
  .map(str => str.trim())
  .filter(str => str.length)

const getAdditives = (ingredients) => {
  let ingredientsArrUnflatten = Array.isArray(ingredients) ? ingredients : ingredientsTextToArr(ingredients)

  let ingredientsArr = ingredientsArrUnflatten.reduce((sum, act) => sum.concat(ingredientsTextToArr(act)), [])

  let ecka = ingredientsArr.reduce((sum, ing) => {
    let normIng = removeDiacritics(ing)

    let hits = Object.keys(eckaStriped).reduce((sum, eNum) => {
      let hit = __getLongestHitForE(normIng, eNum)
      return hit ? sum.concat(hit) : sum
    }, [])

    let filteredHits = []
    if (hits.length) {
      filteredHits = __filterInvalidHits(hits)
    }

    return sum.concat(filteredHits)
  }, [])

  let listed = __getListedE(ingredientsArr)
  let eckaUniq = new Set(ecka.concat(listed))

  return [...eckaUniq].sort()
}

module.exports = getAdditives
