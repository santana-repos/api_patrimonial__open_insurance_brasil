const express = require('express')
const cors = require('cors')
const debug = require('debug')('dev')
const getHealth = require('../../usecases/health')
const PreCondicoesNaoAtendidas = require('../../entities/exceptions')

module.exports = function constroiRotasExpress(api_first_basepath) {

    if (!api_first_basepath || api_first_basepath.trim() == '') {
        throw new PreCondicoesNaoAtendidas('nao sera possivel '
            + 'iniciar o express router com o parametro api_first_basepath'
            + 'informado como vazio', '0040')
    }

    const router = express.Router()

    router.use('/', function (request, response, next) {
        request.url = request.url.replace(api_first_basepath, '')
        next()
    })

    router.use(cors())
    router.use(express.urlencoded({ extended: true}))
    router.use(express.json())

    router.get('/', function (request, response) {
        debug("endpoint GET '/' invocado para exibir o status do servico")
        response.json(getHealth())
    })

    router.get('/health', function (request, response) {
        debug("endpoint GET '/health' invocado para exibir o status do servico")
        debug(`HTTP REQUEST Headers:::${JSON.stringify(request.headers)}`)
        response.json(getHealth())
    })

    return router
}