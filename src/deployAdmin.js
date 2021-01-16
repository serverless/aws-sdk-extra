const AWS = require('aws-sdk')

module.exports = async (config, params) => {
  const iam = new AWS.IAM(config)
  const sts = new AWS.STS(config)

  // todo maybe
  if (!params.username) {
    throw new Error(`Missing "username" param`)
  }

  params.password =
    params.password ||
    Math.random()
      .toString(36)
      .substring(10)

  const { Account } = await sts.getCallerIdentity({}).promise()

  const admin = {
    accountId: Account,
    username: params.username,
    password: params.password,
    loginUrl: `https://${Account}.signin.aws.amazon.com/console`
  }

  try {
    const createUserParams = {
      UserName: params.username
    }
    await iam.createUser(createUserParams).promise()

    const attachUserPolicyParams = {
      UserName: params.username,
      PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess'
    }

    await iam.attachUserPolicy(attachUserPolicyParams).promise()

    const createLoginProfileParams = {
      UserName: params.username,
      Password: params.password, // todo auto create password
      PasswordResetRequired: false
    }

    await iam.createLoginProfile(createLoginProfileParams).promise()

    const createAccessKeyParams = {
      UserName: params.username
    }

    const createAccessKeyRes = await iam.createAccessKey(createAccessKeyParams).promise()
    admin.accessKeyId = createAccessKeyRes.AccessKey.AccessKeyId
    admin.secretAccessKey = createAccessKeyRes.AccessKey.SecretAccessKey
  } catch (e) {
    if (e.code !== 'EntityAlreadyExists') {
      throw e
    }
  }

  return admin
}
