/**
 * @fileoverview 동영상 볼륨 자동 설정 모듈
 * DCInside 동영상의 기본 볼륨을 쿠키를 통해 설정합니다.
 */

/**
 * 볼륨 모듈을 초기화합니다.
 * @param {Function} log - 로깅 함수
 * @returns {Promise<void>}
 */
export async function initVolume(log) {
  "use strict";

  const DESIRED_VOLUME = 0.1;

  /**
   * 동영상 볼륨 쿠키를 설정합니다.
   * @returns {void}
   */
  function setVolumeCookie() {
    document.cookie = `video_v=${DESIRED_VOLUME}; domain=.dcinside.com; path=/`;
  }

  setVolumeCookie();
  log(setVolumeCookie, "success", `set cookie video_v=${DESIRED_VOLUME}`);
}
