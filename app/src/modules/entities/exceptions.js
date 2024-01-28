/*
* tabela de falhas:
* Codigo    |Descicao
* ------------------------------------------------------
* 0040      |nao sera possivel iniciar o express router com o parametro api_first_basepath informado como vazio
*
*/
class PreCondicoesNaoAtendidas extends Error {
    constructor(message, codigo) {
        super(message)

        this.name = this.constructor.name
        this.codigo = codigo

        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = PreCondicoesNaoAtendidas