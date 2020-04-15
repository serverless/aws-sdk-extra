module.exports = async (aws, params = {}) => {
  const route53 = new aws.Route53()
  const hostedZonesRes = await route53.listHostedZonesByName().promise()

  const hostedZone = hostedZonesRes.HostedZones.find(
    // Name has a period at the end, so we're using includes rather than equals
    (zone) => zone.Name.includes(params.nakedDomain)
  )

  return hostedZone ? hostedZone.Id.replace('/hostedzone/', '') : null
}
