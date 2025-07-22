const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const possibleChars = require("../possibleChars.json");

chalk.level = 1;

const wait = async ms => new Promise(resolve => setTimeout(resolve, ms));

const banner = () => {
  console.log(chalk.white("+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+\n"));
  console.log(chalk.red(                   
    "                                            ..::.....      \n" +              
    "                                         :----==----:::--:       \n" +        
    "                                        .-:--:--++=-:----+=.             \n" +
    "                                       :=: ..-+***+====-===:--.          \n" +
    "                                      :++=...=*++-:::-+::-::-+=          \n" +
    "                                      ==+=:::-+==-=----:--:-=+:          \n" +
    "                                      .:-=-:.-***=:.-+=-:----.           \n" +
    "                                       ...:.:-*#%+=++*=++=:.             \n" +
    "                                            -+*#*+****+=**-              \n" +
    "                                            --**+**+***==**:             \n" +
    "                                            .::=********-+*-             \n" +
    "                                         .  :*=:-==+++++=:=.             \n" +
    "                                            :##=:.::::-:.=-              \n" +
    "                                        :+: :#++-.-=+.:+==               \n" +
    "                                        +*  -*=*+ ==:  +=                \n" +
    "                                     .:-#-::=- .-.:...-.  .              \n" +
    "                                    -+*+=:. .-:.--:-:. :=*:              \n" +
    "                                   :*+**++++*###===-:.=**#=              \n" +
    "                                   -+==:-***#####*=-::=#+*+ \n"
  ));
  console.log("                                Pwned>1nsane  | USt-IdNr Checker v1.2");
  console.log("                                     1nsane seine Jabber: ins8ne@exploit.im");
  console.log(chalk.white("+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+"));
}

const loading = (message, doneMessage) => {
  const P = ["\\", "|", "/", "-"];
  let index = 0;

  const interval = setInterval(() => {
    process.stdout.write(`\r${"\033[33m"}[${P[index++]}] ${message}`);
    index &= 3;
  }, 250);

  const stop = newMessage => {
    doneMessage = newMessage || doneMessage;
    clearInterval(interval);
    const fix = new Array((message.length - (doneMessage.length) > 0 ? message.length - doneMessage.length : 0) + 1).join(' ');
    console.log(chalk.green(`\r[✓] ${doneMessage} ${fix}`))
  }

  return {interval, stop};
}

const initOutputFiles = () => {
  const outputDir = path.join(__dirname, '../output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
}

const tryToClick = async (selector, page) => {
  try {
    await page.click(selector);
    return true;
  } catch (e) {
    return false;
  }
}

const readValidFile = () => {
  const validFile = path.join(__dirname, '../output/valid.txt');
  if (!fs.existsSync(validFile)) fs.writeFileSync(validFile, '');
  return fs.readFileSync(validFile, 'utf8').split('\n').filter(value => value !== '').map(user => user.replace('\r', ''));
}

const readInvalidFile = () => {
  const invalidFile = path.join(__dirname, '../output/invalid.txt');
  if (!fs.existsSync(invalidFile)) fs.writeFileSync(invalidFile, '');
  return fs.readFileSync(invalidFile, 'utf8').split('\n').filter(value => value !== '').map(user => user.replace('\r', ''));
}

const calcChecksum = (id = '') => {
  let sum = 0;
  let product = 10;
  
  const calculations = id.split('').map(char => {
    const {output} = possibleChars.find(element => element.name === char);
    sum = (parseInt(output) + product) % 10;
    if (sum == 0)
    	sum = 10;
    product = (2 * sum) % 11;
    return product;
  });

  sum = (11 - calculations[calculations.length - 1]).toString().split('');
  return sum[sum.length - 1];
}

const generateId = (length = 8, generatedIds = []) => {
  let uniqueId = '';
  while (uniqueId.length !== length) {
    const id = [...Array(length)].map(() => possibleChars[Math.floor(Math.random() * possibleChars.length)].name).join('');
    if (readInvalidFile().includes("DE " + id) || readValidFile().includes("DE " + id) || generatedIds.includes(id)) continue;
    uniqueId = id;
  }

  const checksum = calcChecksum(uniqueId);
  return uniqueId + checksum;
};

const generateRangeIds = (length = 8, start = 1, end = 2) => {
  const ids = []
  for (let i = start; i <= end; i++) {
    const id = i.toString().padStart(length, '0');
    const checksum = calcChecksum(id);
    if (readInvalidFile().includes("DE " + id + checksum) || readValidFile().includes("DE " + id + checksum)) continue;
    ids.push(id + checksum);
  }
  return ids;
}

const waitForElement = async (timeout, selector, page) => {
  return new Promise((resolve, reject) => {
    let interval = setInterval(async () => {
      const isReady = await tryToClick(selector, page);

      if (isReady) {
        clearInterval(interval);
        resolve();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      reject(new Error('Timeout'));
    }, timeout);
  });
}

module.exports = {wait, initOutputFiles, banner, loading, tryToClick, generateId, generateRangeIds, waitForElement};
