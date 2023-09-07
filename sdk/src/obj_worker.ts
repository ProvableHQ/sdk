import { expose } from 'comlink';

const obj = {
    counter: 0,
    inc() {
        this.counter++;
    },
};

expose(obj);