const AdmZip = require('adm-zip')
const mergeDeep = require('merge-deep')
const { parseDomain } = require('parse-domain')

const sleep = async (wait) => new Promise((resolve) => setTimeout(() => resolve(), wait))

const getNakedDomain = (domain) => {
  const parsedDomain = parseDomain(domain)

  if (!parsedDomain.topLevelDomains) {
    throw new Error(`"${domain}" is not a valid domain.`)
  }

  const nakedDomain = `${parsedDomain.domain}.${parsedDomain.topLevelDomains.join('.')}`
  return nakedDomain
}

const shouldConfigureNakedDomain = (domain) => {
  if (!domain) {
    return false
  }
  if (domain.startsWith('www') && domain.split('.').length === 3) {
    return true
  }
  return false
}

const zip = (dirPath) => {
  const zipper = new AdmZip()

  zipper.addLocalFolder(dirPath)

  const zipFile = zipper.toBuffer()

  return zipFile
}

module.exports = { mergeDeep, sleep, zip, getNakedDomain, shouldConfigureNakedDomain }
