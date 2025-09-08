const fs = require("fs");
const login = require("fca-unofficial");

// Replace with your Facebook Admin UID
const ADMIN_UID = "100070180085781"; 

let nicknameLock = false;

// Load session (no Gmail/Password needed)
const appState = JSON.parse(fs.readFileSync("appstate.json", "utf8"));

login({ appState }, (err, api) => {
  if (err) return console.error("❌ Login failed:", err);

  console.log("✅ LockNicknameEvent Bot started");

  api.listenMqtt((err, message) => {
    if (err) return console.error(err);

    // Commands only from ADMIN
    if (message.senderID === ADMIN_UID && message.body) {
      if (message.body.toLowerCase() === "/locknick") {
        nicknameLock = true;
        api.sendMessage("🔒 Nickname changes are now locked by Admin!", message.threadID);
      }

      if (message.body.toLowerCase() === "/unlocknick") {
        nicknameLock = false;
        api.sendMessage("🔓 Nickname changes are now unlocked by Admin!", message.threadID);
      }
    }

    // Detect nickname change
    if (
      nicknameLock &&
      message.type === "event" &&
      message.logMessageType === "log:user-nickname"
    ) {
      const targetID = message.logMessageData.participant_id;

      api.sendMessage(
        "⚠️ Nickname changes are locked! Reverting...",
        message.threadID
      );

      // Revert nickname to default (their FB name)
      api.getUserInfo(targetID, (err, info) => {
        if (!err) {
          const userName = info[targetID].name;
          api.changeNickname(userName, message.threadID, targetID);
        }
      });
    }
  });
});
