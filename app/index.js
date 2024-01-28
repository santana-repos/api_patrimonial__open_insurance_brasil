const { handler } = require('./src')
const debug = require('debug')('dev')

debug('ENV VARS carregadas:::', process.env)

exports.handler = handler