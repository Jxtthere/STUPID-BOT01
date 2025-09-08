const fs = require("fs");
const login = require("fca-unofficial");

const ADMIN_UID = "100070180085781"; // Replace with your FB UID
let nicknameLock = false;

// Load session (no Gmail/Password needed)
const appState = JSON.parse(fs.readFileSync("appstate.json", "utf8"));

login({ appState }, (err, api) => {
  if (err) return console.error(err);

  console.log("✅ Bot started using appstate session");

  api.listenMqtt((err, message) => {
    if (err) return console.error(err);

    // Commands only from ADMIN
    if (message.senderID === ADMIN_UID) {
      if (message.body === "/locknick") {
        nicknameLock = true;
        api.sendMessage("🔒 Nickname changes are now locked by admin!", message.threadID);
      }

      if (message.body === "/unlocknick") {
        nicknameLock = false;
        api.sendMessage("🔓 Nickname changes are now unlocked by admin!", message.threadID);
      }
    }

    // Detect nickname change event
    if (nicknameLock && message.type === "event" && message.logMessageType === "log:user-nickname") {
      api.sendMessage("⚠️ Nickname changes are locked! Reverting...", message.threadID);

      // Revert nickname (set it back to account name)
      api.getUserInfo(message.logMessageData.participant_id, (err, info) => {
        if (!err) {
          const userName = info[message.logMessageData.participant_id].name;
          api.changeNickname(userName, message.threadID, message.logMessageData.participant_id);
        }
      });
    }
  });
});
