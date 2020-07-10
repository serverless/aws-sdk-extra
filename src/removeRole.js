const AWS = require('aws-sdk')
const removeRolePolicies = require('./removeRolePolicies')

module.exports = async (config, params = {}) => {
  const iam = new AWS.IAM(config)

  try {
    await removeRolePolicies(config, params)
  } catch (error) {
    if (error.code !== 'NoSuchEntity') {
      throw error
    }
  }

  try {
    await iam
      .deleteRole({
        RoleName: params.roleName
      })
      .promise()
  } catch (error) {
    if (error.code !== 'NoSuchEntity') {
      throw error
    }
  }
}
