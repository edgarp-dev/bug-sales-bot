import cron from 'node-cron';
import apiGatewayFactory from 'aws-api-gateway-client';

const sendMessage = async () => {
  try {
    const config = {
      invokeUrl: 'https://eab1jsxs3g.execute-api.us-east-1.amazonaws.com',
      region: process.env.AWS_REGION,
      accessKey: process.env.AWS_ACCESS_KEY_ID,
      secretKey: process.env.AWS_SECRET_ACCESS_KEY
    };

    const apiGatewayClient = apiGatewayFactory.newClient(config);
    const response = await apiGatewayClient.invokeApi(
      {},
      '/dev/sales',
      'POST',
      undefined,
      JSON.stringify({ sendNotification: true })
    );

    console.log(response);
  } catch (error: any) {
    console.log(error.message);
  }
};

sendMessage();

cron.schedule('* * * * *', async () => {
  await sendMessage();
});
