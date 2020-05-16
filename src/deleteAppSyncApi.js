module.exports = async (aws, params = {}) => {
  const appSync = new aws.AppSync()

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
