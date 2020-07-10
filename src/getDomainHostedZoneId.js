const AWS = require('aws-sdk')
const { getNakedDomain } = require('./utils')

module.exports = async (config, params = {}) => {
  params.log = params.log || (() => { })
  const { log } = params
  const nakedDomain = getNakedDomain(params.domain)
  const route53 = new AWS.Route53(config)

  log(`Fetching the Hosted Zone ID for domain "${nakedDomain}"`)
  const hostedZonesRes = await route53.listHostedZonesByName().promise()

  const hostedZone = hostedZonesRes.HostedZones.find(
    // Name has a period at the end, so we're using includes rather than equals
    (zone) => zone.Name.includes(nakedDomain)
  )

  const domainHostedZoneId = hostedZone ? hostedZone.Id.replace('/hostedzone/', '') : null

  return { domainHostedZoneId }
}
