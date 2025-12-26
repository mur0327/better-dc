export async function main(log) {
  "use strict";

  function moveCommentBox() {
    const commentCountDiv = document.querySelector("div.comment_count");
    const numBoxDiv = commentCountDiv ? commentCountDiv.querySelector("div.fl.num_box") : null;
    const frDiv = commentCountDiv ? commentCountDiv.querySelector("div.fr") : null;

    if (commentCountDiv && numBoxDiv && frDiv) {
      commentCountDiv.style.height = "82px";

      // frDiv를 numBoxDiv 바로 위로 이동
      numBoxDiv.before(frDiv);

      // 스타일 조정: float 제거 및 블록화
      frDiv.style.float = "none";
      frDiv.style.display = "block";
      frDiv.style.textAlign = "left"; // 왼쪽 정렬

      // numBoxDiv도 float 제거 및 블록화
      numBoxDiv.style.float = "none";
      numBoxDiv.style.display = "block";

      log(moveCommentBox, "success", "moved refresh button above comment count");
    } else {
      log(moveCommentBox, "info", "elements not found");
    }
  }

  moveCommentBox();
}
