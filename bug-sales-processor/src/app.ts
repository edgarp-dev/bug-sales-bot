import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const awsRegion = process.env.AWS_REGION;
        console.log(event);
        const testParsed = JSON.parse(JSON.parse(event.body as string));
        console.log('----->BODY TEST PARSED' + testParsed.sendNotification);
        const requestBody = JSON.parse(event.body ?? '');
        console.log('----> TYPE' + typeof requestBody);
        const { sendNotification } = requestBody;
        console.log('------> BODY', requestBody);
        console.log('------> BODY SEND NOTIFICATION', requestBody['sendNotification']);
        console.log('------> Send notification: ' + sendNotification);

        if (sendNotification) {
            const snsClient = new SNSClient({ region: awsRegion });
            const snsPublishCommand = new PublishCommand({
                TopicArn: process.env.NOTIFICATIONS_SNS_TOPIC_ARN,
                Message: 'Test message from lambda',
            });
            await snsClient.send(snsPublishCommand);
        }

        const dbClient = new DynamoDBClient({ region: awsRegion });
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
