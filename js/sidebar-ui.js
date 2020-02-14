function compress(id) {
    var obj = $("#" + id);
    obj.find(".compressable").fadeOut();
    obj.find(".compress-button").css("display", "none");
    obj.find(".decompress-button").css("display", "block");
    obj.css("flex", "0");
}
function decompress(id) {
    var obj = $("#" + id);
    obj.find(".compressable").fadeIn();
    obj.find(".compress-button").css("display", "block");
    obj.find(".decompress-button").css("display", "none");
    obj.css("flex", "1");
}