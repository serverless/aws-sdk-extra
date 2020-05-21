const AdmZip = require('adm-zip')
const mergeDeep = require('merge-deep')

const sleep = async (wait) => new Promise((resolve) => setTimeout(() => resolve(), wait))

const getNakedDomain = (domain) => {
  const domainParts = domain.split('.')
  const topLevelDomainPart = domainParts[domainParts.length - 1]
  const secondLevelDomainPart = domainParts[domainParts.length - 2]
  return `${secondLevelDomainPart}.${topLevelDomainPart}`
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
