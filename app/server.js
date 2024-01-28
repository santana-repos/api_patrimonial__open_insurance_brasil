const { startServer } = require('./src')
const debug = require('debug')('dev')

debug('ENV VARS carregadas:::', process.env)

startServer()