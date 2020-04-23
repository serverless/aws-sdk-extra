const { getNakedDomain, shouldConfigureNakedDomain } = require('./utils')
const getDomainHostedZoneId = require('./getDomainHostedZoneId')

module.exports = async (aws, params = {}) => {
  params.log = params.log || (() => {})
  const { log } = params
  const { domain, distributionUrl } = params
  const nakedDomain = getNakedDomain(domain)
  const domainHostedZoneId = params.domainHostedZoneId || (await getDomainHostedZoneId(aws, params))

  const route53 = new aws.Route53()

  log(`Configuring DNS records for domain "${domain}"`)

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
    log(`Configuring DNS records for domain "${nakedDomain}"`)
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

  await route53.changeResourceRecordSets(dnsRecordParams).promise()

  return { domainHostedZoneId }
}
