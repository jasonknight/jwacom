var $Wacom = null;
var $sTimeOut = null;
var $seconds = 1000;
function updateDebug() {
	$('#pointer_type_display').html( $Wacom.wPointerType() );
	$('#pressure_display').html( $Wacom.wPressure() );
}
function setupKeyEvents() {
	console.log("Setting up events");
	$(document).keyup(function ( ev ) {
		console.log(ev.which);
		if (ev.which == 219) { // decrease brush size
			var bsize = $Wacom.wGetLineWidth();
			bsize -= 0.2;
			if ( bsize < 0.1)
				bsize = 0.1;
			bsize = Math.round(bsize * 10) / 10;
			$Wacom.wSetLineWidth(bsize);
			$('#lineWidth_display').html($Wacom.wGetLineWidth());
			$('#lineWidth_slider').slider("value",bsize);
		} else if (ev.which == 221) { // decrease brush size
			var bsize = $Wacom.wGetLineWidth();
			bsize += 0.2;
			if ( bsize > 10)
				bsize = 10;
			bsize = Math.round(bsize * 10) / 10;
			$Wacom.wSetLineWidth(bsize);
			$('#lineWidth_display').html($Wacom.wGetLineWidth());
			$('#lineWidth_slider').slider("value",bsize);
		} else {
			console.log("No Match");
		}
		console.log($Wacom.wGetLineWidth());
	});
}
function setup1() {
	var sw,sh;
	sw = $(window).width();
	sh = $(window).height();
	$('#canvas')[0].width =  sw * 0.60;
	$('#canvas')[0].height = sh - 100;
	$('#canvas').css({position: 'absolute'});
	$('#canvas').offset( {top: 10, left: (sw - $('#canvas')[0].width) - 40} );
	// $('#tmp_canvas')[0].width =  sw * 0.60;
	// $('#tmp_canvas')[0].height = sh - 100;
	// $('#tmp_canvas').hide();

	var img = $('#image_div');
	img.width( sw * 0.39);
	img.height( sh - 100);
	img.css({position: 'absolute'});
	img.offset( {top: 10, left: 10} );
}
function setupLineWidthTool() {
	$('#lineWidth_slider').slider({ max: 10, min: 0.1, step: 0.2, value: 0.1});
	$('#lineWidth_display').html($Wacom.wGetLineWidth());
	$('#lineWidth_slider').on('slide', function ( evt, ui ) {
		$Wacom.wSetLineWidth(ui.value);
		$('#lineWidth_display').html($Wacom.wGetLineWidth());
	});

}
function setupOpacityTool() {
	$('#opacity_slider').slider({ max: 100, min: 2, step: 2, value: $Wacom.wGetOpacity()});
	$('#opacity_display').html($Wacom.wGetOpacity());
	$('#opacity_slider').on('slide', function ( evt, ui ) {
		$Wacom.wSetOpacity(ui.value);
		$('#opacity_display').html($Wacom.wGetOpacity());
	});

}
function setupSpectrumTool() {
	var e = $('#spectrum_tool');
	e.spectrum({
		flat: false,
		showInput: false,
		move: function ( color ) {
			$Wacom.wSetLineColor( color.toHexString() );
			e.spectrum('set', color.toHexString() );
		}
	});
	$Wacom.wSetLineColor( e.spectrum('get').toHexString() );

}
function setupSwatches() {
	$('li.swatch').each(function (i,elem){
		var li = $(elem);
		li.css( {'background-color': li.attr('data-color')} );
		li.on('click', function () {
			$Wacom.wSetLineColor( li.attr('data-color') );
			$('#spectrum_tool').spectrum('set', li.attr('data-color') );
		} );
	});
}
function slideShowRandomElement() {
	console.log('called');
	var divs = $('#image_div').find('.image');
	divs.hide();
	var max = divs.length;
	var min = 0;
	var ind = Math.floor(Math.random() * (max - min + 1) + min);
	var div = $(divs[ind]);
	if ( ! div.length > 0 ) {
		slideShowRandomElement();
		return;
	}
	div.show();
	div.find('img').each(function () {
		var maxWidth = $('#image_div').width() - 5; // Max width for the image
        var maxHeight = $('#image_div').height() - 80;    // Max height for the image
        var ratio = 0;  // Used for aspect ratio
        var width = $(this).width();    // Current image width
        var height = $(this).height();  // Current image height

        // Check if the current width is larger than the max
        if(width > maxWidth){
            ratio = maxWidth / width;   // get ratio for scaling image
            $(this).css("width", maxWidth); // Set new width
            $(this).css("height", height * ratio);  // Scale height based on ratio
            height = height * ratio;    // Reset height to match scaled image
            width = width * ratio;    // Reset width to match scaled image
        }

        // Check if current height is larger than max
        if(height > maxHeight){
            ratio = maxHeight / height; // get ratio for scaling image
            $(this).css("height", maxHeight);   // Set new height
            $(this).css("width", width * ratio);    // Scale width based on ratio
            width = width * ratio;    // Reset width to match scaled image
        }
	});

}
function startSlideShow() {
	slideShowRandomElement();
	$sTimeOut = setInterval(slideShowRandomElement, 120 * $seconds);
}
$(function () {
	$Wacom = $('#WacomPlugin').wacom();
	$('#canvas').on('mousedown', function () {
		updateDebug();
	});
	$('#canvas').on('mousemove', function () {
		updateDebug();
	});
	$('#canvas').on('mouseup', function () {
		updateDebug();
	});
	
	setup1();
	setupKeyEvents();
	setupLineWidthTool();
	setupSpectrumTool();
	setupOpacityTool();
	setupSwatches();
	startSlideShow();
	$Wacom.wSetCanvas( $('#canvas') );
	//$Wacom.wSetTmpCanvas( $('#tmp_canvas') );
});