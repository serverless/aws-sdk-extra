const deployCertificate = require('./deployCertificate')
const deployDistributionDns = require('./deployDistributionDns')
const addDomainToDistribution = require('./addDomainToDistribution')

module.exports = async (aws, params = {}) => {
  const { certificateArn, certificateStatus, domainHostedZoneId } = await deployCertificate(
    aws,
    params
  )

  params.certificateArn = certificateArn
  params.certificateStatus = certificateStatus
  params.domainHostedZoneId = domainHostedZoneId

  // cannot add domain to distribution unless it was finally issued
  if (certificateStatus === 'ISSUED') {
    const { distributionUrl } = await addDomainToDistribution(aws, params)

    params.distributionUrl = distributionUrl

    await deployDistributionDns(aws, params)
  }

  return {
    certificateArn,
    certificateStatus,
    domainHostedZoneId
  }
}
