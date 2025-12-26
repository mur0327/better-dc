/**
 * @fileoverview BetterDC 팝업 설정 페이지
 * 사용자 설정을 chrome.storage.sync에 저장합니다.
 */

const DEFAULT_SETTINGS = {
  filterEnabled: true,
  volume: 10,
};

const filterToggle = document.getElementById("filterEnabled");
const volumeSlider = document.getElementById("volumeSlider");
const volumeValue = document.getElementById("volumeValue");
const saveStatus = document.getElementById("saveStatus");

/**
 * 슬라이더의 배경 그라데이션을 업데이트합니다.
 * @param {HTMLInputElement} slider - 슬라이더 요소
 * @returns {void}
 */
function updateSliderBackground(slider) {
  const value = slider.value;
  const percentage = value;
  slider.style.background = `linear-gradient(to right, #3b4890 0%, #3b4890 ${percentage}%, #d1d5db ${percentage}%, #d1d5db 100%)`;
}

/**
 * 설정을 저장하고 상태 메시지를 표시합니다.
 * @param {object} settings - 저장할 설정
 * @returns {void}
 */
function saveSettings(settings) {
  chrome.storage.sync.set(settings, () => {
    saveStatus.textContent = "저장됨";
    saveStatus.classList.add("show");
    setTimeout(() => {
      saveStatus.classList.remove("show");
    }, 1500);
  });
}

/**
 * 저장된 설정을 불러와 UI에 반영합니다.
 * @returns {void}
 */
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    filterToggle.checked = settings.filterEnabled;
    volumeSlider.value = settings.volume;
    volumeValue.textContent = `${settings.volume}%`;
    updateSliderBackground(volumeSlider);
  });
}

// 이벤트 리스너
filterToggle.addEventListener("change", () => {
  saveSettings({ filterEnabled: filterToggle.checked });
});

volumeSlider.addEventListener("input", () => {
  volumeValue.textContent = `${volumeSlider.value}%`;
  updateSliderBackground(volumeSlider);
});

volumeSlider.addEventListener("change", () => {
  saveSettings({ volume: parseInt(volumeSlider.value) });
});

// 초기 로드
loadSettings();
