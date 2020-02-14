
var opacity_2d_slider;
var opacity_3d_slider;
$( function() {

    opacity_2d_slider = new Slider("#opacity-2d-slider");
    opacity_2d_slider.on("slide", function (value) {
        brain3d.setOpacity2D(value / 100.0);
    });

    opacity_3d_slider = new Slider("#opacity-3d-slider");
    opacity_3d_slider.on("slide", function (value) {
        brain3d.setOpacity3D(value / 100.0);
    });


    // Checkboxes
    $("#flash").click(function() {
        brain3d.setFlash(this.checked);
    });
    $("#rotate").click(function() {
        brain3d.setAutoRotate(this.checked);
    });
    $("#show_gray_matter").click(function() {
        brain3d.setShowGrayMatter(this.checked);
    });
    $("#show_white_matter").click(function() {
        brain3d.setShowWhiteMatter(this.checked);
    });
    $("#show_csf").click(function() {
        brain3d.setShowCSF(this.checked);
    });

    $("select[name=mni-image]").change(function() {
        brain3d.setMniImage(this.value);
    });

    $("select[name=section]").change(function() {
        switch (this.value) {
            case "wholebrain":
                talairach.setRanges([talairach.x_min, talairach.x_max], [talairach.y_min, talairach.y_max], [talairach.z_min, talairach.z_max]);
                break;
            case "left":
                talairach.setRanges([talairach.x_min, -0.5], [talairach.y_min, talairach.y_max], [talairach.z_min, talairach.z_max]);
                break;
            case "medial":
                talairach.setRanges([-1, 1], [talairach.y_min, talairach.y_max], [talairach.z_min, talairach.z_max]);
                break;
            case "right":
                talairach.setRanges([0.5, talairach.x_max], [talairach.y_min, talairach.y_max], [talairach.z_min, talairach.z_max]);
                break;
            case "anterior":
                talairach.setRanges([talairach.x_min, talairach.x_max], [0, talairach.y_max], [talairach.z_min, talairach.z_max]);
                break;
            case "posterior":
                talairach.setRanges([talairach.x_min, talairach.x_max], [talairach.y_min, 0], [talairach.z_min, talairach.z_max]);
                break;
            case "superior":
                talairach.setRanges([talairach.x_min, talairach.x_max], [talairach.y_min, talairach.y_max], [0, talairach.z_max]);
                break;
            case "middle":
                talairach.setRanges([talairach.x_min, talairach.x_max], [talairach.y_min, talairach.y_max], [-1, 1]);
                break;
            case "inferior":
                talairach.setRanges([talairach.x_min, talairach.x_max], [talairach.y_min, talairach.y_max], [talairach.z_min, 0]);
                break;

        }
    });


    // Tooltips initialization
    $('[data-toggle="tooltip"]').tooltip();
});
