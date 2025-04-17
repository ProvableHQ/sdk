export function removeVisbilityModifiers(obj) {
    if (typeof obj === 'string') {
        return obj.replace(".private", "").replace(".public", "");
    } else if (Array.isArray(obj)) {
        return obj.map(item => removeVisbilityModifiers(item));
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            newObj[key] = removeVisbilityModifiers(obj[key]);
        }
        return newObj;
    } else {
        return obj; // numbers, booleans, null, undefined, functions, etc.
    }
}