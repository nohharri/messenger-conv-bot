const { default: chalk } = require('chalk');
const fs = require('fs');
const clipboardy = require('clipboardy');
const utils = require('./utils');
const { resolve } = require('path');

const CHAT_DATA = './data.json';

/** Chatbot brain. Logic for how the bot will choose
 * to parse and provide message logic.
 */
module.exports = class Chatbot {

    constructor() {
        this.data = null;
    }

    /**
     * Loads the data in to perform actions.
     */
    async loadActions() {
        console.log(
            chalk.cyan.bold(' -> Fetching actions on: '),
            process.env.ACTIONS_URL,
            chalk.cyan.bold('...'),
          );
        
          try {
            const rawData = fs.readFileSync(CHAT_DATA);
            this.data = JSON.parse(rawData);
            console.log(
                chalk.green.bold(' -> Data read in successfully.'),
            )
          } catch (err) {
              console.error(
                  chalk.red.bold('Error reading file:'),
                  chalk.red(err),
              );
          }
    }

    /**
     * Performs an action based off the given message.
     * @param {string} message
     * @param {Object} page
     */
    async performAction(message, page) {
        return new Promise(async resolve => {

            const messageArr = message.toLowerCase().trim().split(" ");
            let action = null;
            let wordFound = false;
            // Get correct action by finding a matching phrase
            for (let word of messageArr) {
                for (let node of this.data) {
                    const { trigger: { phrases } } = node;
                    if (word in phrases) {
                        console.log('Node being processed: ' + word);
                        action = node;
                        wordFound = true;
                        break;
                    }
                }
                if (wordFound) break;
            }

            if (!wordFound) return resolve();

            if (action.tags && action.tags.length > 0) {
                await utils.applyTags(page, action.tags);
                await page.waitFor(2000);
                await page.keyboard.press('Enter');
                await page.waitFor(2000);
                await page.keyboard.press('Enter');
            }
            if (action.content) {
                console.log(
                    chalk.red.bold('      ACTION ->'),
                    chalk.italic(action.name),
                );
                for (let content of action.content) {
                    if (content.type === 'text' && !action.blacklist.includes(process.env.CONV_ID)) {
                        await utils.focusInput(page);
                        await utils.typeText(page, content.data);
                        await page.keyboard.press('Enter');
                    } else if (content.type === 'gif') {
                        await utils.sendGif(page, 'vision');
                    }
                }
            }

            return resolve();
        });
    }
}

// return new Promise(async resolve => {
//     //for (let action of this.actions) {
//       //const isAction = this.checkIsAction(message, action);
//       //if (isAction) {
//         console.log(
//           chalk.red.bold('      ACTION ->'),
//           //chalk.italic(action.name),
//         );
//         await utils.focusInput(this.page);

//         // testing
//         await utils.typeText(this.page, 'Is this Jake Marples?');

//         //await utils.applyTags(this.page, action.tags);
//         //await utils.typeText(this.page, action.text);
//         //await utils.applyAttachement(this.page, action.link);
//         //await utils.uploadRandomPicture(this.page, action.upload);
//         //await utils.fetchApi(this.page, action.fetchApi);
//         await this.page.keyboard.press('Enter');
//         return resolve();
//       //}
//     //}
//     return resolve();
//   });