const debug = require('debug')('dev')
const express = require('express')
const helmet = require('helmet')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const awsServerlessExpress = require('aws-serverless-express')
const constroiRotasExpress = require('../interfaces-adapters/controllers/express-router-factory')
const { createOpenApiHandler } = require('../interfaces-adapters/controllers/openapi-handler')

const app = express()
const api_first_basepath = process.env.API_FIRST_BASEPATH || '/open-insurance/quote-patrimonial/v1'
const router = constroiRotasExpress(api_first_basepath)
const api = createOpenApiHandler()

if (process.env.DEBUG && process.env.DEBUG != "dev") {
    router.use(awsServerlessExpressMiddleware.eventContext())
}

app.use(api_first_basepath, router)
app.use('/', router)
router.use(function (request, response) {
    api.handleRequest(request, request, response)
})

// Helmet can help protect your app from some well-know web vulnerabilities
app.disable('x-powered-by')
// Reduce Fingerprinting
app.use(helmet())

const binaryMimeTypes = [
    'application/octet-stream',
    'font/eot',
    'font/opentype',
    'font/otf',
    'image/jpeg',
    'image/png',
    'image/svg+xml',
]

module.exports = {
    app: app,
    binaryMimeTypes: binaryMimeTypes,
    awsServerlessExpress: awsServerlessExpress
}
