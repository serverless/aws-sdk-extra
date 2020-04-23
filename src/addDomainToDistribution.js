const { getNakedDomain, shouldConfigureNakedDomain } = require('./utils')

module.exports = async (aws, params = {}) => {
  params.log = params.log || (() => {})
  const { log } = params
  const nakedDomain = getNakedDomain(params.domain)
  const cf = new aws.CloudFront()
  try {
    const updateDistributionParams = await cf
      .getDistributionConfig({ Id: params.distributionId })
      .promise()

    // 2. then add this property
    updateDistributionParams.IfMatch = updateDistributionParams.ETag

    // 3. then delete this property
    delete updateDistributionParams.ETag

    // 4. then set this property
    updateDistributionParams.Id = params.distributionId

    // 5. then make our changes
    updateDistributionParams.DistributionConfig.Enabled = true

    // add domain and certificate config if certificate is valid and ISSUED
    if (params.certificateStatus === 'ISSUED') {
      log(`Adding "${nakedDomain}" certificate to CloudFront distribution`)
      updateDistributionParams.DistributionConfig.ViewerCertificate = {
        ACMCertificateArn: params.certificateArn,
        SSLSupportMethod: 'sni-only',
        MinimumProtocolVersion: 'TLSv1.1_2016',
        Certificate: params.certificateArn,
        CertificateSource: 'acm'
      }

      log(`Adding domain "${params.domain}" to CloudFront distribution`)
      updateDistributionParams.DistributionConfig.Aliases = {
        Quantity: 1,
        Items: [params.domain]
      }

      if (shouldConfigureNakedDomain(params.domain)) {
        log(`Adding domain "${nakedDomain}" to CloudFront distribution`)
        updateDistributionParams.DistributionConfig.Aliases.Quantity = 2
        updateDistributionParams.DistributionConfig.Aliases.Items.push(nakedDomain)
      }
    }
    // 6. then finally update!
    const res = await cf.updateDistribution(updateDistributionParams).promise()

    return {
      distributionId: res.Distribution.Id,
      distributionArn: res.Distribution.ARN,
      distributionUrl: res.Distribution.DomainName
    }
  } catch (e) {
    if (e.message.includes('One or more of the CNAMEs')) {
      throw new Error(
        `The domain "${params.domain}" is already in use by another website or CloudFront Distribution.`
      )
    }

    throw e
  }
}
