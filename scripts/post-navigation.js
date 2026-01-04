/**
 * @fileoverview 이전글/다음글 네비게이션 모듈
 * 개념글 모드에서 이전/다음 게시글로 이동할 수 있는 버튼을 추가합니다.
 */

/**
 * 네비게이션 모듈을 초기화합니다.
 * @param {Function} log - 로깅 함수
 * @param {object} config - 설정 객체
 * @param {object} userSettings - 사용자 설정 (미사용, 호환성 유지)
 * @returns {Promise<void>}
 */
export async function initNavigation(log, config, userSettings) {
  "use strict";

  const { postListSelector, buttonContainerSelectors } = config.navigation;

  // 현재 URL을 기반으로 갤러리 타입 판별
  const isMinorGallery = window.location.pathname.includes("/mgallery/");
  const baseURL = isMinorGallery ? config.baseURL.minor : config.baseURL.regular;

  log(initNavigation, "info", `galleryType: ${isMinorGallery ? "minor" : "regular"}`);

  const params = new URLSearchParams(window.location.search);
  const galleryId = params.get("id");
  const currentPostNo = params.get("no");
  const currentPage = parseInt(params.get("page")) || 1;

  const isRecommendPage = params.get("exception_mode") === "recommend";
  const modeParam = isRecommendPage ? "&exception_mode=recommend" : "";

  const categoryNumber = params.get("search_head") || null;
  const categoryParam = categoryNumber ? `&search_head=${categoryNumber}` : "";

  /**
   * 게시글 목록 페이지에서 게시글 번호 목록을 가져옵니다.
   * 네트워크 실패 시 캐시된 데이터를 폴백으로 사용합니다.
   * @param {number} page - 가져올 페이지 번호
   * @returns {Promise<string[]>} 게시글 번호 배열
   */
  async function fetchPostNumbers(page) {
    const galleryURL = `${baseURL}/lists/?id=${galleryId}${modeParam}${categoryParam}&page=${page}`;
    const cacheKey = `postList_${galleryId}_${page}${modeParam}${categoryParam}`;

    try {
      const response = await fetch(galleryURL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const postElements = doc.querySelectorAll(postListSelector);
      const postNumbers = Array.from(postElements).map((post) => post.getAttribute("data-no"));

      sessionStorage.setItem(cacheKey, JSON.stringify(postNumbers));
      log(fetchPostNumbers, "success", `page: ${page}`);
      return postNumbers;
    } catch (error) {
      log(fetchPostNumbers, "warn", `fetch failed: ${error}`);

      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        log(fetchPostNumbers, "fallback", `using cached data for page: ${page}`);
        return JSON.parse(cached);
      }

      log(fetchPostNumbers, "fail", `no cache available for page: ${page}`);
      return [];
    }
  }

  /**
   * 버튼 컨테이너의 위치를 본문 기준으로 업데이트합니다.
   * @param {HTMLElement} navContainer - 네비게이션 컨테이너
   */
  function updateNavPosition(navContainer) {
    const mainContainer = document.querySelector("main#container");
    if (!mainContainer) return;

    const rect = mainContainer.getBoundingClientRect();
    const buttonWidth = 100; // 버튼 너비 + 여백
    navContainer.style.left = `${rect.left - buttonWidth}px`;
  }

  /**
   * 고정 네비게이션 컨테이너를 생성하거나 기존 컨테이너를 반환합니다.
   * @returns {HTMLElement} 네비게이션 컨테이너 요소
   */
  function createFixedNavContainer() {
    let container = document.getElementById("betterdc-nav-container");
    if (container) return container;

    container = document.createElement("div");
    container.id = "betterdc-nav-container";
    document.body.appendChild(container);

    // 초기 위치 설정
    updateNavPosition(container);

    // 창 크기 변경 시 위치 재계산
    window.addEventListener("resize", () => updateNavPosition(container));

    return container;
  }

  /**
   * 이전글 또는 다음글 네비게이션 버튼을 생성하고 DOM에 추가합니다.
   * @param {"prev"|"next"} type - 버튼 타입
   * @param {string} postNo - 이동할 게시글 번호
   * @param {number} page - 해당 게시글이 속한 페이지 번호
   * @returns {void}
   */
  function createNavButton(type, postNo, page) {
    const href = `${baseURL}/view/?id=${galleryId}&no=${postNo}${modeParam}${categoryParam}&page=${page}`;
    const label = type === "prev" ? "이전글" : "다음글";
    const className = type === "prev" ? "btnPrev" : "btnNext";

    /**
     * 버튼 요소를 생성합니다.
     * @returns {HTMLAnchorElement}
     */
    function createButton() {
      const a = document.createElement("a");
      a.href = href;
      a.innerHTML = label;
      a.className = className;
      return a;
    }

    // 기존 로직: 본문 하단/댓글 하단에 버튼 추가
    // buttonContainerSelectors.forEach((selector) => {
    //   const container = document.querySelector(selector);
    //   if (container) container.appendChild(createButton());
    // });

    // 새 로직: 고정 위치 컨테이너에 버튼 추가
    const container = createFixedNavContainer();
    const button = createButton();

    // 다음글은 위에, 이전글은 아래에 배치
    if (type === "next") {
      container.prepend(button);
    } else {
      container.appendChild(button);
    }

    log(createNavButton, "success", `type: ${type}`);
  }

  /**
   * 이전글/다음글 버튼을 분석하고 추가합니다.
   * @returns {Promise<void>}
   */
  async function addNavButtons() {
    log(addNavButtons, "info", `isRecommendPage: ${isRecommendPage}, categoryNumber: ${categoryNumber}`);

    if (!isRecommendPage) {
      return;
    }

    const currentPagePosts = await fetchPostNumbers(currentPage);
    const currentIndex = currentPagePosts.indexOf(currentPostNo);

    const prevPostNo = currentIndex < currentPagePosts.length - 1 ? currentPagePosts[currentIndex + 1] : null;
    const nextPostNo = currentIndex > 0 ? currentPagePosts[currentIndex - 1] : null;

    if (prevPostNo === null) {
      const nextPagePosts = await fetchPostNumbers(currentPage + 1);
      if (nextPagePosts.length > 0) {
        createNavButton("prev", nextPagePosts[0], currentPage + 1);
      }
    } else {
      createNavButton("prev", prevPostNo, currentPage);
    }

    if (nextPostNo === null && currentPage > 1) {
      const prevPagePosts = await fetchPostNumbers(currentPage - 1);
      if (prevPagePosts.length > 0) {
        createNavButton("next", prevPagePosts[prevPagePosts.length - 1], currentPage - 1);
      }
    } else {
      createNavButton("next", nextPostNo, currentPage);
    }
  }

  await addNavButtons();
}
