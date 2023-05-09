import { APIGatewayProxyEvent } from 'aws-lambda';

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<any> => {
    try {
        console.log(event);
    } catch (err) {
        console.log(err);
    }
};
