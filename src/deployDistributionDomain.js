const deployCertificate = require('./deployCertificate')
const deployDistributionDns = require('./deployDistributionDns')
const addDomainToDistribution = require('./addDomainToDistribution')

module.exports = async (config, params = {}) => {
  const { certificateArn, certificateStatus, domainHostedZoneId } = await deployCertificate(
    config,
    params
  )

  params.certificateArn = certificateArn
  params.certificateStatus = certificateStatus
  params.domainHostedZoneId = domainHostedZoneId

  // cannot add domain to distribution unless it was finally issued
  if (certificateStatus === 'ISSUED') {
    const { distributionUrl } = await addDomainToDistribution(config, params)

    params.distributionUrl = distributionUrl

    await deployDistributionDns(config, params)
  }

  return {
    certificateArn,
    certificateStatus,
    domainHostedZoneId
  }
}
