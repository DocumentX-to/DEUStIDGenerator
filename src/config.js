const { Cluster } = require('puppeteer-cluster');

const config = {
  concurrency: Cluster.CONCURRENCY_CONTEXT,
  maxConcurrency: 10,
  monitor: true,
  puppeteerOptions: {
    headless: true,
  }
}

module.exports = config;
