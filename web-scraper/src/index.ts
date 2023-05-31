import cron from 'node-cron';
import puppeteer, { PuppeteerLaunchOptions } from 'puppeteer';
import apiGatewayFactory from 'aws-api-gateway-client';
import NodeCache from 'node-cache';

const localCache = new NodeCache();

const isLocalhost = process.env.LOCALHOST === 'true';

const postBugSales = async (bugSales: Record<string, any>) => {
  try {
    const config = {
      invokeUrl: 'https://eab1jsxs3g.execute-api.us-east-1.amazonaws.com',
      region: process.env.AWS_REGION,
      accessKey: process.env.AWS_ACCESS_KEY_ID,
      secretKey: process.env.AWS_SECRET_ACCESS_KEY
    };

    const requestBody = JSON.stringify({
      bugSales
    });

    const apiGatewayClient = apiGatewayFactory.newClient(config);
    const response = await apiGatewayClient.invokeApi(
      {},
      '/dev/sales',
      'POST',
      undefined,
      requestBody
    );

    console.log(response);
  } catch (error: any) {
    console.log(error.message);
  }
};

async function scrapBugSalesWithQuery(
  queryParam: string
): Promise<Record<string, any>[]> {
  const puppeteerConfig: PuppeteerLaunchOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  };

  if (!isLocalhost) {
    puppeteerConfig.executablePath = '/usr/bin/chromium-browser';
  }

  const browser = await puppeteer.launch(puppeteerConfig);
  const page = await browser.newPage();

  const url = `https://www.promodescuentos.com/search?q=${queryParam}`;

  await page.goto(url, { waitUntil: 'load' });

  const articles = await page.$$('article');

  const sales: Record<string, any>[] = [];
  for (const article of articles) {
    const linkElement = await article.$('.thread-title a');

    const id = await page.evaluate(
      (element) => element.getAttribute('id'),
      article
    );

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
      id,
      title,
      url: href,
      imageUrl,
      isExpired: isExpired === 'Expirado' || false
    });
  }

  await browser.close();

  return sales;
}

async function requestBugSales(): Promise<Record<string, any>[] | undefined> {
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

  return results ?? undefined;
}

function verifyIfLocalCacheIsStale(bugSales: Record<string, any>) {
  const itemsNotCached: Record<string, any>[] = bugSales.filter(
    (bugSale: Record<string, any>) => !localCache.has(bugSale.id)
  );
  return itemsNotCached.length > 0 ? true : false;
}

function updateLocaCache(bugSales: Record<string, any>[]) {
  localCache.flushAll();

  bugSales.forEach((bugSale: Record<string, any>) =>
    localCache.set(bugSale.id, bugSale)
  );
}

// Uncomment to test locally and comment the cron schedule expression
// (async () => {
//   console.log('Requesting sales bug');
//   const bugSales = await requestBugSales();

//   if (bugSales) {
//     const isLocalCacheStale = verifyIfLocalCacheIsStale(bugSales);
//     console.log(localCache.keys());
//     if (isLocalCacheStale) {
//       console.log('POST to bug sales processor API');
//       // await postBugSales(bugSales);
//       console.log('Updating cache');
//       updateLocaCache(bugSales);
//     } else {
//       console.log('Cache not stale, nothing to do');
//     }
//   }
// })();

cron.schedule('* * * * *', async () => {
  console.log('Requesting sales bug');
  const bugSales = await requestBugSales();

  if (bugSales) {
    const isLocalCacheStale = verifyIfLocalCacheIsStale(bugSales);

    if (isLocalCacheStale) {
      console.log('POST to bug sales processor API');
      await postBugSales(bugSales);
      console.log('Updating cache');
      updateLocaCache(bugSales);
    } else {
      console.log('Cache not stale, nothing to do');
    }
  }
});
