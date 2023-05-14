import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const awsRegion = process.env.AWS_REGION;

        const requestBody = JSON.parse(event.body ?? '');
        const { sendNotification } = requestBody;
        console.log('Send notification: ' + sendNotification);

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
