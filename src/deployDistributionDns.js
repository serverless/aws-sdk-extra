const getNakedDomain = ({ domain }) => {
  const domainParts = domain.split('.')
  const topLevelDomainPart = domainParts[domainParts.length - 1]
  const secondLevelDomainPart = domainParts[domainParts.length - 2]
  return `${secondLevelDomainPart}.${topLevelDomainPart}`
}

const getDomainHostedZoneId = async (aws, params = {}) => {
  const route53 = new aws.Route53()
  const hostedZonesRes = await route53.listHostedZonesByName().promise()

  const hostedZone = hostedZonesRes.HostedZones.find(
    // Name has a period at the end, so we're using includes rather than equals
    (zone) => zone.Name.includes(params.nakedDomain)
  )

  return hostedZone ? hostedZone.Id.replace('/hostedzone/', '') : null
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

module.exports = async (aws, params = {}) => {
  const { domain, distributionUrl } = params
  const nakedDomain = getNakedDomain(params)
  const domainHostedZoneId =
    params.domainHostedZoneId || (await getDomainHostedZoneId(aws, { nakedDomain }))

  const route53 = new aws.Route53()

  const dnsRecordParams = {
    HostedZoneId: domainHostedZoneId,
    ChangeBatch: {
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: domain,
            Type: 'A',
            AliasTarget: {
              HostedZoneId: 'Z2FDTNDATAQYW2', // this is a constant that you can get from here https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region
              DNSName: distributionUrl,
              EvaluateTargetHealth: false
            }
          }
        }
      ]
    }
  }

  if (shouldConfigureNakedDomain(domain)) {
    dnsRecordParams.ChangeBatch.Changes.push({
      Action: 'UPSERT',
      ResourceRecordSet: {
        Name: nakedDomain,
        Type: 'A',
        AliasTarget: {
          HostedZoneId: 'Z2FDTNDATAQYW2', // this is a constant that you can get from here https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region
          DNSName: distributionUrl,
          EvaluateTargetHealth: false
        }
      }
    })
  }

  return route53.changeResourceRecordSets(dnsRecordParams).promise()
}
