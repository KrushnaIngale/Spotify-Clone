const fs = require("fs");
const path = require("path");

const rootDir = process.cwd();
const songsDir = path.join(rootDir, "songs");
const outputFile = path.join(songsDir, "catalog.json");

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function getTrackNames(folderPath) {
  return fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".mp3")
    .map((entry) => path.basename(entry.name, ".mp3"))
    .sort((a, b) => a.localeCompare(b));
}

function buildCatalog() {
  if (!fs.existsSync(songsDir)) {
    throw new Error("songs directory not found");
  }

  const folders = fs
    .readdirSync(songsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const catalog = [];

  for (const folder of folders) {
    const folderPath = path.join(songsDir, folder);
    const tracks = getTrackNames(folderPath);
    if (tracks.length === 0) continue;

    const infoPath = path.join(folderPath, "info.json");
    const info = readJsonSafe(infoPath) || {};

    catalog.push({
      folder,
      title: info.title || folder,
      description: info.description || "Songs",
      tracks,
    });
  }

  fs.writeFileSync(outputFile, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  return catalog.length;
}

try {
  const albumCount = buildCatalog();
  console.log(`catalog generated: ${albumCount} album(s) -> songs/catalog.json`);
} catch (error) {
  console.error(`catalog generation failed: ${error.message}`);
  process.exit(1);
}
