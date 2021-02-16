const listAllAwsRegions = require('./listAllAwsRegions')
const listAllCloudFormationStacksInARegion = require('./listAllCloudFormationStacksInARegion')

const listAllCloudFormationStacksInAllRegions = async (
  config,
  {
    regions,
    stackStatusFilter = null
  }) => {

  // Default to Stacks with an Active state, defined by these status values
  stackStatusFilter = stackStatusFilter || [
    'CREATE_COMPLETE',
    'UPDATE_COMPLETE',
    'ROLLBACK_COMPLETE',
    'IMPORT_COMPLETE',
    'IMPORT_ROLLBACK_COMPLETE',
  ]

  regions = regions || listAllAwsRegions()

  const allRegionalStacks = await Promise.all(regions.map((region) => {
    return listAllCloudFormationStacksInARegion(
      config,
      {
        stackStatusFilter,
        region
      }
    )
  }))

  return allRegionalStacks.flat()
}

module.exports = listAllCloudFormationStacksInAllRegions