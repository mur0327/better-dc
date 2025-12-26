(async () => {
  const srcLogger = chrome.runtime.getURL("scripts/logger.js");
  const { log } = await import(srcLogger);

  const srcFilter = chrome.runtime.getURL("scripts/filter.js");
  const { main: mainFilter } = await import(srcFilter);

  const srcNav = chrome.runtime.getURL("scripts/post-navigation.js");
  const { main: mainNav } = await import(srcNav);

  const srcComment = chrome.runtime.getURL("scripts/comment.js");
  const { main: mainComment } = await import(srcComment);

  const srcVolume = chrome.runtime.getURL("scripts/volume.js");
  const { main: mainVolume } = await import(srcVolume);

  log("main", "info", "starting execution...");

  async function runScripts() {
    try {
      await mainFilter(log);
      await mainNav(log);
      await mainComment(log);
      await mainVolume(log);
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
