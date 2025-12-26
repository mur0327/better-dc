/**
 * @fileoverview BetterDC 확장 프로그램의 로깅 유틸리티
 * 색상이 적용된 그룹화된 콘솔 로그를 제공합니다.
 */

const logInfoStyles = [
  "background: #3c498c; padding: 2px 4px; border-radius: 4px 0px 0px 4px; color: white;",
  "background: #192226; padding: 2px 4px; color: white;",
  "background: #0B73F5; padding: 2px 4px; border-radius: 0px 4px 4px 0px; color: white;",
  "",
];

const logSuccessStyles = [
  "background: #3c498c; padding: 2px 4px; border-radius: 4px 0px 0px 4px; color: white;",
  "background: #192226; padding: 2px 4px; color: white;",
  "background: #427d53; padding: 2px 4px; border-radius: 0px 4px 4px 0px; color: white;",
  "",
];

const logFailStyles = [
  "background: #3c498c; padding: 2px 4px; border-radius: 4px 0px 0px 4px; color: white;",
  "background: #192226; padding: 2px 4px; color: white;",
  "background: #da6e65; padding: 2px 4px; border-radius: 0px 4px 4px 0px; color: white;",
  "",
];

let extensionName = "BetterDC";
try {
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest) {
    extensionName = chrome.runtime.getManifest().name;
  }
} catch (e) {
  // chrome.runtime API를 사용할 수 없는 환경에서는 기본값 사용
}

/**
 * 스타일이 적용된 콘솔 로그를 출력합니다.
 * @param {Function|string} func - 로그를 호출한 함수 또는 함수 이름
 * @param {"info"|"success"|"fail"|"warn"|"fallback"} status - 로그 상태
 * @param {string|object|Error} [message=""] - 추가 메시지 또는 객체
 * @returns {void}
 */
export function log(func, status, message = "") {
  const styles = status === "success" ? logSuccessStyles : status === "fail" ? logFailStyles : logInfoStyles;
  const funcName = typeof func === "function" ? func.name : func;

  console.groupCollapsed(`%c ${extensionName} %c ${funcName} %c ${status} %c`, ...styles, message);

  if (typeof message === "object") {
    console.log("Details:", message);
  }

  console.trace("Call Stack");
  console.groupEnd();
}
