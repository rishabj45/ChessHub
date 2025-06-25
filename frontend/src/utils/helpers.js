// frontend/src/utils/helpers.ts
export function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US');
}
export function compareDesc(a, b) {
    if (a < b)
        return 1;
    if (a > b)
        return -1;
    return 0;
}
