const deployDistribution = require('./deployDistribution')

module.exports = async (config, params = {}) => {
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

  return deployDistribution(config, deployDistributionParams)
}
