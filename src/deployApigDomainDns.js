const AWS = require('aws-sdk')
const getDomainHostedZoneId = require('./getDomainHostedZoneId')

module.exports = async (config, params = {}) => {
  params.log = params.log || (() => { })
  const { log, domain, apigatewayHostedZoneId, apigatewayDomainName } = params
  const domainHostedZoneId = params.domainHostedZoneId || (await getDomainHostedZoneId(config, params))

  const route53 = new AWS.Route53(config)

  log(`Configuring Api Gateway DNS records for domain "${domain}"`)

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
              HostedZoneId: apigatewayHostedZoneId,
              DNSName: apigatewayDomainName,
              EvaluateTargetHealth: false
            }
          }
        }
      ]
    }
  }

  await route53.changeResourceRecordSets(dnsRecordParams).promise()

  return { domainHostedZoneId }
}
