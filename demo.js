'use strict'

const program = require('commander')
const wallet = require('./wallet')

// end with parse to parse through the input
program
  .version('0.0.1')

program
  .command('createAccount')
  .description('Create a new account')
  .action(wallet.createAccountFromMaster)

program
  .command('createChannel')
  .description('Create a new account from channel')
  .action(wallet.createChannel)

program
  .command('setSigningKey')
  .description('Set a new signing key')
  .action(wallet.setSigningKey)

program
  .command('createTrust')
  .description('Create trustline')
  .action(wallet.createTrust)

program
  .command('createAsset')
  .description('Create asset')
  .action(wallet.createAsset)

program
  .command('allowTrust')
  .description('Allow distributor trust asset')
  .action(wallet.allowTrust)

program
  .command('transferMoney <source_seed> <amount> <destination_public> [memo]')
  .description('transfer money to another account')
  .action(wallet.transferMoney)

program
  .command('withdrawMoney')
  .description('Withdraw money')
  .action(wallet.withdrawMoney)

program
  .command('getBalance <account>')
  .description('Get balance from account')
  .action(wallet.getBalance)

program.parse(process.argv)
