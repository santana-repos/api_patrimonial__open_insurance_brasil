const supertest = require('supertest')
const { app } = require("../../../../src")
const getHealth = require('../../../../src/modules/usecases/health')

describe('testes dos endpoints Express', function () {
    process.env['DEBUG'] = 'dev'

    const requestHeaders = {
        'x-apigateway-content': "002",
        'FOO': "BAR",
        "Authorization": "123",
    }

    it('sucesso se retorna status 200 ao invocar GET /health', async function () {

        const response = await supertest(app).get('/health')
            .set(requestHeaders)
            .send()

        expect(response.status).toBe(200)
        expect(response.body.service_status).toBe(getHealth().service_status)
    })

    it('sucesso se retornar 404 para endpoint inexistent', async function () {
        const response = await supertest(app).get('/zzzzz')
            .send()

        expect(response.status).toBe(404)
        
    })
})