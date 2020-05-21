module.exports = async (aws, params = {}) => {
  const { distributionId } = params

  if (!distributionId) {
    throw new Error(`Missing "distributionId" param`)
  }
  const cf = new aws.CloudFront()

  try {
    const getDistributionConfigRes = await cf
      .getDistributionConfig({ Id: distributionId })
      .promise()

    const deleteDistributionParams = { Id: distributionId, IfMatch: getDistributionConfigRes.ETag }
    await cf.deleteDistribution(deleteDistributionParams).promise()

    // todo remove distribtution dns
  } catch (e) {
    if (e.code === 'DistributionNotDisabled') {
      await aws.utils.disableDistribution(params)
    } else if (e.code === 'NoSuchDistribution') {
      return
    } else {
      throw e
    }
  }
}
