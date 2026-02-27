/**
 * @fileoverview 개념글 목록 페이지에서 게시글 번호를 선캐시하는 모듈
 * view 페이지에서 이전글/다음글 계산 시 불필요한 fetch를 줄이기 위해 사용합니다.
 */
(async () => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const isRecommendPage = params.get("exception_mode") === "recommend";
  if (!isRecommendPage) return;

  const galleryId = params.get("id");
  if (!galleryId) return;

  const page = parseInt(params.get("page"), 10) || 1;
  const categoryNumber = params.get("search_head") || null;
  const categoryKey = categoryNumber || "all";
  const galleryTypeKey = window.location.pathname.includes("/mgallery/") ? "minor" : "regular";

  const srcConfig = chrome.runtime.getURL("scripts/config.local.js");
  const { CONFIG } = await import(srcConfig);
  const { postListSelector, cachePrefix = "betterdc_nav_posts" } = CONFIG.navigation;

  /**
   * 현재 목록 DOM에서 게시글 번호를 수집해 세션 캐시에 저장합니다.
   * @returns {void}
   */
  function seedPostListCache() {
    const cacheKey = `${cachePrefix}_${galleryTypeKey}_${galleryId}_recommend_${categoryKey}_${page}`;
    const postNumbers = Array.from(document.querySelectorAll(postListSelector))
      .map((post) => post.getAttribute("data-no"))
      .filter((postNo) => typeof postNo === "string" && postNo.length > 0);

    if (postNumbers.length === 0) return;

    sessionStorage.setItem(cacheKey, JSON.stringify(postNumbers));
    sessionStorage.setItem(`${cachePrefix}_last_seeded_at`, String(Date.now()));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", seedPostListCache, { once: true });
  } else {
    seedPostListCache();
  }
})().catch((error) => {
  console.warn("[BetterDC][nav-cache-warmup] failed:", error);
});
