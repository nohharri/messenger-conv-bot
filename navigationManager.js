const puppeteer = require('puppeteer');
const express = require('express');
const GithubWebHook = require('express-github-webhook');
const bodyParser = require('body-parser');
const chalk = require('chalk');
const request = require('request-promise');
const utils = require('./utils.js');

module.exports = class NavigationManager {
  constructor(afterCrash = false) {
    console.log(chalk.green.inverse(' - CONV BOT CREATED - '));
    this.running = true;
    this.afterCrash = afterCrash;
    this.actions = null;
    this.browser = null;
    this.page = null;
    this.savedMessage = null;
    this.server = null;
  }

  loadActions() {
    console.log(
      chalk.cyan.bold(' -> Fetching actions on: '),
      process.env.ACTIONS_URL,
      chalk.cyan.bold('...'),
    );
    return request({
      //uri: process.env.ACTIONS_URL,
      uri:
        [
          {
            "name": "Action that tag some friends", // Just name your action
            "trigger": {
              "type": "text", // The bot will be looking for a full match of 'content'
              "content": "@tagMyFriends" // The trigger string
            },
            "text": "Can you answer me guys ?", // A text to be typed as a message
            "tags": ["@First Friend Name", "@Other Name"] // List of names to tag in the conversation (only works for group chats)
          },
        ]
    })
      .then(res => {
        this.actions = JSON.parse(res);
        return true;
      })
      .catch(err => {
        console.log('Error in loadActions', err);
      });
  }

  async initConvPage() {
    console.log(chalk.cyan.bold(' -> Opening browser...'));
    this.browser = await puppeteer.launch({
      headless: process.env.HEADLESS === 'true',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    this.page = await this.browser.newPage();
    console.log(
      chalk.cyan.bold(' -> Navigating to : '),
      `https://www.messenger.com/t/${process.env.CONV_ID}`,
      chalk.cyan.bold(' ...'),
    );
    await this.page.goto(`https://www.messenger.com/t/${process.env.CONV_ID}`);
    console.log(chalk.cyan.bold(' -> Loging in...'));
    await this.page.evaluate(text => {
      document.getElementById('email').value = text;
    }, process.env.MAIL);
    await this.page.evaluate(text => {
      document.getElementById('pass').value = text;
    }, process.env.PASS);
    await this.page.evaluate(() =>
      document.getElementById('loginbutton').click(),
    );
    console.log(chalk.cyan.bold(' -> Waiting for conversation to load...'));
    await this.page.waitForNavigation();
    console.log('Navigation has happened.');
    //await this.page.waitFor('oo9gr5id', { timeout: 0 });
    console.log('Wait for has happened.');
    // if (this.afterCrash) {
    //   await utils.focusInput(this.page);
    //   await utils.typeText(this.page, 'I just crashed, sorry...');
    //   await this.page.keyboard.press('Enter');
    // }
  }

  launchProdServer() {
    const webhookHandler = GithubWebHook({
      path: '/webhook',
      secret: 'secret',
    });
    const app = express();
    app.use(bodyParser.json());
    app.use(webhookHandler);

    app.get('/', (x, res) => {
      res.send('Conv bot is alive!');
    });
    this.server = app
      .listen(process.env.PORT, () => {
        console.log(
          chalk.green.inverse(
            ` - ALIVE PAGE IS NOW RUNNING ON PORT ${process.env.PORT} - `,
          ),
        );
      })
      .on('SERVER ERROR', console.log);
    app.get('/death', (req, res) => {
      res.send('Killing the bot');
      this.server.close();
    });

    webhookHandler.on('*', async (event, repo, data) => {
      console.log('Webhook event', event, data.commits[0].author);
      if (event === 'push') {
        await this.loadActions();
        await utils.focusInput(this.page);
        await utils.typeText(
          this.page,
          `New actions availables ! Pushed by ${data.commits[0].author.name}`,
        );
        await this.page.keyboard.press('Enter');
      }
    });

    webhookHandler.on('error', (err, req, res) => {
      console.log('Webhook error', err);
    });
  }

  async lastMessage() {
    const msg = await this.page
      .evaluate(() => {
        const msgs = document.getElementsByClassName('l60d2q6s d1544ag0 sj5x9vvc tw6a2znq l9j0dhe7 ni8dbmo4 stjgntxs qlfml3jp inkptoze jk6sbkaj qmr60zad jm1wdb64 qv66sw1b ljqsnud1 g6srhlxm odn2s2vf');
        return msgs[msgs.length - 1].textContent;
      })
      .catch(() => {
        this.running = true;
      });
    if (msg === this.savedMessage) {
      return null;
    }
    this.savedMessage = msg;
    return msg;
  }

  async builtInCommands(message) {
    switch (message) {
      case '@help':
        return await utils.handleHelp(this.page, this.actions);
      // case '@restart':
      //   return await restart(lastMessage);
    }
    return null;
  }

  checkIsAction(message, action) {
    switch (action.trigger.type) {
      case 'text':
        return action.trigger.content === message;
      case 'regexp':
        const regexp = new RegExp(action.trigger.content, 'g');
        return regexp.test(message);
      default:
        return false;
    }
  }

  async actionParser(message) {
    return new Promise(async resolve => {
      //for (let action of this.actions) {
        //const isAction = this.checkIsAction(message, action);
        //if (isAction) {
          console.log(
            chalk.red.bold('      ACTION ->'),
            //chalk.italic(action.name),
          );
          await utils.focusInput(this.page);

          // testing
          await utils.typeText(this.page, 'Is this Jake Marples?');

          //await utils.applyTags(this.page, action.tags);
          //await utils.typeText(this.page, action.text);
          //await utils.applyAttachement(this.page, action.link);
          //await utils.uploadRandomPicture(this.page, action.upload);
          //await utils.fetchApi(this.page, action.fetchApi);
          await this.page.keyboard.press('Enter');
          return resolve();
        //}
      //}
      return resolve();
    });
  }

  async start() {
    while (this.running) {
      const message = await this.lastMessage();
      if (message) {
        console.log(
          chalk.magenta.bold('    # Message: '),
          chalk.italic(message),
        );
        const isBuiltIn = await this.builtInCommands(message);
        if (!isBuiltIn) await this.actionParser(message);
      }
      await this.page.waitFor(500);
    }
  }
};
