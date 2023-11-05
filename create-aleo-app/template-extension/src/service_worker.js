async function createOffscreen(path) {
    const offscreenUrl = chrome.runtime.getURL(path);

    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ["OFFSCREEN_DOCUMENT"],
        documentUrls: [offscreenUrl]
    });

    if (existingContexts.length > 0) {
        return;
    }

    await chrome.offscreen.createDocument({
        url: offscreenUrl,
        reasons: ["WORKERS"],
        justification: "Top-level await and Workers cannot be used in service workers, but they are necessary to use the Aleo SDK.",
    });
}

createOffscreen("offscreen.html");
