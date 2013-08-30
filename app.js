var $Wacom = null;
function updateDebug() {
	$('#pointer_type_display').html( $Wacom.wPointerType() );
	$('#pressure_display').html( $Wacom.wPressure() );
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
	$Wacom.wSetCanvas( $('#canvas') );
});