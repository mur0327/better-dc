export async function main(log) {
  "use strict";

  // URL 파라미터 파싱
  const params = new URLSearchParams(window.location.search);
  const galleryId = params.get("id");
  const currentPostNo = params.get("no");
  const currentPage = parseInt(params.get("page")) || 1;
  const baseURL = "https://gall.dcinside.com/mgallery/board";

  // 개념글 파라미터 확인
  const isRecommendPage = params.get("exception_mode") === "recommend";
  const modeParam = isRecommendPage ? "&exception_mode=recommend" : "";

  // 말머리 확인
  const categoryNumber = params.get("search_head") || null;
  const categoryParam = categoryNumber ? `&search_head=${categoryNumber}` : "";

  // 게시글 목록 페이지에서 게시글 번호 목록을 가져오는 함수
  // 네트워크 실패 시 캐시된 목록을 폴백으로 사용
  async function fetchPostNumbers(page) {
    const galleryURL = `${baseURL}/lists/?id=${galleryId}${modeParam}${categoryParam}&page=${page}`;
    const cacheKey = `postList_${galleryId}_${page}${modeParam}${categoryParam}`;

    try {
      const response = await fetch(galleryURL);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const postElements = doc.querySelectorAll('.ub-content.us-post[data-type^="icon_recom"]');
      const postNumbers = Array.from(postElements).map((post) => post.getAttribute("data-no"));

      // 성공 시 캐시에 저장
      sessionStorage.setItem(cacheKey, JSON.stringify(postNumbers));
      log(fetchPostNumbers, "success", `page: ${page}`);
      return postNumbers;
    } catch (error) {
      log(fetchPostNumbers, "warn", `fetch failed: ${error}`);

      // 실패 시 캐시에서 폴백
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        log(fetchPostNumbers, "fallback", `using cached data for page: ${page}`);
        return JSON.parse(cached);
      }

      log(fetchPostNumbers, "fail", `no cache available for page: ${page}`);
      return [];
    }
  }

  // 이전 글, 다음 글 버튼 생성
  function createNavButton(type, postNo, page) {
    const href = `${baseURL}/view/?id=${galleryId}&no=${postNo}${modeParam}${categoryParam}&page=${page}`;
    const label = type === "prev" ? "이전글" : "다음글";
    const className = type === "prev" ? "btnPrev" : "btnNext";

    function createButton() {
      const a = document.createElement("a");
      a.href = href;
      a.innerHTML = label;
      a.className = className;
      return a;
    }

    // .view_bottom_btnbox > .fl 옆에 버튼 추가
    // .list_bottom_btnbox > .fl 옆에 버튼 추가
    const viewBottomBtnbox = document.querySelector(".view_bottom_btnbox > .fl");
    const listBottomBtnbox = document.querySelector(".list_bottom_btnbox > .fl");

    if (viewBottomBtnbox) viewBottomBtnbox.appendChild(createButton());
    if (listBottomBtnbox) listBottomBtnbox.appendChild(createButton());

    log(createNavButton, "success", `type: ${type}`);
  }

  async function addNavButtons() {
    log(addNavButtons, "info", `isRecommendPage: ${isRecommendPage}, categoryNumber: ${categoryNumber}`);

    // 개념글 페이지가 아닐 경우 종료
    if (!isRecommendPage) {
      return;
    }

    // 현재 페이지의 게시글 번호 목록 가져오기
    const currentPagePosts = await fetchPostNumbers(currentPage);
    const currentIndex = currentPagePosts.indexOf(currentPostNo);

    // 현재 페이지에서 이전글/다음글 결정
    const prevPostNo = currentIndex < currentPagePosts.length - 1 ? currentPagePosts[currentIndex + 1] : null;
    const nextPostNo = currentIndex > 0 ? currentPagePosts[currentIndex - 1] : null;

    // 이전글 없으면 다음 페이지 첫 글 가져오기
    if (prevPostNo === null) {
      const nextPagePosts = await fetchPostNumbers(currentPage + 1);
      if (nextPagePosts.length > 0) {
        createNavButton("prev", nextPagePosts[0], currentPage + 1);
      }
    } else {
      createNavButton("prev", prevPostNo, currentPage);
    }
    // 다음글 없으면 이전 페이지 마지막 글 가져오기
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
