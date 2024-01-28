function validationFailHandlerFailHandler(context, req, res) {
    return res.status(400).json({ status: 400, err: context.validation.errors })
}

function notFoundFailHandler(context, req, res) {
    // caso de chamada de endpoint invalida
    if (!context || !context.request || !context.request.params || !context.request.params.consentId) {
        return res.status(404).send()
    }

    const error = {}
    error.codigo = 404
    error.rotulo = 'Erro processamento cotacao'
    error.mesagem = `Dados nao encontrados para consentId: ${context.request.params.consentId}`

    return res.status(error.codigo).json(montaSpecResponseErrorBody(error))
}

function methodNotAllowedFailHandler(context, req, res) {
    return res.status(405).json({ status: 405, err: 'Method not allowed'})
}

function notImplementedFailHandler(context, req, res) {
    return res.status(501).json({ status: 501, err: "No handler registered for operation"})
}

function postResponseHandler(context, req, res) {
    if (!context.validation || context.validation.valid === false) {
        // request validation failed, so abort response validation
        return undefined
    } else if (!context.operation || !context.operation.operationId) {
        // operation not found, so abort response validation
        return undefined
    }

    //verifica se algum erro foi reportado pela camada de logica de negocios
    const error = context.resultado.error
    if (error && error.codigo) {
        if (error.codigo === 404) {
            context.request = error.request
            return notFoundFailHandler(context, req, res)
        }

        return res.status(error.codigo).json(montaSpecResponseErrorBody(error))
    }

    // Response body validation
    const validBase = context.api.validateResponse(context.response, context.operation)
    if (validBase.erros) {
        // response body validation failed
        return res.status(502).json({ status: 502, err: validBase.erros})
    }

    // Response handler validation
    const validHeaders = context.api.validateResponseHeaders(res.headers,
    context.operation,  {
        statusCode: res.statusCode,
        setMatchType: 'exact'
    })
    if (validHeaders.erros) {
        // response headers validation failed
        return res.status(502).json({ status: 502, err: validHeaders.erros})
    }

    return res.status(context.resultado.status).json(context.response)
}

function montaSpecResponseErrorBody(error) {
    return {
        errors: [
            {
                code: error.codigo,
                title: error.rotulo,
                detail: error.message,
                requestDateTime: new Date()
            }
        ],
        meta: {
            totalRecords: 1,
            totalPages: 1
        }
    }
}

module.exports = {
    validationFailHandlerFailHandler,
    notFoundFailHandler,
    methodNotAllowedFailHandler,
    notImplementedFailHandler,
    postResponseHandler
}