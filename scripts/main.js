/**
 * BetterDC 확장 프로그램의 메인 진입점
 * 모든 기능 모듈을 로드하고 순차적으로 실행합니다.
 */
(async () => {
  const srcLogger = chrome.runtime.getURL("scripts/logger.js");
  const { log } = await import(srcLogger);

  log("main", "info", "starting execution...");

  const modules = [
    { name: "filter", fn: "initFilter" },
    { name: "post-navigation", fn: "initNavigation" },
    { name: "comment", fn: "initComment" },
    { name: "volume", fn: "initVolume" },
  ];

  /**
   * 정의된 모듈들을 순차적으로 로드하고 실행합니다.
   * @returns {Promise<void>}
   */
  async function runScripts() {
    try {
      for (const { name, fn } of modules) {
        const src = chrome.runtime.getURL(`scripts/${name}.js`);
        const module = await import(src);
        await module[fn](log);
      }
    } catch (error) {
      log("main", "fail", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runScripts);
  } else {
    runScripts();
  }
})();
