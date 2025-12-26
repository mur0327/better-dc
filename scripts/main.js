/**
 * BetterDC 확장 프로그램의 메인 진입점
 * 모든 기능 모듈을 로드하고 순차적으로 실행합니다.
 */
(async () => {
  const srcConfig = chrome.runtime.getURL("scripts/config.local.js");
  const { CONFIG } = await import(srcConfig);

  const srcLogger = chrome.runtime.getURL("scripts/logger.js");
  const { log, initLogger } = await import(srcLogger);

  initLogger(CONFIG);
  log("main", "info", "starting execution...");

  // 사용자 설정 로드
  const userSettings = await new Promise((resolve) => {
    chrome.storage.sync.get({ filterEnabled: true, volume: 10 }, resolve);
  });

  log("main", "info", `userSettings: filterEnabled=${userSettings.filterEnabled}, volume=${userSettings.volume}`);

  // 필터 비활성화 시 body에 클래스 추가하여 CSS 블러 효과 제거
  if (!userSettings.filterEnabled) {
    document.documentElement.classList.add("betterdc-filter-disabled");
  }

  const modules = [
    { name: "filter", fn: "initFilter", enabled: userSettings.filterEnabled },
    { name: "post-navigation", fn: "initNavigation", enabled: true },
    { name: "comment", fn: "initComment", enabled: true },
    { name: "volume", fn: "initVolume", enabled: true },
  ];

  /**
   * 정의된 모듈들을 순차적으로 로드하고 실행합니다.
   * @returns {Promise<void>}
   */
  async function runScripts() {
    try {
      for (const { name, fn, enabled } of modules) {
        if (!enabled) {
          log("main", "info", `${name} disabled, skipping...`);
          continue;
        }
        const src = chrome.runtime.getURL(`scripts/${name}.js`);
        const module = await import(src);
        await module[fn](log, CONFIG, userSettings);
      }
    } catch (error) {
      log("main", "fail", error);
    }
  }

  // DOM이 이미 로드되었거나 로드 후 실행
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => runScripts());
  } else {
    await runScripts();
  }
})();
