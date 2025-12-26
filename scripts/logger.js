/**
 * @fileoverview BetterDC 확장 프로그램의 로깅 유틸리티
 * 색상이 적용된 그룹화된 콘솔 로그를 제공합니다.
 */

let loggerConfig = null;

/**
 * 설정을 초기화합니다.
 * @param {object} config - CONFIG 객체
 * @returns {void}
 */
export function initLogger(config) {
  loggerConfig = config.logger;
}

/**
 * 스타일이 적용된 콘솔 로그를 출력합니다.
 * @param {Function|string} func - 로그를 호출한 함수 또는 함수 이름
 * @param {"info"|"success"|"fail"|"warn"|"fallback"} status - 로그 상태
 * @param {string|object|Error} [message=""] - 추가 메시지 또는 객체
 * @returns {void}
 */
export function log(func, status, message = "") {
  const styles = loggerConfig?.styles || {};
  const extensionName = loggerConfig?.extensionName || "BetterDC";

  // fallback은 warn 스타일 사용
  const normalizedStatus = status === "fallback" ? "warn" : status;
  const selectedStyles = styles[normalizedStatus] || styles.info || ["", "", "", ""];

  const funcName = typeof func === "function" ? func.name : func;

  console.groupCollapsed(`%c ${extensionName} %c ${funcName} %c ${status} %c`, ...selectedStyles, message);

  if (typeof message === "object") {
    console.log("Details:", message);
  }

  console.trace("Call Stack");
  console.groupEnd();
}
