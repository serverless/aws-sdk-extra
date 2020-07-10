const AWS = require('aws-sdk')
const { getNakedDomain, shouldConfigureNakedDomain } = require('./utils')
const getDomainHostedZoneId = require('./getDomainHostedZoneId')

module.exports = async (config, params = {}) => {
  params.log = params.log || (() => { })
  const { log } = params
  const { domain, distributionUrl } = params
  const nakedDomain = getNakedDomain(domain)
  const domainHostedZoneId = params.domainHostedZoneId || (await getDomainHostedZoneId(config, params))

  const route53 = new AWS.Route53(config)

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
