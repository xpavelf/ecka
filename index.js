const ecka = require('./ecka.json')
const removeDiacritics = require('diacritics').remove
const ECKO_REGEX = /\b(e[-\s]?\d{3,4}([a-g]|i{0,3}))/g
const eckaStriped = Object.keys(ecka).reduce((sum, k) => {
  let striped = ecka[k].names.map(s => removeDiacritics(s).toLowerCase())
  return Object.assign({}, sum, {[k]: striped})
}, {})

const __getListedE = (str) => {
  let listed = []
  let m
  while (m = ECKO_REGEX.exec(str)) {
    listed.push(m[1].replace(/-|\s/g, ''))
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
  let eAlias = eckaStriped[eNum]
  let hits = eAlias.reduce((longest, alias) => {
    let regexp = new RegExp(`\\b${alias}\\b`)
    let match = str.match(regexp)
    if (match !== null) {
      if (!longest || longest.length < alias.length) {
        return { index: match.index, length: alias.length, eNum }
      }
    }
    return longest
  }, null)

  return hits
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
  let ingredientsArr = Array.isArray(ingredients) ? ingredients : ingredientsTextToArr(ingredients)

  let ecka = ingredientsArr.reduce((sum, ing) => {
    let normIng = removeDiacritics(ing)

    let listed = __getListedE(ingredientsArr)

    let hits = Object.keys(eckaStriped).reduce((sum, eNum) => {
      let hit = __getLongestHitForE(normIng, eNum)
      return hit ? sum.concat(hit) : sum
    }, [])

    let filteredHits = []
    if (hits.length) {
      filteredHits = __filterInvalidHits(hits)
    }

    return sum.concat(filteredHits).concat(listed)
  }, [])

  let eckaUniq = new Set(ecka)

  return [...eckaUniq].sort()
}

module.exports = {
  ecka, eckaStriped, getAdditives
}
