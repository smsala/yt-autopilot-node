const express = require("express");
const { google } = require("googleapis");
const { Storage } = require("@google-cloud/storage");
const { exec } = require("child_process");
const fs = require("fs");

const app = express();
app.use(express.json());

// --------------------------
// GOOGLE CLOUD STORAGE SETUP
// --------------------------
const storage = new Storage();

const AUDIO_BUCKET = "video-audioyt";
const IMAGE_BUCKET = "video-imagesyt";
const FINAL_BUCKET = "video-finalyt";

// --------------------------
// GOOGLE SHEETS SETUP
// --------------------------
const SHEET_ID = "1AIJohtOcdTBm5yRLkZvolfvHVLOG4Xgl-kQagxiSInI";
const RANGE = "Sheet1!A:F";

const auth = new google.auth.GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

// --------------------------
// FETCH NEXT "NEW" VIDEO ROW
// --------------------------
async function getNextVideo() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE,
  });

  const rows = res.data.values;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][5] === "NEW") {
      return {
        rowIndex: i + 1,
        row: rows[i],
      };
    }
  }
  return null;
}

// --------------------------
// UPDATE STATUS IN SHEET
// --------------------------
async function updateStatus(rowIndex, status) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Sheet1!F${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[status]],
    },
  });
}

// --------------------------
// PROCESS NEXT VIDEO
// --------------------------
app.post("/process-next-video", async (req, res) => {
  try {
    console.log("STARTING VIDEO PROCESS...");

    const next = await getNextVideo();
    if (!next) {
      return res.json({ msg: "No NEW videos found." });
    }

    const [id, title] = next.row;

    // UPDATE STATUS → PROCESSING
    await updateStatus(next.rowIndex, "PROCESSING");

    // --------------------------------------------------
    // DOWNLOAD AUDIO + IMAGE FROM CLOUD STORAGE
    // --------------------------------------------------
    await storage.bucket(AUDIO_BUCKET).file("test.mp3").download({ destination: "audio.mp3" });
    await storage.bucket(IMAGE_BUCKET).file("test.jpg").download({ destination: "image.jpg" });

    console.log("Files downloaded successfully.");

    // --------------------------------------------------
    // CREATE VIDEO USING FFMPEG
    // --------------------------------------------------
    const output = `video-${id}.mp4`;

    const ffmpegCommand = `
      ffmpeg -loop 1 -i image.jpg -i audio.mp3 \
      -c:v libx264 -tune stillimage -c:a aac -b:a 192k \
      -pix_fmt yuv420p -vf scale=1280:720 -shortest ${output}
    `;

    await new Promise((resolve, reject) => {
      exec(ffmpegCommand, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log("FFmpeg video created.");

    // --------------------------------------------------
    // UPLOAD FINAL VIDEO
    // --------------------------------------------------
    await storage.bucket(FINAL_BUCKET).upload(output);
    console.log("Video uploaded.");

    // UPDATE STATUS → DONE
    await updateStatus(next.rowIndex, "DONE");

    // CLEANUP
    ["audio.mp3", "image.jpg", output].forEach((f) => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });

    return res.json({ ok: true, message: "Video generated successfully!", video: output });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// --------------------------
app.get("/", (req, res) => {
  res.send("YouTube Autopilot Cloud Run Service Running.");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
