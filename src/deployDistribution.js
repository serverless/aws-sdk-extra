const { mergeDeep } = require('./utils')

const createDistribution = async (aws, params = {}) => {
  const cf = new aws.CloudFront()

  delete params.distributionId

  params.Enabled = params.Enabled || true
  params.Comment = params.Comment || ''
  params.CallerReference = params.CallerReference || String(Date.now())

  const createDistributionParams = {
    DistributionConfig: { ...params }
  }

  if (params.certificateStatus === 'ISSUED') {
    createDistributionParams.DistributionConfig.Aliases = {
      Quantity: 1,
      Items: [params.domain]
    }
    createDistributionParams.DistributionConfig.ViewerCertificate = {
      ACMCertificateArn: params.certificateArn,
      SSLSupportMethod: 'sni-only',
      MinimumProtocolVersion: 'TLSv1.1_2016',
      Certificate: params.certificateArn,
      CertificateSource: 'acm'
    }
  }

  delete createDistributionParams.DistributionConfig.domain
  delete createDistributionParams.DistributionConfig.certificateArn
  delete createDistributionParams.DistributionConfig.certificateStatus
  delete createDistributionParams.DistributionConfig.domainHostedZoneId

  const res = await cf.createDistribution(createDistributionParams).promise()

  return {
    distributionId: res.Distribution.Id,
    distributionArn: res.Distribution.ARN,
    distributionUrl: res.Distribution.DomainName
  }
}

const updateDistribution = async (aws, params = {}) => {
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
    updateDistributionParams.DistributionConfig.Enabled = params.Enabled === false ? false : true

    if (params.certificateStatus === 'ISSUED') {
      updateDistributionParams.DistributionConfig.Aliases = {
        Quantity: 1,
        Items: [params.domain]
      }
      updateDistributionParams.DistributionConfig.ViewerCertificate = {
        ACMCertificateArn: params.certificateArn,
        SSLSupportMethod: 'sni-only',
        MinimumProtocolVersion: 'TLSv1.1_2016',
        Certificate: params.certificateArn,
        CertificateSource: 'acm'
      }
    }

    // these cannot exist in an update operation
    delete params.Origins
    delete params.CallerReference

    // todo this might not scale
    updateDistributionParams.DistributionConfig = mergeDeep(
      updateDistributionParams.DistributionConfig,
      params
    )

    // make sure aliases match the definition
    // deep merging causes a mix
    if (!params.domain) {
      updateDistributionParams.DistributionConfig.Aliases = params.Aliases
    }

    // these are invalid CF parameters
    delete updateDistributionParams.DistributionConfig.distributionId
    delete updateDistributionParams.DistributionConfig.domain
    delete updateDistributionParams.DistributionConfig.certificateArn
    delete updateDistributionParams.DistributionConfig.certificateStatus
    delete updateDistributionParams.DistributionConfig.domainHostedZoneId

    // 6. then finally update!
    const res = await cf.updateDistribution(updateDistributionParams).promise()

    return {
      distributionId: res.Distribution.Id,
      distributionArn: res.Distribution.ARN,
      distributionUrl: res.Distribution.DomainName
    }
  } catch (e) {
    if (e.code === 'NoSuchDistribution') {
      const res = await createDistribution(aws, params)
      return res
    }
    throw e
  }
}

module.exports = async (aws, params = {}) => {
  const { domain } = params

  if (domain) {
    const deployCertificateParams = {
      domain
    }

    const res = await aws.utils.deployCertificate(deployCertificateParams)
    params.certificateArn = res.certificateArn // eslint-disable-line
    params.domainHostedZoneId = res.domainHostedZoneId // eslint-disable-line
    params.certificateStatus = res.certificateStatus // eslint-disable-line
  }

  let distribution
  if (params.distributionId) {
    distribution = await updateDistribution(aws, params)
  } else {
    distribution = await createDistribution(aws, params)
  }

  if (domain) {
    const deployDistributionDnsParams = {
      domain,
      distributionUrl: distribution.distributionUrl,
      domainHostedZoneId: params.domainHostedZoneId
    }

    await aws.utils.deployDistributionDns(deployDistributionDnsParams)

    distribution.certificateArn = params.certificateArn
    distribution.certificateStatus = params.certificateStatus
    distribution.certificateStatus = params.certificateStatus
  }

  return distribution
}
