const { app, binaryMimeTypes, awsServerlessExpress } = require('./modules/frameworks-drivers/starters')

const serverPort = process.env.SERVER_PORT || 3001

module.exports.app = app

module.exports.startServer = async function () {
    app.listen(serverPort, function () {
        console.log( `listening on port ${serverPort}`)
    })
}

const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes)
module.exports.handler = function (event, content) {
    awsServerlessExpress.proxy(server, event, content)
}