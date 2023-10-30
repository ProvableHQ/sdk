import * as Aleo from '@aleohq/wasm'
function reddenPage() {
    document.body.style.backgroundColor = 'red';
}

chrome.action.onClicked.addListener(async (tab) => {
    const account = new Aleo.PrivateKey();
    if (!tab.url.includes('chrome://')) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: reddenPage
        });
    }
});