const debug = require('debug')('dev')
const fs = require('fs')
const OpenAPIBackend = require('openapi-backend').default
const addFormats = require('ajv-formats')
const { validationFailHandlerFailHandler,
    notFoundFailHandler,
    methodNotAllowedFailHandler,
    notImplementedFailHandler,
    postResponseHandler
} = require('./api-validators-factory')

function createOpenApiHandler() {
    
    const baseDir = (process.platform == 'win32') ? '..\\..\\..\\..\\api-spec' : __dirname + './../../../../api-spec/'
    const specFile = baseDir + 'quote-patrimonial-v1.5.0.yaml'

    const api = new OpenAPIBackend({
        definition: specFile, quick: true,
        customizeAjv: function (Ajv, AjvOpts, validationContext) {
            const originalAjv = Ajv

            addFormats(originalAjv)

            return originalAjv
        }
    })
    
    //api.register('postResponseHandler', postResponseHandler)
    api.register('validationFail', validationFailHandlerFailHandler)
    api.register('notImplemented', function (context, request, response) {
        const { status, mock } = context.api.mockResponseForOperation(
            context.operation.operationId
        )
        return response.status(status).json(mock)
    })
    api.register('methodNotAllowed', methodNotAllowedFailHandler)
    api.register('notFound', notFoundFailHandler)
    api.init()

    return api
}

module.exports = {
    createOpenApiHandler
}