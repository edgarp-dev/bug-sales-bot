import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
        console.log('------->' + event.body);

        const params = {
            TableName: process.env.BUG_SALES_DB_NAME,
            Item: {
                id: {
                    S: Math.random().toString(16).slice(2),
                },
                name: {
                    S: 'Test name',
                },
                body: {
                    S: 'Test body',
                },
            },
        };

        await dbClient.send(new PutItemCommand(params));

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'hello world',
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'some error happened',
            }),
        };
    }
};
