var talairach = (function() {

    var x_slider;
    var y_slider;
    var z_slider;


    var x_min = -74;
    var x_max = 74;
    var y_min = -110;
    var y_max = 75;
    var z_min = -74;
    var z_max = 84;


    function updateSlice() {
        $("#x-slider-val-lower").html(x_slider.getValue()[0] + " cm");
        $("#x-slider-val-upper").html(x_slider.getValue()[1] + " cm");
        $("#y-slider-val-lower").html(y_slider.getValue()[0] + " cm");
        $("#y-slider-val-upper").html(y_slider.getValue()[1] + " cm");
        $("#z-slider-val-lower").html(z_slider.getValue()[0] + " cm");
        $("#z-slider-val-upper").html(z_slider.getValue()[1] + " cm");
        brain3d.slice(
            [10*x_slider.getValue()[0], 10*x_slider.getValue()[1]],
            [10*y_slider.getValue()[0], 10*y_slider.getValue()[1]],
            [10*z_slider.getValue()[0], 10*z_slider.getValue()[1]]
        );
    }

    function setRanges(x, y, z) {
        x_slider.setValue(x);
        y_slider.setValue(y);
        z_slider.setValue(z);
        updateSlice();
    }

    $( function() {
        x_slider = new Slider('#x-slider', {tooltip: 'always'});
        x_slider.on("slide", updateSlice);

        y_slider = new Slider('#y-slider', {tooltip: 'always'});
        y_slider.on("slide", updateSlice);

        z_slider = new Slider('#z-slider', {tooltip: 'always'});
        z_slider.on("slide", updateSlice);

        updateSlice();
    } );

    return {
        setRanges: setRanges,
        updateSlice: updateSlice,
        x_min: x_min,
        x_max: x_max,
        y_min: y_min,
        y_max: y_max,
        z_min: z_min,
        z_max: z_max
    }

})();
