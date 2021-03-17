const request = require("request-promise");
const fs = require("fs");

async function focusInput(page) {
  // _1mf represents the class.
  await page.evaluate(() => document.getElementsByClassName("_1mf")[0].click());
}

async function applyTag(page, tag) {
  await page.keyboard.type(tag);
  await page.waitFor(
    () =>
      document
        .getElementsByClassName("_5rpu")[0]
        .getAttribute("aria-expanded") === "true"
  )
  .then(() => page.keyboard.press("Enter"))
  .catch(err => console.log('ERROR', err));
}

async function applyTags(page, tags) {
  if (tags && tags.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const tag of tags) {
      await applyTag(page, tag);
    }
  }
}

async function typeText(page, text) {
  if (text) {
    await page.keyboard.type(` ${text}`);
  }
}

async function applyAttachement(page, link) {
  if (link) {
    await page.keyboard.type(` ${link}`);
    await page.waitFor(".fbNubFlyoutAttachments");
  }
}

async function uploadPicture(page, upload) {
  if (upload) {
    const fileData = await request({
      uri: upload,
      encoding: null
    });
    fs.writeFileSync("./file.jpg", fileData);
    const fileInput = await page.$("._4e5e");
    await fileInput.uploadFile("./file.jpg");
  }
}

async function uploadRandomPicture(page, upload) {
  if (upload && upload.length > 0) {
    const r = Math.floor(Math.random() * upload.length);
    await uploadPicture(page, upload[r]);
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
    await uploadPicture(page, data);
  }
}

async function handleHelp(page, actions) {
  await focusInput(page);
  await typeText(page, "AVAILABLE COMMANDS: ");
  for (let action of actions) {
    await typeText(page, `${action.trigger.content}, `);
  }
  await page.keyboard.press("Enter");
}

// async function restart(page, lastMessage) {
//   if (lastMessage === "@RESTART") {
//     await focusInput(page);
//     await typeText(page, "Restarting...");
//     await page.keyboard.press("Enter");
//     throw new Error("Hard reset");
//   }
// }

async function helloWorld(page) {
  await focusInput(page);
  await typeText(page, "Hello World !");
  await page.keyboard.press("Enter");
}

module.exports.focusInput = focusInput;
module.exports.applyTags = applyTags;
module.exports.typeText = typeText;
module.exports.applyAttachement = applyAttachement;
module.exports.uploadRandomPicture = uploadRandomPicture;
module.exports.fetchApi = fetchApi;
module.exports.handleHelp = handleHelp;
module.exports.helloWorld = helloWorld;
