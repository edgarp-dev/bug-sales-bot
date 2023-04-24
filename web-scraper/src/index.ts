import cron from 'node-cron';

const sayHello = async () => {
  console.log('Hello world :D from V2');
};

cron.schedule('* * * * *', async () => {
  await sayHello();
});
