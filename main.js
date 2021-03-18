require('dotenv').config();
const chalk = require('chalk');
const NavigationManager = require('./navigationManager');

let nm = null;

/**
 * Entry point for the app.
 */
async function startBot(hasCrashed = false) {
  nm = new NavigationManager(hasCrashed);
  if (process.env.ENV === 'prod') {
    nm.launchProdServer();
  }
  await nm.loadActions();
  await nm.initConvPage();
  await nm.start();
}

process.on('unhandledRejection', (reason, p) => {
  console.log(chalk.red.inverse(' - CONV BOT CRASHED - '));
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  delete nm;
  setTimeout(() => startBot(true), 5000);
});

startBot();
