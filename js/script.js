// console.log("Hello World")
let currentSong = new Audio(); //global variable for single song play
let progressBar = document.querySelector(".progress-bar");

let songs;

let shuffleMode = false;

let currentFolder;
function secToMin(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }
  seconds = Math.floor(seconds);
  let minutes = Math.floor(seconds / 60);
  let secs = seconds % 60;

  if (secs < 10) {
    secs = "0" + secs;
  }

  return minutes + ":" + secs;
}
async function getSongs(folder) {
  currentFolder = folder;
  let a = await fetch(`/${currentFolder}`);

  let reposnse = await a.text();
  // console.log(reposnse)

  let div = document.createElement("div");
  div.innerHTML = reposnse;
  let as = div.getElementsByTagName("a");
  // console.log(as)
  songs = [];
  for (let i = 0; i < as.length; i++) {
    let element = as[i];
    if (element.href.endsWith(".mp3")) {
      songs.push(element.href.split("%5C")[3].replace(".mp3", ""));
    }
  }

  let songUl = document
    .querySelector(".song-list")
    .getElementsByTagName("ul")[0];
  songUl.innerHTML = "";
  for (const song of songs) {
    songUl.innerHTML =
      songUl.innerHTML +
      `<li> <img src="img/music.svg" width="34" class="invert">
                             <div class="info">
                                <div> ${song.replaceAll("%20", " ")}</div>
                                <div>Krishna</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="img/play.svg" alt="">
                            </div>
                        </li>`;
  }

  // play music on click
  //  Attach an event listener to each song
  Array.from(
    document.querySelector(".song-list").getElementsByTagName("li"),
  ).forEach((e) => {
    // console.log(e.querySelector(".info>div").innerHTML.trim());
    e.addEventListener("click", (element) => {
      playMusic(e.querySelector(".info>div").innerHTML.trim());
    });
  });

  return songs;
}

const playMusic = (track, pause = false) => {
  // let audio=new Audio("/sample-songs-master/"+track+".mp3");
  // audio.play();
  currentSong.src = `/${currentFolder}` + track + ".mp3";
  if (!pause) {
    currentSong.play();
    play.src = "img/pause.svg";
  }

  document.querySelector(".song-name").innerHTML = decodeURI(track);
  document.querySelector(".album-pic").src =
    `${currentFolder}/album-arts/` + decodeURI(track) + ".jpg";
  // console.log(document.querySelector(".album-pic").src);
};

async function displayAlbum() {
  let a = await fetch("/songs/");
  let response = await a.text();
  let div = document.createElement("div");
  div.innerHTML = response;
  let anchors = Array.from(div.getElementsByTagName("a"));

  let cardContainer = document.querySelector(".card-container");

  for (const e of anchors) {
    try {
      // get raw href, decode and normalize backslashes to forward slashes
      let raw = e.getAttribute("href") || e.href || "";
      raw = decodeURIComponent(raw);
      raw = raw.replace(/\\/g, "/");

      // find the songs folder segment
      const idx = raw.indexOf("/songs/");
      if (idx === -1) continue;

      // extract folder name immediately after /songs/
      let remainder = raw.slice(idx + "/songs/".length).replace(/^\/+|\/+$/g, "");
      const folder = remainder.split("/")[0];
      if (!folder) continue;

      // fetch album info.json (skip if not found)
      const infoRes = await fetch(`/songs/${folder}/info.json`);
      if (!infoRes.ok) continue;
      const info = await infoRes.json();

      cardContainer.innerHTML += `
        <div class="card" data-folder="${folder}">
          <div class="play"><svg width="45" height="45" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="11" fill="#1DB954" />
              <polygon points="10,8 16,12 10,16" fill="black" />
            </svg>
          </div>

          <img src="songs/${folder}/cover.jpg" class="card-img">
          <p class="card-title">${info.title}</p>
          <p class="card-body">${info.description}</p>
        </div>
      `;
    } catch (err) {
      console.warn("displayAlbum parse error:", err);
    }
  }

  // attach click handlers to newly added cards
  // load playlist whenever card is clicked
  Array.from(cardContainer.querySelectorAll(".card")).forEach((el) => {
    el.addEventListener("click", async (item) => {
      songs = await getSongs(`songs/${item.currentTarget.dataset.folder}/`);
      playMusic(songs[0]); 
    });
  });
}

