const deleteRolePolicies = require('./deleteRolePolicies')

module.exports = async (aws, params = {}) => {
  const iam = new aws.IAM()

  try {
    await deleteRolePolicies(aws, params)

    await iam
      .deleteRole({
        RoleName: params.name
      })
      .promise()
  } catch (error) {
    if (error.code !== 'NoSuchEntity') {
      throw error
    }
  }
}
