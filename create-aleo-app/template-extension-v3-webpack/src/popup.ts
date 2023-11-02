import '../styles/popup.scss';

document.getElementById('go-to-options').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});
