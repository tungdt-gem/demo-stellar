'use strict'

const winston = require('winston')

const myFormat = winston.format.printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`
})

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    myFormat
  )
})

logger.level = 'debug'

const wrapper = (original) => {
  return (...args) => original(args.join(' '))
}

logger.error = wrapper(logger.error)
logger.warn = wrapper(logger.warn)
logger.info = wrapper(logger.info)
logger.verbose = wrapper(logger.verbose)
logger.debug = wrapper(logger.debug)
logger.silly = wrapper(logger.silly)

module.exports = logger
