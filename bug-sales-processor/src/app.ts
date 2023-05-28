import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const awsRegion = process.env.AWS_REGION;
        let requestBody = JSON.parse(event.body ?? '');

        if (typeof requestBody === 'string') {
            requestBody = JSON.parse(requestBody);
        }

        const { bugSales = [] } = requestBody;

        const dbClient = new DynamoDBClient({ region: awsRegion });

        for await (const bugSale of bugSales) {
            const { id, title, url, imageUrl } = bugSale;

            const bugSalesDBName = process.env.BUG_SALES_DB_NAME;

            const getItemResponse = await dbClient.send(
                new GetItemCommand({
                    TableName: bugSalesDBName,
                    Key: {
                        id: {
                            S: id,
                        },
                    },
                }),
            );

            const bugSaleAlreadyNotified = getItemResponse.Item;

            if (!bugSaleAlreadyNotified) {
                const snsClient = new SNSClient({ region: awsRegion });
                const snsPublishCommand = new PublishCommand({
                    TopicArn: process.env.NOTIFICATIONS_SNS_TOPIC_ARN,
                    Message: `notiication_${id}`,
                    MessageAttributes: {
                        title: {
                            DataType: 'String',
                            StringValue: title,
                        },
                        url: {
                            DataType: 'String',
                            StringValue: url,
                        },
                        imageUrl: {
                            DataType: 'String',
                            StringValue: imageUrl,
                        },
                    },
                });

                await snsClient.send(snsPublishCommand);

                const params = {
                    TableName: process.env.BUG_SALES_DB_NAME,
                    Item: {
                        id: {
                            S: id,
                        },
                        title: {
                            S: title,
                        },
                        url: {
                            S: url,
                        },
                        imageUrl: {
                            S: imageUrl,
                        },
                        notificationSent: {
                            BOOL: true,
                        },
                    },
                };

                await dbClient.send(new PutItemCommand(params));
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Bug sales processed',
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error handling request',
            }),
        };
    }
};
