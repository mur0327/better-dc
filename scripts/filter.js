/**
 * @fileoverview 이미지/영상 블러 필터 모듈
 * 게시글 내 미디어에 블러 필터를 적용하고, 우클릭으로 해제할 수 있게 합니다.
 */

/**
 * 필터 모듈을 초기화합니다.
 * @param {Function} log - 로깅 함수
 * @param {object} config - 설정 객체
 * @param {object} userSettings - 사용자 설정 (미사용, 호환성 유지)
 * @returns {Promise<void>}
 */
export async function initFilter(log, config, userSettings) {
  "use strict";

  const { containerSelector, imageSelector, videoSelector } = config.filter;
  const combinedSelector = `${containerSelector} ${imageSelector}, ${containerSelector} ${videoSelector}`;

  const controller = new AbortController();

  document.addEventListener(
    "contextmenu",
    (event) => {
      const target = event.target.closest(combinedSelector);
      if (!target) return;

      event.preventDefault();
      event.stopPropagation();

      // MutationObserver 먼저 등록 (video → img 교체 즉시 캐치)
      new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.matches(combinedSelector)) {
              node.classList.add("filter_removed");
            }
          });
        });
      }).observe(document.body, { childList: true, subtree: true });

      document.querySelectorAll(combinedSelector).forEach((el) => {
        el.classList.add("filter_removed");
      });

      controller.abort(); // 리스너 제거
      log(initFilter, "success", "filter removed by contextmenu");
    },
    { signal: controller.signal },
  );

  log(initFilter, "success", "listener registered");
}
