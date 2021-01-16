const AWS = require('aws-sdk')
const { sleep } = require('./utils')
const getTempCredentials = require('./getTempCredentials')

const accountCreation = async (config, params) => {
  const organizations = new AWS.Organizations(config)

  const describeCreateAccountStatusParams = {
    CreateAccountRequestId: params.accountCreationId
  }

  const describeCreateAccountStatusRes = await organizations
    .describeCreateAccountStatus(describeCreateAccountStatusParams)
    .promise()

  if (
    !describeCreateAccountStatusRes.CreateAccountStatus ||
    !describeCreateAccountStatusRes.CreateAccountStatus.State ||
    describeCreateAccountStatusRes.CreateAccountStatus.State === 'IN_PROGRESS'
  ) {
    await sleep(1000)
    return accountCreation(config, params)
  }

  if (describeCreateAccountStatusRes.CreateAccountStatus.State === 'FAILED') {
    throw new Error(
      `Account creation failed due to: ${describeCreateAccountStatusRes.CreateAccountStatus.FailureReason}`
    )
  }

  return { accountId: describeCreateAccountStatusRes.CreateAccountStatus.AccountId }
}

module.exports = async (config, params) => {
  const organizations = new AWS.Organizations(config)

  params.roleName = params.roleName || 'ServerlessInc'

  if (!params.accountId) {
    if (!params.accountEmail) {
      throw new Error(`Missing "accountEmail" param.`)
    }

    if (!params.accountName) {
      throw new Error(`Missing "accountName" param.`)
    }

    var createAccountParams = {
      AccountName: params.accountName,
      Email: params.accountEmail,
      RoleName: params.roleName
    }

    const {
      CreateAccountStatus: { Id }
    } = await organizations.createAccount(createAccountParams).promise()

    const accountCreationParams = {
      accountCreationId: Id
    }

    params.accountId = await accountCreation(config, accountCreationParams)
  }

  return {
    accountId: params.accountId,
    credentials: await getTempCredentials(config, params)
  }
}
