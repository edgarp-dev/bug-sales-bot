import cron from 'node-cron';
import puppeteer, {
  PuppeteerNodeLaunchOptions,
  Page,
  Browser
} from 'puppeteer';
import apiGatewayFactory from 'aws-api-gateway-client';
import NodeCache from 'node-cache';

type BugSale = {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  isExpired: boolean;
};

const localCache = new NodeCache();

let browser: Browser | undefined = undefined;

const isLocalhost = process.env.LOCALHOST === 'true';

// Uncomment to test locally and comment the cron schedule expression
// (async () => {
//   console.log('Requesting sales bug');
//   const bugSales = await requestBugSales();
//   console.log(bugSales);
//   if (bugSales) {
//     const isLocalCacheStale = verifyIfLocalCacheIsStale(bugSales);
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
  try {
    console.log('v0.5.13');
    console.log('Requesting sales');
    const bugSales = await requestBugSales();
    if (bugSales) {
      console.log('Veryfing cache');
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
  } catch (error: any) {
    console.log(error);
  }
});

async function requestBugSales(): Promise<BugSale[] | undefined> {
  const bugQueryResults = await scrapBugSalesWithQuery(['bug', 'error']);

  const resultsWithoutExpiredSales = [...bugQueryResults].filter(
    (bugSale: BugSale) => !bugSale.isExpired
  );

  return resultsWithoutExpiredSales ?? undefined;
}

async function scrapBugSalesWithQuery(
  queryParams: string[]
): Promise<BugSale[]> {
  const puppeteerConfig: PuppeteerNodeLaunchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ]
  };

  if (!isLocalhost) {
    puppeteerConfig.executablePath = '/usr/bin/chromium-browser';
  }

  browser = await puppeteer.launch(puppeteerConfig);
  const page = await browser.newPage();

  const sales: BugSale[] = [];

  for await (const queryParam of queryParams) {
    const url = `https://www.promodescuentos.com/search?q=${queryParam}`;

    await page.goto(url, { waitUntil: 'load' });

    const numberOfScrollEvents = 10;
    await scrollPage(page, numberOfScrollEvents);

    const articles = await page.$$('article');

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
  }

  await page.close();
  await browser.close();

  return sales;
}

async function scrollPage(page: Page, numberOfScrollEvents = 5): Promise<void> {
  let currentScrollEvent = 1;
  while (currentScrollEvent <= numberOfScrollEvents) {
    await page.mouse.wheel({ deltaY: 2000 });

    await sleep(1000);

    currentScrollEvent++;
  }
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function verifyIfLocalCacheIsStale(bugSales: BugSale[]): boolean {
  const itemsNotCached: BugSale[] = bugSales.filter(
    ({ id }: BugSale) => !localCache.has(id)
  );
  return itemsNotCached.length > 0 ? true : false;
}

const postBugSales = async (bugSales: BugSale[]): Promise<void> => {
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

  console.log(response.data);
};

function updateLocaCache(bugSales: BugSale[]) {
  localCache.flushAll();

  bugSales.forEach((bugSale: BugSale) => localCache.set(bugSale.id, bugSale));
}
