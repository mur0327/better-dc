export async function main(log) {
  "use strict";

  // 우클릭 이벤트 리스너 정의
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

  // 미디어 이벤트 리스너 추가
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

  // 움짤 클릭 시 생기는 img 태그 감지
  function observeElement(selector, tags, callback) {
    // 기존 미디어에 이벤트 리스너 추가
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

  function initializeFilter() {
    const selector = ".write_div";
    const tags = { image: 'img:not([alt="매니저 차단 이미지"]):not(.written_dccon)', video: "video" };

    observeElement(selector, tags, () => {
      log(observeElement, "success");
      addFilterListeners(selector, tags);
    });

    log(initializeFilter, "success");
  }

  initializeFilter();
}