async function main() {
  await getSongs("songs/ncs/");
  // console.log(songs);
  playMusic(songs[0], true);

  // display all albums on the page
  displayAlbum();

  // // play the first song
  // var audio = new Audio(songs[0]);
  // audio.play();

  // Attach an event luistener to play , next and previous
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "assets/player_icon3.png";
    }
  });

  currentSong.addEventListener("timeupdate", () => {
    // console.log(currentSong.currentTime,currentSong.duration)
    document.querySelector(".curr-time").innerHTML = secToMin(
      currentSong.currentTime,
    );
    document.querySelector(".total-time").innerHTML = secToMin(
      currentSong.duration,
    );
    let progress = (currentSong.currentTime / currentSong.duration) * 100;
    document.querySelector(".progress-bar").value = progress;

    if (currentSong.ended) {
      currentSong.pause();
      play.src = "assets/player_icon3.png";
      progressBar.value = 0;
    }
  });

  // slide through the song via seekbar
  progressBar.addEventListener("input", () => {
    currentSong.currentTime = (progressBar.value / 100) * currentSong.duration;
  });

  // event listener for previous
  previous.addEventListener("click", () => {
    // currentSong.pause();
    // console.log("previous clicked")
    if (shuffleMode) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * songs.length);
      } while (
        songs[randomIndex] ===
        currentSong.src.split("/").slice(-1)[0].replace(".mp3", "")
      );

      playMusic(songs[randomIndex]);
      return;
    }

    let index = songs.indexOf(
      currentSong.src.split("/").slice(-1)[0].replace(".mp3", ""),
    );
    if (index > 0) {
      playMusic(songs[index - 1]);
    }
  });

  // event listener for next
  next.addEventListener("click", () => {
    // currentSong.pause();
    // console.log("next clicked")
    if (shuffleMode) {
      let randomIndex;

      do {
        randomIndex = Math.floor(Math.random() * songs.length);
      } while (
        songs[randomIndex] ===
        currentSong.src.split("/").slice(-1)[0].replace(".mp3", "")
      );

      playMusic(songs[randomIndex]);
      return;
    }
    let index = songs.indexOf(
      currentSong.src.split("/").slice(-1)[0].replace(".mp3", ""),
    );
    // console.log(songs)

    if (index < songs.length - 1) {
      playMusic(songs[index + 1]);
    }
  });

  // event listener for loop
  loop.addEventListener("click", () => {
    let clicked = loop.classList.toggle("active");
    currentSong.loop = !!clicked;
    // document.querySelector(".loop").sty
  });

  // event listener for shuffle
  shuffle.addEventListener("click", () => {
    shuffleMode = !shuffleMode;
    let clicked = shuffle.classList.toggle("active");
  });

  // unified volume + mute handling (simplified)
  const volumeBar = document.querySelector('.volume-bar');
  const volumeIcon = document.querySelector('.volume-icon');
  let prevVolume = currentSong.volume || 0.1;

  if (volumeBar) {
    // initialize slider to current volume
    volumeBar.value = String(Math.round(prevVolume * 100));
    volumeBar.addEventListener('input', (e) => {
      const v = Number(e.target.value) / 100;
      currentSong.volume = v;
      if (v > 0) prevVolume = v;
      if (volumeIcon) volumeIcon.src = v === 0 ? 'img/mute.svg' : './assets/controls_icon5.png';
    });
  }

  if (volumeIcon) {
    volumeIcon.style.cursor = 'pointer';
    volumeIcon.addEventListener('click', () => {
      if (currentSong.volume === 0) {
        // unmute
        currentSong.volume = prevVolume;
        if (volumeBar) volumeBar.value = String(Math.round(prevVolume * 100));
        volumeIcon.src = './assets/controls_icon5.png';
      } else {
        prevVolume = currentSong.volume || prevVolume;
        currentSong.volume = 0;
        if (volumeBar) volumeBar.value = '0';
        volumeIcon.src = 'img/mute.svg';
      }
    });
  }

} // end main

main();
