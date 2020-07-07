const removeRolePolicies = require('./removeRolePolicies')

module.exports = async (aws, params = {}) => {
  const iam = new aws.IAM()

  try {
    await removeRolePolicies(aws, params)

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
