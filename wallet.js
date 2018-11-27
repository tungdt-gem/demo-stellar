'use strict'

const stellar = require('stellar-sdk')
const StellarSdk = require('stellar-sdk')
const request = require('request')
const logger = require('./logger')
let fs = require('fs');

// const localServer = new stellar.Server('http://localhost:8000', { allowHttp: true })
// const testnetServer = new stellar.Server('https://horizon-testnet.stellar.org')
// stellar.Network.useTestNetwork()

let urls = ['http://172.16.10.45:8000', 'http://172.16.10.46:8000', 'http://172.16.10.47:8000']

StellarSdk.Network.use(new StellarSdk.Network('Standalone Network ; Nov 2018'))
// StellarSdk.Network.useTestNetwork()

// let stellarServer = new StellarSdk.Server('http://172.16.10.45:8000', { allowHttp: true })
let stellarServer = new StellarSdk.Server('http://127.0.0.1:8000', {allowHttp: true})

let sourceAccId, sequenceNumber = -99

let createAccountFromChannel = (req, res) => {
  let stellarServer = new StellarSdk.Server(urls[getRandomInt(0, urls.length - 1)], {allowHttp: true})

  const desKey = StellarSdk.Keypair.random()
  const sourceKey = StellarSdk.Keypair.master()
  const channelAccountKey = StellarSdk.Keypair.fromSecret(req.query.sourceAccountChannel)


  stellarServer
    .loadAccount(channelAccountKey.publicKey())
    .then(chAccount => {
      // console.log(chAccount)
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
      transaction.sign(channelAccountKey);  // channel must sign to approve it being the source of the transaction

      return stellarServer.submitTransaction(transaction)
    })
    .then(result => {
      // console.log("success" + JSON.stringify(result, undefined, 2));
      res.json(result)
    })
    .catch(error => {
      if (error.response && error.response.data && error.response.data.extras) {
        console.log('------', error.response.data.extras)
      }
      else console.log('error', error)
      res.status(400);
      res.send('error');
    });
}

let allowTrust = (res) => {
  const sourceKey = StellarSdk.Keypair.fromSecret('SCRK7RHGT23SM2BFTD3DG7R23F7SNKFHVQIUSYM43VPGJ7MGE3AFWSFQ')

  stellarServer
    .loadAccount(sourceKey.publicKey())
    .then(sourceAccount => {
      let transaction = new StellarSdk.TransactionBuilder(sourceAccount)
        .addOperation(
          StellarSdk.Operation.allowTrust({
            trustor: 'GD7NQ47MQRRTDCBPFHI57FEUJD6YO62CVTKW33ABQQ6VORHPSCUUXEXL',
            assetCode: 'VND',
            authorize: false
          })
        )
        .build();
      transaction.sign(sourceKey);
      return stellarServer.submitTransaction(transaction);
    })
    .then(result => {
      console.log("success" + JSON.stringify(result, undefined, 2));
      res.json(result)
    })
    .catch(error => {
      console.log(error.response.data)
      res.status(400);
      res.send('error');
    });

}

let createAsset = (res) => {
  const sourceKey = StellarSdk.Keypair.fromSecret('SCRK7RHGT23SM2BFTD3DG7R23F7SNKFHVQIUSYM43VPGJ7MGE3AFWSFQ')

  stellarServer
    .loadAccount(sourceKey.publicKey())
    .then(sourceAccount => {
      let transaction = new StellarSdk.TransactionBuilder(sourceAccount)
        .addOperation(
          StellarSdk.Operation.payment({
            destination: 'GD7NQ47MQRRTDCBPFHI57FEUJD6YO62CVTKW33ABQQ6VORHPSCUUXEXL',
            asset: new StellarSdk.Asset('VND', 'GB2JGTBVUBPWT5CWD2HMQL3IN73RLSFIABK73ZGI52EKPVPT6LVUBBYB'),
            amount: '100'
          })
        )
        .build();
      transaction.sign(sourceKey);
      return stellarServer.submitTransaction(transaction);
    })
    .then(result => {
      console.log("success" + JSON.stringify(result, undefined, 2));
      res.json(result)
    })
    .catch(error => {
      console.log(error)
      res.status(400);
      res.send('error');
    });

}

