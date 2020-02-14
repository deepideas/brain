function colorToRGB(color) {
    var r = color >> 16;
    var g = color >> 8 & 255;
    var b = color & 255;
    return [r, g, b];
}
function removeByValue(arr) {
    var what, a = arguments, L = a.length, ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax= arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}
