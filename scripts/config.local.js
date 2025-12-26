/**
 * @fileoverview BetterDC 확장 프로그램 설정 파일
 * 모든 하드코딩된 값들을 중앙에서 관리합니다.
 */

export const CONFIG = {
  // 사이트 도메인
  domain: ".dcinside.com",

  // 갤러리 기본 URL
  baseURL: {
    minor: "https://gall.dcinside.com/mgallery/board",
    regular: "https://gall.dcinside.com/board",
  },

  // 동영상 기본 볼륨 (0.0 ~ 1.0)
  defaultVolume: 0.1,

  // 필터 설정
  filter: {
    containerSelector: "div.view_content_wrap .writing_view_box .write_div",
    imageSelector: 'img:not([alt="매니저 차단 이미지"]):not(.written_dccon)',
    videoSelector: "video",
  },

  // 네비게이션 설정
  navigation: {
    postListSelector: '.ub-content.us-post[data-type^="icon_recom"]',
    buttonContainerSelectors: [".view_bottom_btnbox > .fl", ".list_bottom_btnbox > .fl"],
  },

  // 댓글 영역 설정
  comment: {
    containerSelector: "div.comment_count",
    numBoxSelector: "div.fl.num_box",
    refreshSelector: "div.fr",
    containerHeight: "82px",
  },

  // 로거 스타일
  logger: {
    extensionName: "BetterDC",
    styles: {
      info: [
        "background: #3c498c; padding: 2px 4px; border-radius: 4px 0px 0px 4px; color: white;",
        "background: #192226; padding: 2px 4px; color: white;",
        "background: #0B73F5; padding: 2px 4px; border-radius: 0px 4px 4px 0px; color: white;",
        "",
      ],
      success: [
        "background: #3c498c; padding: 2px 4px; border-radius: 4px 0px 0px 4px; color: white;",
        "background: #192226; padding: 2px 4px; color: white;",
        "background: #427d53; padding: 2px 4px; border-radius: 0px 4px 4px 0px; color: white;",
        "",
      ],
      warn: [
        "background: #3c498c; padding: 2px 4px; border-radius: 4px 0px 0px 4px; color: white;",
        "background: #192226; padding: 2px 4px; color: white;",
        "background: #d4a72c; padding: 2px 4px; border-radius: 0px 4px 4px 0px; color: white;",
        "",
      ],
      fail: [
        "background: #3c498c; padding: 2px 4px; border-radius: 4px 0px 0px 4px; color: white;",
        "background: #192226; padding: 2px 4px; color: white;",
        "background: #da6e65; padding: 2px 4px; border-radius: 0px 4px 4px 0px; color: white;",
        "",
      ],
    },
  },
};
