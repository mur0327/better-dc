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
      // 1. 정상적인 경우: 요소가 DOM에 붙어있어 부모 탐색 가능
      const isConnectedMatch = event.target.closest(combinedSelector);

      // 2. 예외 처리: 우클릭 직전 요소가 교체되어(video -> img) detached 상태인 경우
      // 부모 탐색(closest)은 실패하므로, 요소 자체의 셀렉터 매칭만 확인하여 처리 허용
      const isDetachedMatch = event.target.matches?.(imageSelector) || event.target.matches?.(videoSelector);

      if (!isConnectedMatch && !isDetachedMatch) return;

      event.preventDefault();
      event.stopPropagation();

      document.querySelectorAll(combinedSelector).forEach((el) => {
        el.classList.add("filter_removed");
      });

      controller.abort(); // 리스너 제거
      log(initFilter, "success", "filter removed by contextmenu");

      // 이후 추가되는 이미지/비디오도 자동 해제
      new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.matches(combinedSelector)) {
              node.classList.add("filter_removed");
            }
          });
        });
      }).observe(document.body, { childList: true, subtree: true });
    },
    { signal: controller.signal },
  );

  log(initFilter, "success", "listener registered");
}
