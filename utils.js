const request = require("request-promise");
const fs = require("fs");

async function focusInput(page) {
  // _1mf represents the class.
  await page.evaluate(() => document.getElementsByClassName("_1mf")[0].click());
}

async function applyTag(page, tag) {
  await page.keyboard.type(tag);
  // await page.waitFor(
  //   () =>
  //     document
  //       .getElementsByClassName("_5rpu")[0]
  //       .getAttribute("aria-expanded") === "true"
  // )
  // .then(() => {
  //   console.log('action being pressed');
  //   page.keyboard.press("Enter");
  // })
  // .catch(err => console.log('ERROR', err));
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

async function click(page, className, isQuery = false) {
  console.log("className is " + className);

  if (isQuery) {
    await page.evaluate((name) => document.querySelector(name).click(), className);
  } else {
    await page.evaluate((name) => document.getElementsByClassName(name)[0].click(), className);
  }
}

async function sendGif(page, text) {
  
  await click(page, "oajrlxb2 gs1a9yip g5ia77u1 mtkw9kbi tlpljxtp qensuy8j ppp5ayq2 goun2846 ccm00jje s44p3ltw mk2mc5f4 rt8b4zig n8ej3o3l agehan2d sk4xxmp2 rq0escxv nhd2j8a9 pq6dq46d mg4g778l btwxx1t3 pfnyh3mw p7hjln8o kvgmc6g5 cgat1ltu sw24d88r kkf49tns tgvbjcpo hpfvmrgz ecm0bbzt ph5uu5jm e5nlhep0 b3onmgus l9j0dhe7 i1ao9s8h esuyzwwr f1sip0of du4w35lb lzcic4wl abiwlrkh p8dawk7l");

  // Click gif button
  await click(page, '[aria-label="Choose a gif"', true);
  await page.waitFor(2000);
  await click(page, '[aria-label="GIF search"', true);
  await page.waitFor(2000);
  await typeText(page, text);
  await page.waitFor(2000);
  await click(page, '[alt="GIF"]', true);


  // Click gif
  //await click(page, "oajrlxb2 gs1a9yip g5ia77u1 mtkw9kbi tlpljxtp qensuy8j ppp5ayq2 goun2846 ccm00jje s44p3ltw mk2mc5f4 rt8b4zig n8ej3o3l agehan2d sk4xxmp2 rq0escxv nhd2j8a9 pq6dq46d mg4g778l btwxx1t3 pfnyh3mw p7hjln8o kvgmc6g5 cxmmr5t8 oygrvhab hcukyx3x tgvbjcpo hpfvmrgz jb3vyjys rz4wbd8a qt6c0cv9 a8nywdso l9j0dhe7 i1ao9s8h esuyzwwr f1sip0of du4w35lb lzcic4wl abiwlrkh p8dawk7l");

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
module.exports.sendGif = sendGif;
