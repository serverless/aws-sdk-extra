const AWS = require('aws-sdk')

module.exports = async (config, params = {}) => {
  const lambda = new AWS.Lambda(config)

  // todo should we return if no lambdaName param
  try {
    await lambda
      .deleteFunction({
        FunctionName: params.lambdaName
      })
      .promise()
  } catch (error) {
    if (error.code !== 'ResourceNotFoundException') {
      throw error
    }
  }
}
