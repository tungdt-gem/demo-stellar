'use strict'

const program = require('commander')
const wallet = require('./wallet')

// end with parse to parse through the input
program
  .version('0.0.1')

program
  .command('createAccount')
  .description('Create a new account')
  .action(wallet.createAccount)

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
