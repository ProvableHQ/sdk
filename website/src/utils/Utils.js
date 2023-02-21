function stringToUint8Array(str) {
    let arr = [];
    for (let i = 0, l = str.length; i < l; i ++) {
        let hex = Number(str.charCodeAt(i)).toString(16);
        arr.push(hex);
    }
    return new Uint8Array(arr);
}

export {stringToUint8Array}