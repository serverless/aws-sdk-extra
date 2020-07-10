const AWS = require('aws-sdk')
const disableDistribution = require('./disableDistribution')

module.exports = async (config, params = {}) => {
  const { distributionId } = params

  if (!distributionId) {
    throw new Error(`Missing "distributionId" param`)
  }
  const cf = new AWS.CloudFront(config)

  try {
    const getDistributionConfigRes = await cf
      .getDistributionConfig({ Id: distributionId })
      .promise()

    const deleteDistributionParams = { Id: distributionId, IfMatch: getDistributionConfigRes.ETag }
    await cf.deleteDistribution(deleteDistributionParams).promise()

    // todo remove distribtution dns
  } catch (e) {
    if (e.code === 'DistributionNotDisabled') {
      await disableDistribution(config, params)
    } else if (e.code === 'NoSuchDistribution') {
      return
    } else {
      throw e
    }
  }
}
