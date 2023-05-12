import { APIGatewayProxyEvent } from 'aws-lambda';
import axios from 'axios';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<any> => {
    try {
        console.log(event);
        await axios.post('https://api.telegram.org/bot5848018748:AAEwAb31VJWc0e9GiAZONi4aVYrdkABdEeE/sendMessage', {
            chat_id: '@promobugsdev',
            text: 'Test message',
        });
    } catch (err) {
        console.log(err);
    }
};
