export async function main(log) {
  "use strict";

  const DESIRED_VOLUME = 0.1;

  function setVolumeCookie() {
    document.cookie = `video_v=${DESIRED_VOLUME}; domain=.dcinside.com; path=/`;
  }

  setVolumeCookie();
  log(setVolumeCookie, "success", `set cookie video_v=${DESIRED_VOLUME}`);
}
