module.exports = async (aws, params = {}) => {
  const lambda = new aws.Lambda()

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
