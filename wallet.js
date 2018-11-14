'use strict'

const stellar = require('stellar-sdk')
const request = require('request')
const logger = require('./logger')

const localServer = new stellar.Server('http://localhost:8000', { allowHttp: true })
const testnetServer = new stellar.Server('https://horizon-testnet.stellar.org')
stellar.Network.useTestNetwork()

let createAccount = () => {
  logger.info('Start create account')
  let pair = stellar.Keypair.random()

  logger.info(
    'Account created',
    '\n - secret: ', pair.secret(),
    '\n - public_key: ', pair.publicKey()
  )

  // Request luments for test account
  logger.info(
    'Start request luments'
  )

  const checkBalance = () => {
    return getBalance(pair.publicKey())
      .catch(stellar.NotFoundError, checkBalance)
      .then(() => {
        logger.info('Done!')
      })
  }

  request.get({
    url: 'https://friendbot.stellar.org',
    qs: { addr: pair.publicKey() },
    json: true
  }, function (error, response, body) {
    if (error || response.statusCode !== 200) {
      logger.error('ERROR!', error || body)
    } else {
      logger.info('SUCCESS! Luments already distributed :)\n')
      logger.debug(JSON.stringify(body, null, 2))
      return checkBalance()
    }
  })
}

const getBalance = (accountPublicKey) => {
  return localServer.loadAccount(accountPublicKey).then(function (account) {
    logger.info('Balance for account: ', accountPublicKey)
    account.balances.forEach(balance => {
      logger.info('Type: ', balance.asset_type, ', Balance: ', balance.balance)
    })

    return account
  })
}

const transferMoney = (sourceSecret, amount, destination, memo) => {
  logger.info('Start transfer money')
  logger.info('Transfer from ', sourceSecret, ' amount ', amount, ' XLM to ', destination, 'memo: ', memo)

  const sourceKeys = stellar.Keypair.fromSecret(sourceSecret)

  var sourceBalance
  getBalance(destination)
    .catch(stellar.NotFoundError, error => {
      logger.debug(error)
      throw new Error('Destination account not exist')
    })
    .then(() => {
      return getBalance(sourceKeys.publicKey())
    })
    .catch(stellar.NotFoundError, error => {
      logger.debug(error)
      throw new Error('Source account not exist: ', sourceKeys.publicKey())
    })
    .then((sourceAccount) => {
      sourceBalance = retrieveBalance(sourceAccount, 'native')

      logger.info('Build and submit transaction...')
      logger.debug('Source account: ', JSON.stringify(sourceAccount))
      logger.info('Source balance before transfer: ', sourceBalance)
      const transaction = new stellar.TransactionBuilder(sourceAccount)
        .addOperation(stellar.Operation.payment({
          destination: destination,
          asset: stellar.Asset.native(),
          amount: amount
        }))
        .addMemo(stellar.Memo.text(memo))
        .build()

      transaction.sign(sourceKeys)

      logger.debug('Transaction builded: ', JSON.stringify(transaction))
      return testnetServer.submitTransaction(transaction)
    })
    .then(result => {
      logger.info('Transfer success! Results:', JSON.stringify(result, null, 2))

      logger.info('Retrieve source balance and destination balance')

      const checkBalance = (account) => {
        if (retrieveBalance(account, stellar.Asset.native()) == sourceBalance) {
          return getBalance(account.account_id).then(checkBalance)
        } else {
          return account
        }
      }

      const getSourceBalancePromise = getBalance(sourceKeys.publicKey())
        .then(checkBalance)
      return Promise.all([getSourceBalancePromise, getBalance(destination)])
    })
    .then(() => {
      logger.info('Done!')
    })
    .catch(error => {
      logger.error('Something went wrong', error)
    })
}

const retrieveBalance = (account, assetType) => {
  let result = account.balances.find(balance => {
    return balance.asset_type === assetType
  })

  if (result === undefined) {
    return 0
  }

  return parseFloat(result.balance)
}

const withdrawMoney = () => {
  logger.info('Start withdraw')
}

module.exports = {
  createAccount,
  transferMoney,
  withdrawMoney,
  getBalance
}
