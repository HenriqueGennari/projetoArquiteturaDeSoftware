const RabbitMQService = require('./rabbitmq-service')
const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '.env') })

// Função simulada para verificar fraude
function isFraudulent(cpf) {
    // Simulação: Se o CPF começar com '999', é fraude. Caso contrário, aprovado.
    return cpf.startsWith("999");
}

async function processMessage(msg) {
    const orderData = JSON.parse(msg.content);
    try {
        console.log(`Verificação de fraude para Pedido de: ${orderData.name}`); // [cite: 40, 41]

        if (isFraudulent(orderData.cpf)) {
            // CASO FRAUDE: Envia para contact avisando o cancelamento
            await (await RabbitMQService.getInstance()).send('contact', { 
                "clientFullName": orderData.name,
                "to": orderData.email,
                "subject": "Pedido Cancelado - Segurança",
                "text": `Infelizmente identificamos uma inconsistência de segurança e seu pedido foi cancelado.`,
            });
            console.log(`Status: REPROVADO - Motivo: Suspeita de Fraude`); // [cite: 42, 43]
        } else {
            // CASO APROVADO: Agora sim enviamos para o shipping
            await (await RabbitMQService.getInstance()).send('shipping', orderData);
            
            // Também avisamos o cliente que deu tudo certo (agora é a aprovação final)
            await (await RabbitMQService.getInstance()).send('contact', { 
                "clientFullName": orderData.name,
                "to": orderData.email,
                "subject": "Pedido Aprovado",
                "text": `Seu pedido foi aprovado na análise e segue para envio!`,
            });
            console.log(`Status: APROVADO - Enviado para Shipping`); // [cite: 42]
        }
    } catch (error) {
        console.log(`X ERROR FRAUD CHECK: ${error}`);
    }
}


async function consume() {
    console.log(`SUCCESSFULLY SUBSCRIBED TO QUEUE: ${process.env.RABBITMQ_QUEUE_NAME}`)
    await (await RabbitMQService.getInstance()).consume(process.env.RABBITMQ_QUEUE_NAME, (msg) => {processMessage(msg)})
} 

consume()
