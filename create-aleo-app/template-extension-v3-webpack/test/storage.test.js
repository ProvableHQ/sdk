import expect from 'expect.js';
import { getStorageData, setStorageData } from '../src/storage.ts';

// The "npm test" command will run all test files and also create a coverage report using c8
describe('storage.ts', () => {
  it('should be able to get storage data', async () => {
    getStorageData().then((data) => {
      expect(data).to.be.an('object');
      expect(data).to.be.empty();
    });
  });

  it('should be able to set storage data', async () => {
    setStorageData({ test: 'test' }).then(() => {
      getStorageData().then((data) => {
        expect(data).to.be.an('object');
        expect(data).to.have.property('test');
        expect(data.test).to.be('test');
      });
    });
  });
});