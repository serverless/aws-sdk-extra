const AWS = require('aws-sdk')
const listAllAwsRegions = require('./listAllAwsRegions')
const listAllCloudFormationStacksInARegion = require('./listAllCloudFormationStacksInARegion')

const listAllCloudFormationStacksInAllRegions = async (
  config,
  {
    stackStatusFilter = null
  },
  stacks = []) => {

  // Default to Stacks with an Active state, defined by these status values
  stackStatusFilter = stackStatusFilter || [
    'CREATE_COMPLETE',
    'UPDATE_COMPLETE',
    'ROLLBACK_COMPLETE',
    'IMPORT_COMPLETE',
    'IMPORT_ROLLBACK_COMPLETE',
  ]

  const regions = listAllAwsRegions()

  const listAll = Promise.all(regions.map((region) => {
    return listAllCloudFormationStacksInARegion(
      this.config,
      { region }
    )
  }))

  const allRegionalStacks = await listAll()

  return allRegionalStacks
}

module.exports = listAllCloudFormationStacksInAllRegions