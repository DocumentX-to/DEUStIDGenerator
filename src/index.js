const { Cluster } = require('puppeteer-cluster');
const fs = require('fs');
const path = require('path');
const chalk = require("chalk");
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const {initOutputFiles, banner, loading, wait, generateId, waitForElement, generateRangeIds} = require("./utils");

const argv = yargs(hideBin(process.argv))
  .option('amount', {
    alias: 'a',
    description: 'Amount of USt-IdNr to check',
    type: 'number',
  })
  .command('range', 'Does generate the Ids in a range', {
    start: {
      description: 'Range Start',
      alias: 's',
      type: 'number'
    },
    end: {
      description: 'Range End',
      alias: 'e',
      type: 'number'
    }
  })
  .help()
  .alias('help', 'h')
  .argv;

const checkId = async ({page, data: id}, attempt = 0) => {
  try {
    await page.goto('https://ec.europa.eu/taxation_customs/vies/#/vat-validation');
    await waitForElement(10000, '#select-country', page);
    await wait(1000);
    await page.select('#select-country', 'DE');
    await page.type('input[formcontrolname="vatNumber"]', id.trim());
    await page.evaluate(() => document.querySelector('button[type="submit"][form="vat-validation-form"]').click());
    await wait(1000);
    await waitForElement(10000, 'span[class="text-result"]', page);
    const validFile = path.join(__dirname, '../output/valid.txt');
    const invalidFile = path.join(__dirname, '../output/invalid.txt');
    const result = await page.$eval('span[class="text-result"]', el => el.textContent);
    const isValid = (result === 'MwSt-Nummer gültig' || result === 'Yes, valid VAT number');

    if(isValid) {
      console.log(chalk.green(`[+] Valid USt-IdNr found: DE ${id.trim()}`));
      fs.appendFileSync(validFile, `DE ${id.trim()}\n`);
    } else {
      console.log(chalk.red(`[-] Invalid USt-IdNr found: DE ${id.trim()}`))
      fs.appendFileSync(invalidFile, `DE ${id.trim()}\n`);
    }
  } catch (e) {
  	await wait(10000);
    if(attempt > 2) {
      console.log(chalk.yellow(`[!] Timeout for USt-IdNr: DE ${id.trim()}`));
    } else {
      console.log(chalk.yellow(`[!] Error for USt-IdNr: DE ${id.trim()}`));
      await checkId({page, data: id}, attempt + 1);
    }
  }
}

(async () => {
  banner()  
  console.log(chalk.yellow("[!] To stop the script, press CTRL + C"));
  const loader = loading("Starting script...", "Script started");
  initOutputFiles();

  let ids = [];
  const amount = argv.amount || 1000;
  for (let i = 0; i < amount; i++)
    ids.push(generateId(8, ids));

  if (argv._.includes('range'))
    ids = generateRangeIds(8, argv.start || 1, argv.end || 2);

  const cluster = await Cluster.launch(require('../config.js'));
  await cluster.task(checkId.bind(this));

  loader.stop();

  for(let id of ids)
    await cluster.queue(id);

  await cluster.idle();
  await cluster.close();
})();
