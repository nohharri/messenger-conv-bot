
# Messenger Conv Bot

<img src="https://image.flaticon.com/icons/svg/733/733548.svg" width="100"><img src="https://image.flaticon.com/icons/svg/1547/1547183.svg" width="100">

Messenger Conv Bot allows you to launch a headless puppeteer chrome browser that opens messenger, connect to a selected account and watch a conversation, waiting for specific commands.

# How to use it ?

First install all the dependencies with ```yarn install```
Then create a ```.env``` file following the ```.envExample``` to setup all the necessary env variables required to lauch the bot.
Finally just ```yarn start``` to launch the bot.

# Required env variables

```MAIL``` : your fb user email
```PASS``` : your fb user password
```CONV_ID``` : the messenger conversation id where you want the bot to act (ie : https://www.messenger.com/t/1737195323049141 => the id is 1737195323049141)
```HEADLESS``` : true of false depending on if you want to visualize the chrome navigator or not
```ACTIONS_URL``` : a url targeting a raw JSON file that the bot will be using as it's actions list

# How to configure the actions ?

```json
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
  {
    "name": "Fetch data on JSON api",
    "trigger": {
      "type": "text",
      "content": "@fetchSomePicture"
    },
    "fetchApi": {
      "apiUrl": "https://www.reddit.com/r/pics.json?limit=1", // The API url to fetch
      "dataPath": ["data", "children", 0, "data", "url"], // Explore the returned JSON object
      "action": "upload" // Action to perform with the returned data (here upload the picture from the link in the data)
    }
  },
  {
    "name": "Get a doggo",
    "trigger": {
      "type": "text",
      "content": "@dailydog"
    },
    "upload": ["url1", "url2", "url3"] // List of images links : 1 will be randomly choosed and uploaded
  }
]

```