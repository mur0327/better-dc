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

  const {
    postListSelector,
    cachePrefix = "betterdc_nav_posts",
    fetchCooldownMs = 1500,
  } = config.navigation;

  // LEGACY(2026-02): 본문 하단/댓글 하단 버튼 삽입 컨테이너 선택자.
  // 고정 네비게이션 컨테이너 방식으로 변경되어 현재는 사용하지 않습니다.
  // const { buttonContainerSelectors } = config.navigation;

  // 현재 URL을 기반으로 갤러리 타입 판별
  const isMinorGallery = window.location.pathname.includes("/mgallery/");
  const baseURL = isMinorGallery ? config.baseURL.minor : config.baseURL.regular;

  log(initNavigation, "info", `galleryType: ${isMinorGallery ? "minor" : "regular"}`);

  const params = new URLSearchParams(window.location.search);
  const galleryId = params.get("id");
  const currentPostNo = params.get("no");
  const currentPage = parseInt(params.get("page"), 10) || 1;

  const isRecommendPage = params.get("exception_mode") === "recommend";
  const modeParam = isRecommendPage ? "&exception_mode=recommend" : "";
  const modeKey = isRecommendPage ? "recommend" : "normal";

  const categoryNumber = params.get("search_head") || null;
  const categoryParam = categoryNumber ? `&search_head=${categoryNumber}` : "";
  const categoryKey = categoryNumber || "all";
  const galleryTypeKey = isMinorGallery ? "minor" : "regular";

  const inFlightRequests = new Map();
  const globalFetchThrottleKey = `${cachePrefix}_last_fetch_at`;

  /**
   * 캐시 키를 생성합니다.
   * @param {number} page - 페이지 번호
   * @returns {string}
   */
  function buildCacheKey(page) {
    return `${cachePrefix}_${galleryTypeKey}_${galleryId}_${modeKey}_${categoryKey}_${page}`;
  }

  /**
   * 캐시에서 게시글 번호 배열을 읽습니다.
   * @param {number} page - 페이지 번호
   * @returns {string[]}
   */
  function readCachedPostNumbers(page) {
    const cacheKey = buildCacheKey(page);
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return [];

    try {
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed) ? parsed.filter((postNo) => typeof postNo === "string" && postNo.length > 0) : [];
    } catch (error) {
      log(readCachedPostNumbers, "warn", `cache parse failed: page=${page}, error=${error}`);
      return [];
    }
  }

  /**
   * 게시글 번호 배열을 캐시에 저장합니다.
   * @param {number} page - 페이지 번호
   * @param {string[]} postNumbers - 게시글 번호 배열
   * @returns {void}
   */
  function writeCachedPostNumbers(page, postNumbers) {
    if (postNumbers.length === 0) return;
    sessionStorage.setItem(buildCacheKey(page), JSON.stringify(postNumbers));
  }

  /**
   * 목록 문서에서 게시글 번호를 추출합니다.
   * @param {Document} doc - 목록 HTML 문서
   * @returns {string[]}
   */
  function extractPostNumbers(doc) {
    return Array.from(doc.querySelectorAll(postListSelector))
      .map((post) => post.getAttribute("data-no"))
      .filter((postNo) => typeof postNo === "string" && postNo.length > 0);
  }

  /**
   * 목록 페이지 URL을 생성합니다.
   * @param {number} page - 가져올 페이지 번호
   * @returns {string}
   */
  function buildListURL(page) {
    return `${baseURL}/lists/?id=${galleryId}${modeParam}${categoryParam}&page=${page}`;
  }

  /*
   * LEGACY(2026-02): 기존 구현은 호출 시점마다 네트워크를 우선 요청했습니다.
   * 빠른 이전글/다음글 연타 시 fetch가 누적되어 IP 차단 위험이 커져, 캐시 우선 전략으로 대체했습니다.
   *
   * async function fetchPostNumbers(page) {
   *   const galleryURL = `${baseURL}/lists/?id=${galleryId}${modeParam}${categoryParam}&page=${page}`;
   *   const cacheKey = `postList_${galleryId}_${page}${modeParam}${categoryParam}`;
   *
   *   try {
   *     const response = await fetch(galleryURL);
   *     if (!response.ok) throw new Error(`HTTP ${response.status}`);
   *
   *     const html = await response.text();
   *     const parser = new DOMParser();
   *     const doc = parser.parseFromString(html, "text/html");
   *     const postElements = doc.querySelectorAll(postListSelector);
   *     const postNumbers = Array.from(postElements).map((post) => post.getAttribute("data-no"));
   *
   *     sessionStorage.setItem(cacheKey, JSON.stringify(postNumbers));
   *     log(fetchPostNumbers, "success", `page: ${page}`);
   *     return postNumbers;
   *   } catch (error) {
   *     log(fetchPostNumbers, "warn", `fetch failed: ${error}`);
   *
   *     const cached = sessionStorage.getItem(cacheKey);
   *     if (cached) {
   *       log(fetchPostNumbers, "fallback", `using cached data for page: ${page}`);
   *       return JSON.parse(cached);
   *     }
   *
   *     log(fetchPostNumbers, "fail", `no cache available for page: ${page}`);
   *     return [];
   *   }
   * }
   */

  /**
   * 게시글 번호 목록을 가져옵니다.
   * 1) 세션 캐시 우선
   * 2) 캐시 미스 시 네트워크 (쿨다운 적용)
   * @param {number} page - 가져올 페이지 번호
   * @param {{allowNetwork?: boolean}} [options] - 네트워크 허용 옵션
   * @returns {Promise<string[]>}
   */
  async function fetchPostNumbers(page, options = {}) {
    const { allowNetwork = true } = options;
    const cached = readCachedPostNumbers(page);
    if (cached.length > 0) {
      log(fetchPostNumbers, "info", `cache hit: page=${page}`);
      return cached;
    }

    if (!allowNetwork) {
      log(fetchPostNumbers, "info", `cache miss and network disabled: page=${page}`);
      return [];
    }

    const cacheKey = buildCacheKey(page);
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey);
    }

    const task = (async () => {
      const now = Date.now();
      const lastFetchAt = Number(sessionStorage.getItem(globalFetchThrottleKey) || 0);

      if (now - lastFetchAt < fetchCooldownMs) {
        log(
          fetchPostNumbers,
          "warn",
          `network skipped by cooldown: page=${page}, elapsed=${now - lastFetchAt}ms, cooldown=${fetchCooldownMs}ms`,
        );
        return [];
      }

      sessionStorage.setItem(globalFetchThrottleKey, String(now));

      const galleryURL = buildListURL(page);

      try {
        const response = await fetch(galleryURL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const postNumbers = extractPostNumbers(doc);

        writeCachedPostNumbers(page, postNumbers);
        log(fetchPostNumbers, "success", `network fetched and cached: page=${page}`);
        return postNumbers;
      } catch (error) {
        log(fetchPostNumbers, "warn", `fetch failed: page=${page}, error=${error}`);
        return [];
      }
    })();

    inFlightRequests.set(cacheKey, task);
    try {
      return await task;
    } finally {
      inFlightRequests.delete(cacheKey);
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
    if (!postNo) {
      log(createNavButton, "warn", `button skipped: type=${type}, invalid postNo=${postNo}`);
      return;
    }

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

    // LEGACY(2026-02): 본문 하단/댓글 하단 삽입 방식은 스크롤 이동량이 커 접근성이 낮았습니다.
    // 고정 위치 컨테이너로 전환하여 언제든 동일한 위치에서 탐색 가능하도록 변경했습니다.
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
   * 댓글 바로보기 버튼을 생성하고 DOM에 추가합니다.
   * @returns {void}
   */
  function createCommentButton() {
    const commentSection = document.getElementById("focus_cmt");
    if (!commentSection) {
      log(createCommentButton, "warn", "comment section not found");
      return;
    }

    const container = createFixedNavContainer();

    const button = document.createElement("button");
    button.innerHTML = "댓글";
    button.className = "btnComment";
    button.addEventListener("click", () => {
      const rect = commentSection.getBoundingClientRect();
      window.scrollTo(window.scrollX, window.scrollY + rect.top);
    });

    container.appendChild(button);
    log(createCommentButton, "success", "comment button added");
  }

  /**
   * 이전글/다음글 버튼을 분석하고 추가합니다.
   * @returns {Promise<void>}
   */
  async function addNavButtons() {
    log(addNavButtons, "info", `isRecommendPage: ${isRecommendPage}, categoryNumber: ${categoryNumber}`);

    if (!galleryId || !currentPostNo) {
      log(addNavButtons, "warn", `invalid params: id=${galleryId}, no=${currentPostNo}`);
      return;
    }

    if (!isRecommendPage) {
      return;
    }

    // LEGACY(2026-02): 항상 네트워크 fetch를 먼저 수행하던 방식.
    // 빠른 연속 탐색 시 요청이 누적되어 차단 위험이 있어 캐시 우선 구조로 변경했습니다.
    // const currentPagePosts = await fetchPostNumbers(currentPage);

    const currentPagePosts = await fetchPostNumbers(currentPage, { allowNetwork: true });
    const currentIndex = currentPagePosts.indexOf(currentPostNo);

    if (currentIndex === -1) {
      log(addNavButtons, "warn", `current post not found in list. postNo=${currentPostNo}, page=${currentPage}`);
      return;
    }

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

    if (nextPostNo === null) {
      if (currentPage > 1) {
        const prevPagePosts = await fetchPostNumbers(currentPage - 1);
        if (prevPagePosts.length > 0) {
          createNavButton("next", prevPagePosts[prevPagePosts.length - 1], currentPage - 1);
        }
      } else {
        log(addNavButtons, "info", "next post not found on first page");
      }
    } else {
      createNavButton("next", nextPostNo, currentPage);
    }
  }

  await addNavButtons();

  // 게시글 페이지에서 댓글 바로보기 버튼 추가
  if (window.location.pathname.includes("/view")) {
    createCommentButton();
  }
}
