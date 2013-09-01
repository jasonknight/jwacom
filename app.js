var $Wacom = null;
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
	$('#tmp_canvas')[0].width =  sw * 0.60;
	$('#tmp_canvas')[0].height = sh - 100;
	$('#tmp_canvas').hide();
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
	$Wacom.wSetCanvas( $('#canvas') );
	$Wacom.wSetTmpCanvas( $('#tmp_canvas') );
});