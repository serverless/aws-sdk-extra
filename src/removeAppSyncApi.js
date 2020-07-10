const AWS = require('aws-sdk')

module.exports = async (config, params = {}) => {
  const appSync = new AWS.AppSync(config)

  try {
    await appSync
      .deleteGraphqlApi({
        apiId: params.apiId
      })
      .promise()
  } catch (error) {
    if (error.code !== 'NotFoundException') {
      throw error
    }
  }
}
