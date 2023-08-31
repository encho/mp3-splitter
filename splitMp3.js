const fs = require("fs");
const path = require("path");
const readline = require("readline");
const ffmpeg = require("fluent-ffmpeg");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getAudioDuration(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata.format.duration);
      }
    });
  });
}

async function cutMp3(inputPath, outputPath, fileName, numSegments) {
  const audioDuration = await getAudioDuration(inputPath);
  const segmentDurationMs = audioDuration * 1000; // Convert to milliseconds
  console.log(`Audio duration (s): ${audioDuration}`);
  console.log(`Segment duration (ms): ${segmentDurationMs}`);

  const segmentLength = Math.floor(segmentDurationMs / numSegments);

  for (let i = 0; i < numSegments; i++) {
    const startTime = i * segmentLength;
    const endTime = Math.min((i + 1) * segmentLength, segmentDurationMs);
    const outputFilePath = path.join(
      outputPath,
      `${fileName}_${i + 1 < 10 ? "0" : ""}${i + 1}.mp3`
    );

    console.log(`Segment ${i + 1}: start ${startTime}ms, end ${endTime}ms`);

    ffmpeg()
      .input(inputPath)
      .setStartTime(startTime / 1000) // Convert start time to seconds
      .setDuration((endTime - startTime) / 1000) // Convert segment length to seconds
      .audioCodec("copy")
      .output(outputFilePath)
      .on("end", () => {
        console.log(`Segment ${i + 1} saved as ${outputFilePath}`);
      })
      .run();
  }
}

rl.question("Enter the path of the input .mp3 file: ", (inputPath) => {
  rl.question(
    "Enter the directory where output files will be saved: ",
    (outputPath) => {
      rl.question("Enter the file name: ", (fileName) => {
        rl.question("Enter the number of segments: ", (numSegments) => {
          if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
          }
          cutMp3(inputPath, outputPath, fileName, parseInt(numSegments, 10))
            .then(() => {
              rl.close();
            })
            .catch((error) => {
              console.error("An error occurred:", error);
              rl.close();
            });
        });
      });
    }
  );
});
