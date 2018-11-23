'use strict'

const stellar = require('stellar-sdk')
const StellarSdk = require('stellar-sdk')
const request = require('request')
const logger = require('./logger')

const localServer = new stellar.Server('http://localhost:8000', { allowHttp: true })
const testnetServer = new stellar.Server('https://horizon-testnet.stellar.org')
stellar.Network.useTestNetwork()

let sourceAccId, sequenceNumber = -99
let currentIndexChannel = 0;
let channelAccounts = []

let createAccountFromChannel = (req, res) => {

  console.log(req.query.sourceAccountChannel)
  res.json(1)

  StellarSdk.Network.use(new StellarSdk.Network('Standalone Network ; Nov 2018'))
  let stellarServer = new StellarSdk.Server('http://127.0.0.1:8000', {allowHttp: true})

  const desKey = StellarSdk.Keypair.random()
  const sourceKey = StellarSdk.Keypair.master()
  channelAccounts.push(StellarSdk.Keypair.fromSecret(secretChannelKey[currentIndexChannel]))

  console.log('des', desKey.publicKey())
  console.log('channel', channelAccounts[++currentIndexChannel].publicKey())
  if (currentIndexChannel > channelAccounts.length - 1) {
    currentIndexChannel = 0
  }

  stellarServer
    .loadAccount(channelAccounts[0].publicKey())
    .then(chAccount => {
      console.log('account', chAccount)
      let transaction =
        new StellarSdk.TransactionBuilder(chAccount)
          .addOperation(
            StellarSdk.Operation.createAccount({
              source: sourceKey.publicKey(),
              destination: desKey.publicKey(),
              startingBalance: "1000"
            })
          )
          .build();

      transaction.sign(sourceKey);   // base account must sign to approve the payment
      transaction.sign(channelAccounts[0]);  // channel must sign to approve it being the source of the transaction

      return stellarServer.submitTransaction(transaction)
    })
    .then(result => {
      console.log("success" + JSON.stringify(result, undefined, 2));
    })
    .catch(error => {
      if (error.response && error.response.data && error.response.data.extras) {
        console.log('------', error.response.data.extras)
      }
      else console.log('error', error)
    });
}

let createAccountFromMaster = (res) => {
  let urls = ['http://172.16.10.45:8000', 'http://172.16.10.46:8000', 'http://172.16.10.47:8000']

  StellarSdk.Network.use(new StellarSdk.Network('Standalone Network ; Nov 2018'))
  // StellarSdk.Network.useTestNetwork()

  // let stellarServer = new StellarSdk.Server('http://172.16.10.45:8000', { allowHttp: true })
  // let stellarServer = new StellarSdk.Server(urls[getRandomInt(0, urls.length - 1)], {allowHttp: true})
  let stellarServer = new StellarSdk.Server('http://127.0.0.1:8000', {allowHttp: true})

  // var sourceKey = StellarSdk.Keypair
  //   .fromSecret('SBLX3SFXPQGIH5BUBXEQ4NUODMD4O2YWUBQMTKSQPXQ2WPJQJ6D4NXQL');
  const desKey = StellarSdk.Keypair.random();
  const sourceKey = StellarSdk.Keypair.master()

  // console.log("des:", desKey.publicKey())
  console.log(desKey.secret())
  // console.log("source:", sourceKey.publicKey())

  let currentSeq

  stellarServer
    .loadAccount(sourceKey.publicKey())
    .then(sourceAccount => {
      if (sequenceNumber === -99)
        sequenceNumber = parseInt(sourceAccount.sequenceNumber()) - 1
      if (!sourceAccId)
        sourceAccId = sourceAccount.accountId()

      sequenceNumber += 1
      const account = new StellarSdk.Account(sourceAccId, sequenceNumber.toString());
      currentSeq = sequenceNumber.toString()

      let transaction = new StellarSdk.TransactionBuilder(sourceAccount)
        .addOperation(
          StellarSdk.Operation.createAccount({
            destination: desKey.publicKey(),
            startingBalance: "1000"
          })
        )
        .build();
      transaction.sign(sourceKey);
      return stellarServer.submitTransaction(transaction);
    })
    .then(result => {
      // console.log("success" + JSON.stringify(result, undefined, 2));
      res.json("success")
    })
    .catch(error => {
      if (error.response && error.response.data && error.response.data.extras) {
        if (error.response.data.extras.result_codes && error.response.data.extras.result_codes.transaction === 'tx_bad_seq')
          console.log(stellarServer.serverURL + " " + currentSeq)
        console.log('------', error.response.data.extras)
      }
      else console.log('error', error)
      res.status(400);
      res.send('fail');
    });
}

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

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  createAccount,
  transferMoney,
  withdrawMoney,
  getBalance,
  createAccountFromMaster,
  createAccountFromChannel
}
