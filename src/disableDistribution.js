module.exports = async (aws, params = {}) => {
  const { distributionId } = params
  if (!distributionId) {
    throw new Error(`Missing "distributionId" param`)
  }

  const deployDistributionParams = {
    distributionId,
    Enabled: false,
    Aliases: {
      Quantity: 0,
      Items: []
    }
  }

  return aws.utils.deployDistribution(deployDistributionParams)
}
