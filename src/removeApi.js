const AWS = require('aws-sdk')

module.exports = async (config, params = {}) => {
  const apig = new AWS.ApiGatewayV2(config)

  try {
    await apig
      .deleteApi({
        ApiId: params.apiId
      })
      .promise()
  } catch (error) {
    if (error.code !== 'NotFoundException') {
      throw error
    }
  }
}
