module.exports = async (aws, params = {}) => {
  const iam = new aws.IAM()

  const { AttachedPolicies: managedPolicies } = await iam
    .listAttachedRolePolicies({
      RoleName: params.name
    })
    .promise()
  const { PolicyNames: inlinePoliciesNames } = await iam
    .listRolePolicies({
      RoleName: params.name
    })
    .promise()

  const promises = []

  // clear managed policies
  for (const managedPolicy of managedPolicies) {
    const detachRolePolicyParams = {
      PolicyArn: managedPolicy.PolicyArn,
      RoleName: params.name
    }

    promises.push(iam.detachRolePolicy(detachRolePolicyParams).promise())
  }

  // clear inline policies
  for (const inlinePolicyName of inlinePoliciesNames) {
    const deleteRolePolicyParams = {
      PolicyName: inlinePolicyName,
      RoleName: params.name
    }

    promises.push(iam.deleteRolePolicy(deleteRolePolicyParams).promise())
  }

  await Promise.all(promises)
}
