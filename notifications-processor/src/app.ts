import { APIGatewayProxyEvent } from 'aws-lambda';
import axios from 'axios';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<any> => {
    try {
        console.log(event);

        const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramPostUrl = `https://api.telegram.org/${telegramBotToken}/sendMessage`;

        await axios.post(telegramPostUrl, {
            chat_id: '@promobugsdev',
            text: `Test message at ${Date.now()}`,
        });
    } catch (err) {
        console.log(err);
    }
};
