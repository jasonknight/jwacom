(function ($) {
	$.fn.wacom = function (options) {
		var opts = $.extend({},$.fn.wacom.defaults, options);
		var $this = $( this );
		$this.options = opts;

		$this.wPressure =  function () {
			return $this[0].penAPI.pressure;
		};
		$this.wPointerType = function () {
			var pType = $this[0].penAPI.pointerType;
			switch( pType ) {
				case 1:
					return "pen";
					break;
				case 2:
					return "puck";
					break;
				case 3:
					return "eraser";
					break;
				case 0:
				default:
					return "mouse";
					break;
			}
		};
		$this.wSetCanvas = function (canvas) {
			$this._canvas_element = canvas;
			$this._canvas = canvas[0];
			$this._context = $this._canvas.getContext('2d');
			$this.wInitForDrawing();
		};
		$this.wpSaveState = function () {
			$this._oldState = $this._context.getImageData(0, 0, $this._canvas_element.width(), $this._canvas_element.height());
		};
		$this.wFill = function ( color ) {
			var ofs = $this._context.fillStyle;
			var compositeOperation = $this._context.globalCompositeOperation;
			$this._context.globalCompositeOperation = "destination-over";
			$this._context.fillStyle = color;
			$this._context.fillRect(0,0, $this._canvas_element.width(),$this._canvas_element.height());
			//$this._context.fillStyle = ofs;
			$this._context.globalCompositeOperation = compositeOperation;
		};
		$this.wInitForDrawing = function () {
			$this._canvas_element.bind('mousedown', $this.wStartDrawing);
			$this._canvas_element.bind('mousemove', $this.wDraw);
			$this._canvas_element.bind('mouseup', 	$this.wStopDrawing);
			$('body').bind('mouseup', $this.wStopDrawing);
			$this.wFill( $this.options.backgroundColor );
			$this.wpSaveState();
		};
		$this.wStartDrawing = function ( ev ) {
			ev.preventDefault();
		    var x, y;
		    x = ev.pageX - $this._canvas_element.offset().left;
		    y = ev.pageY - $this._canvas_element.offset().top;
		    $this.options.drawing = true;
		    $this._context.lineWidth = $this.options.lineWidth;
		    $this.options.oldX = x;
		    $this.options.oldY = y;
		};
		$this.wDrawCursor = function (x,y) {
			$this._context.putImageData($this._oldState, 0, 0);
			$this._context.beginPath();
	        $this._context.arc(x, y, $this.options.lineWidth, 0, 2 * Math.PI, false);
	        
	        $this._context.lineWidth = 3;
	        $this._context.strokeStyle = $this.options.backgroundColor;
	        $this._context.stroke();
	     
	        $this._context.lineWidth = 1;
	        $this._context.strokeStyle = '#000';
	        $this._context.stroke();
		};
		$this.wDraw = function(event) {

		    // Calculate the current mouse X, Y coordinates with canvas offset
		    var x, y;
		    x = event.pageX - $this._canvas_element.offset().left;
		    y = event.pageY - $this._canvas_element.offset().top;

		    var pType = $this.wPointerType();
		    var pressure = $this.wPressure();
		    $this._context.lineWidth = $this.options.lineWidth * pressure;

		    var color = '';
		    if (pType == 'pen') {
		    	color = $this.options.lineColor;
		    } else {
		    	color = $this.options.backgroundColor;
		    	$this._context.lineWidth = $this.options.lineWidth * pressure + 2;
		    }
		    
		    // If the mouse is down (drawning) then start drawing lines
		    if( $this.options.drawing ) {
		    	$this._context.globalAlpha = pressure;
		        $this._context.putImageData($this._oldState, 0, 0);
		        $this._context.strokeStyle = color;
		        $this._context.beginPath();
		        $this._context.moveTo($this.options.oldX, $this.options.oldY);
		        $this._context.lineTo(x, y);
		        $this._context.closePath();
		        $this._context.stroke();
		        $this.wpSaveState();
		        $this._context.globalAlpha = 1;
		    } else {
		    	
		        
		    }
		    $this.wDrawCursor(x,y);
		    
		    // Store the current X, Y position
		    $this.options.oldX = x;
		    $this.options.oldY = y;
		    
		};
		$this.wStopDrawing = function ( ev ) {
			$this.options.drawing = false;
		}
		return $this;
	};
	$.fn.wacom.defaults = {
				'drawing':      false,
	    	  'lineWidth':    	2,
	    	   'updating':      false,
	          'lineColor':      '#000',
	    'backgroundColor': 		'#d0b271'
	};

})(jQuery);