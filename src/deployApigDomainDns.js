const getDomainHostedZoneId = require('./getDomainHostedZoneId')

module.exports = async (aws, params = {}) => {
  params.log = params.log || (() => {})
  const { log, domain, apigatewayHostedZoneId, apigatewayDomainName } = params
  const domainHostedZoneId = params.domainHostedZoneId || (await getDomainHostedZoneId(aws, params))

  const route53 = new aws.Route53()

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
