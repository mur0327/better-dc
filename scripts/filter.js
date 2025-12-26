/**
 * @fileoverview 이미지/영상 블러 필터 모듈
 * 게시글 내 미디어에 블러 필터를 적용하고, 우클릭으로 해제할 수 있게 합니다.
 */

/**
 * 필터 모듈을 초기화합니다.
 * @param {Function} log - 로깅 함수
 * @returns {Promise<void>}
 */
export async function initFilter(log) {
  "use strict";

  /**
   * 우클릭 시 모든 대상 요소의 필터를 해제합니다.
   * @param {HTMLElement} element - 이벤트를 바인딩할 요소
   * @param {HTMLElement[]} targets - 필터를 해제할 대상 요소 배열
   * @returns {void}
   */
  function addContextMenuListener(element, targets) {
    element.addEventListener(
      "contextmenu",
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        targets.forEach((target) => {
          target.classList.add("filter_removed");
        });
      },
      { once: true }
    );
  }

  /**
   * 지정된 선택자 내의 모든 미디어 요소에 필터 리스너를 추가합니다.
   * @param {string} selector - 컨테이너 선택자
   * @param {{image: string, video: string}} tags - 미디어 태그 선택자
   * @returns {void}
   */
  function addFilterListeners(selector, tags) {
    const images = document.querySelectorAll(`${selector} ${tags.image}`);
    const videos = document.querySelectorAll(`${selector} ${tags.video}`);
    const allMedia = [...images, ...videos];

    if (allMedia.length > 0) {
      allMedia.forEach((media) => {
        addContextMenuListener(media, allMedia);
      });
      log(addFilterListeners, "success", `count: ${allMedia.length}`);
    }
  }

  /**
   * DOM 변경을 감지하여 동적으로 추가되는 미디어에도 필터를 적용합니다.
   * @param {string} selector - 관찰할 컨테이너 선택자
   * @param {{image: string, video: string}} tags - 미디어 태그 선택자
   * @param {Function} callback - 새 미디어 감지 시 실행할 콜백
   * @returns {void}
   */
  function observeElement(selector, tags, callback) {
    addFilterListeners(selector, tags);

    const existingImages = new WeakSet();
    const images = document.querySelectorAll(`${selector} ${tags.image}`);
    images.forEach((image) => {
      existingImages.add(image);
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.matches(`${selector} ${tags.image}`)) {
            if (!existingImages.has(node)) {
              existingImages.add(node);
              node.classList.add("filter_removed");
              callback();
              observer.disconnect();
            }
          }
        });
      });
    });

    const targetNode = document.querySelector(selector);
    if (targetNode) {
      observer.observe(targetNode, {
        childList: true,
        subtree: true,
      });
    }
  }

  /**
   * 필터 기능을 초기화합니다.
   * @returns {void}
   */
  function initializeFilter() {
    const selector = ".write_div";
    const tags = {
      image: 'img:not([alt="매니저 차단 이미지"]):not(.written_dccon)',
      video: "video",
    };

    observeElement(selector, tags, () => {
      log(observeElement, "success");
      addFilterListeners(selector, tags);
    });

    log(initializeFilter, "success");
  }

  initializeFilter();
}
