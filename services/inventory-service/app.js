const RabbitMQService = require('./rabbitmq-service')
const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, './.env') })

// Banco de dados em memória (Mock) para o estoque
// Inicia com alguns valores padrão
let stockDatabase = {
    "Monitor Gamer 24pol": 50,
    "Clean Code": 20,
    "Placa de Vídeo RTX 4070": 5,
    "Tênis Esportivo": 100
}

async function processMessage(msg) {
    const productData = JSON.parse(msg.content)
    
    try {
        const productName = productData.name
        const quantitySold = productData.quantitySold || 1

        // Se o produto não existe no banco mockado, cria com um valor padrão para não dar erro
        if (stockDatabase[productName] === undefined) {
            stockDatabase[productName] = 20 // Valor inicial padrão
        }

        // Atualiza o estoque (Subtrai a quantidade vendida)
        stockDatabase[productName] = stockDatabase[productName] - quantitySold

        // Exibe no terminal no formato exato pedido no PDF [cite: 27, 28, 29]
        console.log(`Estoque atualizado:`)
        console.log(`Produto: ${productName}`)
        console.log(`Quantidade restante: ${stockDatabase[productName]}`)
        console.log(`----------------------------------------------`)

    } catch (error) {
        console.log(`X ERROR INVENTORY: ${error}`)
    }
}

async function consume() {
    // Certifique-se que no .env deste serviço a fila seja 'inventory'
    const queueName = 'inventory'
    console.log(`SUCCESSFULLY SUBSCRIBED TO QUEUE: ${queueName}`)
    await (await RabbitMQService.getInstance()).consume(queueName, (msg) => {processMessage(msg)})
} 

consume()