const AWS = require('aws-sdk')

module.exports = async (config, params = {}) => {
  const iam = new AWS.IAM(config)

  const { AttachedPolicies: managedPolicies } = await iam
    .listAttachedRolePolicies({
      RoleName: params.roleName
    })
    .promise()
  const { PolicyNames: inlinePoliciesNames } = await iam
    .listRolePolicies({
      RoleName: params.roleName
    })
    .promise()

  const promises = []

  // clear managed policies
  for (const managedPolicy of managedPolicies) {
    const detachRolePolicyParams = {
      PolicyArn: managedPolicy.PolicyArn,
      RoleName: params.roleName
    }

    promises.push(iam.detachRolePolicy(detachRolePolicyParams).promise())
  }

  // clear inline policies
  for (const inlinePolicyName of inlinePoliciesNames) {
    const deleteRolePolicyParams = {
      PolicyName: inlinePolicyName,
      RoleName: params.roleName
    }

    promises.push(iam.deleteRolePolicy(deleteRolePolicyParams).promise())
  }

  await Promise.all(promises)
}
