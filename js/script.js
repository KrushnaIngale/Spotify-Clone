let currentSong = new Audio();
let progressBar = document.querySelector(".progress-bar");

let songs = [];
let albums = [];
let shuffleMode = false;
let currentFolder = "";

const playButton = document.getElementById("play");
const previousButton = document.getElementById("previous");
const nextButton = document.getElementById("next");
const loopButton = document.getElementById("loop");
const shuffleButton = document.getElementById("shuffle");

function secToMin(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

function getCurrentTrackName() {
  const fileName = currentSong.src.split("/").pop() || "";
  return decodeURIComponent(fileName.replace(".mp3", ""));
}

async function loadCatalog() {
  const response = await fetch("songs/catalog.json");
  if (!response.ok) throw new Error("Could not load songs/catalog.json");
  albums = await response.json();
}

function renderSongs() {
  const songUl = document.querySelector(".song-list ul");
  songUl.innerHTML = "";

  songs.forEach((song) => {
    songUl.innerHTML += `<li>
      <img src="img/music.svg" width="34" class="invert">
      <div class="info">
        <div>${song}</div>
        <div>Krishna</div>
      </div>
      <div class="playnow">
        <span>Play Now</span>
        <img class="invert" src="img/play.svg" alt="">
      </div>
    </li>`;
  });

  Array.from(songUl.getElementsByTagName("li")).forEach((item) => {
    item.addEventListener("click", () => {
      playMusic(item.querySelector(".info>div").innerHTML.trim());
    });
  });
}

function getSongs(folder) {
  const album = albums.find((entry) => entry.folder === folder);
  if (!album) return [];

  currentFolder = `songs/${album.folder}/`;
  songs = album.tracks;
  renderSongs();
  return songs;
}

function playMusic(track, pause = false) {
  currentSong.src = `${currentFolder}${encodeURIComponent(track)}.mp3`;
  if (!pause) {
    currentSong.play();
    playButton.src = "img/pause.svg";
  }

  document.querySelector(".song-name").innerHTML = track;
  document.querySelector(".album-pic").src = `${currentFolder}album-arts/${track}.jpg`;
}

function displayAlbums() {
  const cardContainer = document.querySelector(".card-container");
  cardContainer.innerHTML = "";

  albums.forEach((album) => {
    cardContainer.innerHTML += `
      <div class="card" data-folder="${album.folder}">
        <div class="play"><svg width="45" height="45" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="11" fill="#1DB954" />
            <polygon points="10,8 16,12 10,16" fill="black" />
          </svg>
        </div>
        <img src="songs/${album.folder}/cover.jpg" class="card-img">
        <p class="card-title">${album.title}</p>
        <p class="card-body">${album.description}</p>
      </div>`;
  });

  Array.from(cardContainer.querySelectorAll(".card")).forEach((card) => {
    card.addEventListener("click", () => {
      const folder = card.dataset.folder;
      getSongs(folder);
      playMusic(songs[0]);
    });
  });
}

async function main() {
  await loadCatalog();
  displayAlbums();
  getSongs(albums[0].folder);
  playMusic(songs[0], true);

  playButton.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      playButton.src = "img/pause.svg";
    } else {
      currentSong.pause();
      playButton.src = "assets/player_icon3.png";
    }
  });

  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".curr-time").innerHTML = secToMin(currentSong.currentTime);
    document.querySelector(".total-time").innerHTML = secToMin(currentSong.duration);
    const progress = (currentSong.currentTime / currentSong.duration) * 100;
    progressBar.value = progress;

    if (currentSong.ended) {
      currentSong.pause();
      playButton.src = "assets/player_icon3.png";
      progressBar.value = 0;
    }
  });

  progressBar.addEventListener("input", () => {
    currentSong.currentTime = (progressBar.value / 100) * currentSong.duration;
  });

  previousButton.addEventListener("click", () => {
    if (shuffleMode) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * songs.length);
      } while (songs[randomIndex] === getCurrentTrackName());
      playMusic(songs[randomIndex]);
      return;
    }

    const index = songs.indexOf(getCurrentTrackName());
    if (index > 0) playMusic(songs[index - 1]);
  });

  nextButton.addEventListener("click", () => {
    if (shuffleMode) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * songs.length);
      } while (songs[randomIndex] === getCurrentTrackName());
      playMusic(songs[randomIndex]);
      return;
    }

    const index = songs.indexOf(getCurrentTrackName());
    if (index < songs.length - 1) playMusic(songs[index + 1]);
  });

  loopButton.addEventListener("click", () => {
    const clicked = loopButton.classList.toggle("active");
    currentSong.loop = !!clicked;
  });

  shuffleButton.addEventListener("click", () => {
    shuffleMode = !shuffleMode;
    shuffleButton.classList.toggle("active");
  });

  const volumeBar = document.querySelector(".volume-bar");
  const volumeIcon = document.querySelector(".volume-icon");
  let prevVolume = currentSong.volume || 0.1;

  if (volumeBar) {
    volumeBar.value = String(Math.round(prevVolume * 100));
    volumeBar.addEventListener("input", (e) => {
      const v = Number(e.target.value) / 100;
      currentSong.volume = v;
      if (v > 0) prevVolume = v;
      if (volumeIcon) volumeIcon.src = v === 0 ? "img/mute.svg" : "./assets/controls_icon5.png";
    });
  }

  if (volumeIcon) {
    volumeIcon.style.cursor = "pointer";
    volumeIcon.addEventListener("click", () => {
      if (currentSong.volume === 0) {
        currentSong.volume = prevVolume;
        if (volumeBar) volumeBar.value = String(Math.round(prevVolume * 100));
        volumeIcon.src = "./assets/controls_icon5.png";
      } else {
        prevVolume = currentSong.volume || prevVolume;
        currentSong.volume = 0;
        if (volumeBar) volumeBar.value = "0";
        volumeIcon.src = "img/mute.svg";
      }
    });
  }
}

main().catch((error) => {
  console.error("App startup error:", error);
});
