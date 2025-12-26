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
  // chrome.runtime API를 사용할 수 없는 환경(예: Main World)에서는 기본값 사용
}

// 로그 출력 헬퍼 함수
export function log(func, status, message = "") {
  const styles = status === "success" ? logSuccessStyles : status === "fail" ? logFailStyles : logInfoStyles;
  const funcName = typeof func === "function" ? func.name : func;

  // 그룹으로 묶어서 출력하여 콘솔을 깔끔하게 유지하면서도, 필요시 스택 추적을 확인할 수 있게 함
  console.groupCollapsed(`%c ${extensionName} %c ${funcName} %c ${status} %c`, ...styles, message);

  // 메시지가 객체나 에러인 경우 상세 내용을 펼쳐서 볼 수 있도록 추가 출력
  if (typeof message === "object") {
    console.log("Details:", message);
  }

  // 호출 스택 추적 (이걸 통해 어디서 호출했는지 파일 위치를 알 수 있음)
  console.trace("Call Stack");

  console.groupEnd();
}
