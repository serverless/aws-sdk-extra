const AWS = require('aws-sdk')

module.exports = async (config, { roleName = null }) => {
  if (!roleName) {
    throw new Error(`Missing "roleName" param.`)
  }

  const iam = new AWS.IAM(config)

  /**
   * First, fetch the IAM Role because we need to get the PolicyARN to do more
   */

  const getRoleWrapper = () => {
    return iam.getRole({ RoleName: roleName }).promise()
      .then((result) => {
        return result.Role;
      })
      .catch((error) => {
        if (error.code === 'NoSuchEntity' || error.message.includes('cannot be found')) {
          return null;
        }
        throw error;
      })
  }


  const listRolePoliciesWrapper = () => {
    return iam.listRolePolicies({ RoleName: roleName }).promise()
      .then((result) => {
        return result.PolicyNames || [];
      })
      .catch((error) => {
        if (error.code === 'NoSuchEntity' || error.message.includes('cannot be found')) {
          return [];
        }
        throw error;
      })
  }

  const listAttachedRolePoliciesWrapper = () => {
    return iam.listAttachedRolePolicies({ RoleName: roleName }).promise()
      .then((result) => {
        return result.AttachedPolicies || [];
      })
      .catch((error) => {
        if (error.code === 'NoSuchEntity' || error.message.includes('cannot be found')) {
          return [];
        }
        throw error;
      })
  }

  const results = await Promise.all([
    getRoleWrapper(),
    listRolePoliciesWrapper(),
    listAttachedRolePoliciesWrapper(),
  ]);

  const result = {}
  result.Role = results[0];
  result.RoleInlinePolicies = results[1];
  result.RoleAttachedPolicies = results[2];

  /**
   * Fetch each inline role policy.  
   * The policy documents are included in the response (thankfully!).
   */

  const inlinePolicyPromises = []
  result.RoleInlinePolicies.forEach((policyName) => {

    const wrapper = () => {
      return iam.getRolePolicy({
        PolicyName: policyName,
        RoleName: roleName,
      }).promise()
        .then((result) => {
          return result
        })
        .catch((error) => {
          if (error.code === 'NoSuchEntity' || error.message.includes('cannot be found')) {
            return null;
          }
          throw error;
        })
    }

    inlinePolicyPromises.push(wrapper())
  });

  /**
   * Fetch each managed policy attached to the role,
   * also fetch their policy statements which is 
   * (yet another) API call.
   * 
   * The policy statements are versioned.  Whatever
   * is set as the Default Version Id is the in use
   * version.
   */

  const managedPolicyPromises = []
  result.RoleAttachedPolicies.forEach((policy) => {

    const wrapper = () => {
      return iam.getPolicy({
        PolicyArn: policy.PolicyArn
      }).promise()
        .then(async (result) => {
          result = result.Policy
          // Try to fetch the policy statements, which are in a Policy Version
          // the "DefaultVersionId" is the current active Policy Version
          try {
            result.PolicyVersion = await iam.getPolicyVersion({
              PolicyArn: policy.PolicyArn,
              VersionId: result.DefaultVersionId
            }).promise()
          } catch (error) {
            if (error.code === 'NoSuchEntity' || error.message.includes('cannot be found')) { }
            throw error;
          }
          return result
        })
        .catch((error) => {
          if (error.code === 'NoSuchEntity' || error.message.includes('cannot be found')) {
            return null;
          }
          throw error;
        })
    }

    managedPolicyPromises.push(wrapper())
  });

  // Update result with actual policies
  result.RoleInlinePolicies = await Promise.all(inlinePolicyPromises);
  result.RoleAttachedPolicies = await Promise.all(managedPolicyPromises);

  // Ensure there are no null results
  result.RoleInlinePolicies = result.RoleInlinePolicies.filter((policy) => { return policy ? true : false })
  result.RoleAttachedPolicies = result.RoleAttachedPolicies.filter((policy) => { return policy ? true : false })

  // Return
  return result;
}
