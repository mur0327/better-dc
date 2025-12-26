/**
 * @fileoverview 댓글 영역 UI 개선 모듈
 * 댓글 새로고침 버튼의 위치를 조정하여 사용성을 개선합니다.
 */

/**
 * 댓글 모듈을 초기화합니다.
 * @param {Function} log - 로깅 함수
 * @param {object} config - 설정 객체
 * @returns {Promise<void>}
 */
export async function initComment(log, config) {
  "use strict";

  const { containerHeight } = config.comment;

  /**
   * 댓글 영역의 레이아웃을 재배치합니다.
   * 새로고침 버튼을 댓글 수 위로 이동시킵니다.
   * @returns {void}
   */
  function moveCommentBox() {
    const commentCountDiv = document.querySelector("div.comment_count");
    const numBoxDiv = commentCountDiv ? commentCountDiv.querySelector("div.fl.num_box") : null;
    const frDiv = commentCountDiv ? commentCountDiv.querySelector("div.fr") : null;

    if (commentCountDiv && numBoxDiv && frDiv) {
      commentCountDiv.style.height = containerHeight;

      numBoxDiv.before(frDiv);

      frDiv.style.float = "none";
      frDiv.style.display = "block";
      frDiv.style.textAlign = "left";

      numBoxDiv.style.float = "none";
      numBoxDiv.style.display = "block";

      log(moveCommentBox, "success", "moved refresh button above comment count");
    } else {
      log(moveCommentBox, "info", "elements not found");
    }
  }

  moveCommentBox();
}