let createTrust = (res) => {
  const sourceKey = StellarSdk.Keypair.fromSecret('SAG3KTPIKRPLFLOCUVJ5J62X3C65MRTQSISUUJHRLJEQA3TNIVVK2VLP')

  stellarServer
    .loadAccount(sourceKey.publicKey())
    .then(sourceAccount => {
      let transaction = new StellarSdk.TransactionBuilder(sourceAccount)
        .addOperation(
          StellarSdk.Operation.changeTrust({
            asset: new StellarSdk.Asset('VND', 'GB2JGTBVUBPWT5CWD2HMQL3IN73RLSFIABK73ZGI52EKPVPT6LVUBBYB'),
            // limit: '100'
          })
        )
        .build();
      transaction.sign(sourceKey);
      return stellarServer.submitTransaction(transaction);
    })
    .then(result => {
      console.log("success" + JSON.stringify(result, undefined, 2));
      res.json(result)
    })
    .catch(error => {
      if (error.response && error.response.data && error.response.data.extras) {
        if (error.response.data.extras.result_codes && error.response.data.extras.result_codes.transaction === 'tx_bad_seq')
          console.log(stellarServer.serverURL + " " + currentSeq)
        console.log('------', error.response.data.extras)
      }
      else console.log('error', error)
      res.status(400);
      res.send('error');
    });

}

let setSigningKey = (res) => {
  // const sourceKey = StellarSdk.Keypair.master()
  const newSigner = StellarSdk.Keypair.random()
  const sourceKey = StellarSdk.Keypair.fromSecret('SCRK7RHGT23SM2BFTD3DG7R23F7SNKFHVQIUSYM43VPGJ7MGE3AFWSFQ')

  console.log('new signer', newSigner.publicKey() + ' ' + newSigner.secret())

  stellarServer
    .loadAccount(sourceKey.publicKey())
    .then(sourceAccount => {
      let transaction = new StellarSdk.TransactionBuilder(sourceAccount)
        .addOperation(
          StellarSdk.Operation.setOptions({
            // setFlags: StellarSdk.xdr.AccountFlags.authRevocableFlag().value | StellarSdk.xdr.AccountFlags.authRequiredFlag().value
            // homeDomain: 'DOMAIN/.well-known/stellar.toml'
            // masterWeight: 2,
            // lowThreshold: 2,
            // medThreshold: 2,
            // highThreshold: 3,
            // signer: {
            //   ed25519PublicKey: newSigner.publicKey(),
            //   weight: 2
            // }
          })
        )
        // .addOperation(
        //   StellarSdk.Operation.bumpSequence({
        //     bumpTo: '20',
        //   })
        // )
        .build();
      transaction.sign(sourceKey);
      return stellarServer.submitTransaction(transaction);
    })
    .then(result => {
      console.log("success" + JSON.stringify(result, undefined, 2));
      res.json(result)
    })
    .catch(error => {
      if (error.response && error.response.data && error.response.data.extras) {
        if (error.response.data.extras.result_codes && error.response.data.extras.result_codes.transaction === 'tx_bad_seq')
          console.log(stellarServer.serverURL + " " + currentSeq)
        console.log('------', error.response.data.extras)
      }
      else console.log('error', error)
      res.status(400);
      res.send('error');
    });
}

let createAccountFromMaster = (res) => {
  // let stellarServer = new StellarSdk.Server(urls[getRandomInt(0, urls.length - 1)], {allowHttp: true})

  const desKey = StellarSdk.Keypair.random();
  const sourceKey = StellarSdk.Keypair.master()

  console.log('des:', desKey.publicKey())
  console.log("source:", sourceKey.publicKey())

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

      let transaction = new StellarSdk.TransactionBuilder(account)
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
      console.log(desKey.secret())
      res.json(result)
      fs.appendFileSync('source-channel.csv', desKey.secret() + '\n');
    })
    .catch(error => {
      if (error.response && error.response.data && error.response.data.extras) {
        if (error.response.data.extras.result_codes && error.response.data.extras.result_codes.transaction === 'tx_bad_seq')
          console.log(stellarServer.serverURL + " " + currentSeq)
        console.log('------', error.response.data.extras)
      }
      else console.log('error', error)
      res.status(400);
      res.send('error');
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
  createAccountFromChannel,
  setSigningKey,
  createTrust,
  createAsset,
  allowTrust,
}
