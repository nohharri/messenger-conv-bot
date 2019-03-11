require("dotenv").config();
const puppeteer = require("puppeteer");
const fs = require("fs");
const request = require("request-promise");
const express = require("express");
const chalk = require("chalk");
const app = express();

function actionParser(txt, actions) {
  return new Promise(resolve => {
    for (let action of actions) {
      if (action.trigger.type === "text" && action.trigger.content === txt) {
        return resolve(action);
      }
    }
    return resolve(null);
  });
}

async function focusInput(page) {
  await page.evaluate(() => document.getElementsByClassName("_1mf")[0].click());
}

async function typeText(page, text) {
  if (text) {
    await page.keyboard.type(` ${text}`);
  }
}

async function applyTags(page, tags) {
  if (tags && tags.length > 0) {
    for (let tag of tags) {
      await page.keyboard.type(tag);
      await page.waitFor(
        () =>
          document
            .getElementsByClassName("_5rpu")[0]
            .getAttribute("aria-expanded") === "true"
      );
      await page.keyboard.press("Enter");
    }
  }
}

async function applyAttachement(page, link) {
  if (link) {
    await page.keyboard.type(` ${link}`);
    await page.waitFor(".fbNubFlyoutAttachments");
  }
}

async function uploadPicture(page, upload) {
  if (upload && upload.length > 0) {
    const r = Math.floor(Math.random() * upload.length);
    const fileData = await request({
      uri: upload[r],
      encoding: null
    });
    fs.writeFileSync("./file.jpg", fileData);
    const fileInput = await page.$("._4e5e");
    await fileInput.uploadFile("./file.jpg");
  }
}

async function fetchApi(page, fetch) {
  if (fetch) {
    let data = await request({
      uri: fetch.apiUrl
    });
    data = JSON.parse(data);
    fetch.dataPath.forEach(path => {
      data = data[path];
    });
    await uploadPicture(page, [data]);
  }
}

async function handleHelp(page, lastMessage, actions) {
  if (lastMessage === "@help") {
    await focusInput(page);
    await typeText(page, "AVAILABLE COMMANDS: ");
    for (let action of actions) {
      await typeText(page, `${action.trigger.content}, `);
    }
    await page.keyboard.press("Enter");
  }
}

async function startBot() {
  console.log(
    chalk.cyan.bold(" -> Fetching actions on: "),
    process.env.ACTIONS_URL,
    chalk.cyan.bold(" ...")
  );
  let actions = await request({
    uri: process.env.ACTIONS_URL
  });
  actions = JSON.parse(actions);
  console.log(chalk.cyan.bold(" -> Opening browser..."));
  const browser = await puppeteer.launch({
    headless: process.env.HEADLESS === "true",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  console.log(
    chalk.cyan.bold(" -> Navigating to : "),
    `https://www.messenger.com/t/${process.env.CONV_ID}`,
    chalk.cyan.bold(" ...")
  );
  await page.goto(`https://www.messenger.com/t/${process.env.CONV_ID}`);
  console.log(chalk.cyan.bold(" -> Loging in..."));
  await page.evaluate(text => {
    document.getElementById("email").value = text;
  }, process.env.MAIL);
  await page.evaluate(text => {
    document.getElementById("pass").value = text;
  }, process.env.PASS);
  await page.evaluate(() => document.getElementById("loginbutton").click());
  console.log(chalk.cyan.bold(" -> Waiting for conversation to load..."));
  await page.waitForNavigation();
  await page.waitFor(".__i_");

  let saved = null;
  while (true) {
    let lastMessage = await page.evaluate(() => {
      a = document.getElementsByClassName("_58nk");
      return Promise.resolve(a[a.length - 1].textContent);
    });
    if (lastMessage !== saved) {
      console.log(
        chalk.magenta.bold("    # Message: "),
        chalk.italic(lastMessage)
      );
      saved = lastMessage;
      await handleHelp(page, lastMessage, actions);
      let action = await actionParser(lastMessage, actions);
      if (action) {
        console.log(
          chalk.red.bold("      ACTION ->"),
          chalk.italic(action.name)
        );
        await focusInput(page);
        await applyTags(page, action.tags);
        await typeText(page, action.text);
        await applyAttachement(page, action.link);
        await uploadPicture(page, action.upload);
        await fetchApi(page, action.fetchApi);
        await page.keyboard.press("Enter");
      }
    }
    await page.waitFor(500);
  }
}

function keepAlive() {
  console.log(chalk.green.inverse(" - CONV BOT IS NOW STARTING - "));
  try {
    startBot();
  } catch (error) {
    console.log(chalk.red.inverse(" - CONV BOT CRASHED - "));
    console.log(error);
    keepAlive();
  }
}

keepAlive();

if (process.env.ENV === "prod") {
  app.get("/", res => {
    res.send("Conv bot is alive!");
  });
  app.listen(process.env.PORT, () => {
    console.log(
      chalk.green.inverse(
        ` - ALIVE PAGE IS NOW RUNNING ON PORT ${process.env.PORT} - `
      )
    );
  });
}
