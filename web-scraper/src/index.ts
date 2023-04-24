import cron from 'node-cron';

const sayHello = async () => {
  console.log('Hello world :D');
};

cron.schedule('* * * * *', async () => {
  await sayHello();
});
