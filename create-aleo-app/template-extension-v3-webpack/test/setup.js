// The chrome API won't be available in the test environment, so it has to be mocked
// Of course, you can remove this setup file if you don't want to test interactions with the chrome API
import sinonChrome from 'sinon-chrome';

global.chrome = sinonChrome;

let mockedStorage = {};

// These are just the most important methods, feel free to add more if needed 
chrome.storage.sync.get.callsFake(() => {
  return Promise.resolve(mockedStorage)
});

chrome.storage.sync.set.callsFake((obj) => {
  Object.assign(mockedStorage, obj);
  return Promise.resolve()
});

chrome.storage.sync.clear.callsFake(() => {
  for (const key in mockedStorage) {
    delete mockedStorage[key];
  }
  return Promise.resolve()
});

beforeEach(() => {
  chrome.storage.sync.set({});
});

afterEach(async function () {
  await chrome.storage.sync.clear();
});