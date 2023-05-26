import cron from 'node-cron';
import puppeteer, { PuppeteerLaunchOptions } from 'puppeteer';
import apiGatewayFactory from 'aws-api-gateway-client';

// const sendMessage = async () => {
//   try {
//     const config = {
//       invokeUrl: 'https://eab1jsxs3g.execute-api.us-east-1.amazonaws.com',
//       region: process.env.AWS_REGION,
//       accessKey: process.env.AWS_ACCESS_KEY_ID,
//       secretKey: process.env.AWS_SECRET_ACCESS_KEY
//     };

//     const apiGatewayClient = apiGatewayFactory.newClient(config);
//     const response = await apiGatewayClient.invokeApi(
//       {},
//       '/dev/sales',
//       'POST',
//       undefined,
//       JSON.stringify({ sendNotification: true })
//     );

//     console.log(response);
//   } catch (error: any) {
//     console.log(error.message);
//   }
// };

async function scrapBugSalesWithQuery(queryParam: string) {
  const puppeteerConfig: PuppeteerLaunchOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  const isLocalhost = process.env.LOCALHOST;
  if (!isLocalhost) {
    puppeteerConfig.executablePath = '/usr/bin/chromium-browser';
  }

  const browser = await puppeteer.launch(puppeteerConfig);
  const page = await browser.newPage();
  await page.setViewport({
    height: 1920,
    width: 1080,
    deviceScaleFactor: 1
  });

  const url = `https://www.promodescuentos.com/search?q=${queryParam}`;

  await page.goto(url, { waitUntil: 'load' });

  const articles = await page.$$('article');

  const sales: Record<string, any> = [];
  for (const article of articles) {
    const linkElement = await article.$('.thread-title a');

    const title = await page.evaluate(
      (element) => element.textContent,
      linkElement
    );
    const href = await page.evaluate(
      (element) => element.getAttribute('href'),
      linkElement
    );

    const imageElement = await article.$('.thread-image');
    const imageUrl = await page.evaluate(
      (element) => element.getAttribute('src'),
      imageElement
    );

    const isExpiredElement = await article.$(
      '.size--all-s.text--color-grey.space--l-1.space--r-2.cept-show-expired-threads.hide--toW3'
    );
    const isExpired = await page.evaluate(
      (element) => (element ? element.textContent : null),
      isExpiredElement
    );

    sales.push({
      title,
      url: href,
      imageUrl,
      isExpired: isExpired === 'Expirado' || false
    });
  }

  await browser.close();

  return sales;
}

async function requestBugSales() {
  const results = await Promise.all([
    scrapBugSalesWithQuery('bug'),
    scrapBugSalesWithQuery('error')
  ])
    .then((resultsSets) => {
      let searchResults: Record<string, any>[] = [];

      resultsSets.forEach((results) => {
        searchResults = searchResults.concat(results);
      });

      return searchResults;
    })
    .then((searchResults) => {
      return searchResults.filter((result) => !result.isExpired);
    })
    .catch((error) => console.log(error));

  console.log(results);
}

cron.schedule('* * * * *', async () => {
  console.log('Requesting sales bug');
  await requestBugSales();
});
