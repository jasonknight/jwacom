(function ($) {
	function hexToRgb(hex) {
	    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	    
	    return result ? {
	        r: parseInt(result[1], 16),
	        g: parseInt(result[2], 16),
	        b: parseInt(result[3], 16)
	    } : null;
	}
	$.fn.wacom = function (options) {
		var opts = $.extend({},$.fn.wacom.defaults, options);
		var $this = $( this );
		$this.options = opts;
		$this.pState = { 
			drawing: false, 
			updating: false,
			current_image_data: null,
			commited_image_data: null,
			size_jitter: true,
			opacity_jitter: true,
			shiftKey: false,
			altKey: false,
		};
		$this.pData = {};
		$this.currentLineVectors = [];

		$this.wSetLineWidth = function (width) {
			$this.options.lineWidth = width;
		};
		$this.wGetLineWidth = function () {
			return $this.options.lineWidth;
		};
		$this.wSetOpacity = function (width) {
			$this.options.opacity = width;
		};
		$this.wGetOpacity = function () {
			return $this.options.opacity;
		};
		$this.wSetLineColor = function ( color ) {
			$this.options.lineColor = color;
		};
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
		$this.wSetTmpCanvas = function (canvas) {
			$this.tmp_canvas_element = canvas;
			$this.tmp_canvas = canvas[0];
			$this.tmp_context = $this.tmp_canvas.getContext('2d');
		};
		$this.wInitForDrawing = function () {
			$this._canvas_element.bind('mousedown', $this.wStartDrawing);
			$this._canvas_element.bind('mousemove', $this.wDraw);
			$this._canvas_element.bind('mouseup', 	$this.wStopDrawing);
			$('body').bind('mouseup', $this.wStopDrawing);
			$('body').bind('keyup keydown', function (ev) {
				$this.pState.shiftKey = ev.shiftKey;
				$this.pState.altKey = ev.altKey;
			});
			$this.wClearCanvas();
		};
		$this.wClearCanvas = function () {
			$this._context.clearRect(0,0,$this._canvas_element.width(), $this._canvas_element.height());
			$this.wFill( $this.options.backgroundColor );
			$this._context.lineJoin = "bevel";
			$this._context.lineCap= "butt";
			$this.wpSaveImageData();
			$this.wpSaveCommittedImageData();
			$this.pData.pixel = $this._context.createImageData(1,1);
		};
		$this.wpSaveImageData = function () {
			//console.log("Saving current data");
			$this.pState.current_image_data = $this._context.getImageData(0, 0, $this._canvas_element.width(), $this._canvas_element.height());
		};
		$this.wpRestoreCurrentImageData = function () {
			//console.log("Restoring current data");
			$this._context.putImageData($this.pState.current_image_data, 0, 0);
		};
		$this.wpSaveCommittedImageData = function () {
			//console.log("Saving committed data");
			$this.pState.committed_image_data = $this._context.getImageData(0, 0, $this._canvas_element.width(), $this._canvas_element.height());
		};
		$this.wpRestoreCommittedImageData = function () {
			//console.log("Restoring committed data");
			$this._context.putImageData($this.pState.committed_image_data, 0, 0);
			$this.wpSaveImageData();
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
		$this.wPlot = function (x, y, color, alpha) {
			if ( !color )
				color = $this.options.lineColor;
			if ( !alpha )
				alpha = $this.wPressure();
			var rgb;
			if ( color instanceof String)
				rgb = hexToRgb(color);
			else
				rgb = color;
			var existing_pixel = $this._context.getImageData(x,y,1,1);
			var epd = existing_pixel.data;
			var d = $this.pData.pixel.data;
			var nrgb = {
				r: Math.floor( ( rgb.r * alpha) + (epd[0] * ( 1.0 - alpha) ) ),
				g: Math.floor( ( rgb.g * alpha) + (epd[1] * ( 1.0 - alpha) ) ),
				b: Math.floor( ( rgb.b * alpha) + (epd[2] * ( 1.0 - alpha) ) ),
			}
			d[0] =  nrgb.r;
			d[1] =  nrgb.g;
			d[2] =  nrgb.b;
			d[3] = 255;
			//console.log(rgb.r, "/", rgb.g, "/",rgb.b,"  ",nrgb.r, ' - ', nrgb.g, ' - ', nrgb.b, ' | ', epd[0], '/', epd[1], '/', epd[2], ' || ',  alpha);
			$this._context.putImageData( $this.pData.pixel, x, y );
		};
		$this.wPencilContact = function (x, y ) {
			$this.wPlot(x,y);
			if ($this._context.lineWidth > 1) {
				$this.wPlot(x + 1,y + 1);
				$this.wPlot(x - 1,y - 1);
			}
		}
		$this.wDrawCursor = function (x,y) {
			$this._context.putImageData($this.pState.current_image_data, 0, 0);
			$this._context.beginPath();
	        $this._context.arc(x, y, $this.options.lineWidth, 0, 2 * Math.PI, false);
	        
	        $this._context.lineWidth = 2;
	        $this._context.strokeStyle = $this.options.backgroundColor;
	        $this._context.stroke();
	     
	        $this._context.lineWidth = 2;
	        $this._context.strokeStyle = $this.options.lineColor;
	        $this._context.stroke();
		};
		$this.wStartDrawing = function ( ev ) {
			ev.preventDefault();
		    var x, y;
		    x = ev.pageX - $this._canvas.offsetLeft;
		    y = ev.pageY - $this._canvas.offsetTop;
		    $this.currentLineVectors = [];
		    var vector = new Vector(x,y);
		    vector.pressure = $this.wPressure();
		    vector.lineWidth = $this.options.lineWidth;
		    vector.penType = $this.wPointerType();
		    vector.shiftKey = $this.pState.shiftKey;
		    vector.altKey = $this.pState.altKey;
		    $this.currentLineVectors.push(vector);
		    $this.pState.drawing = true;
		    $this._context.lineWidth = $this.options.lineWidth;
		    $this.pState.oldX = x;
		    $this.pState.oldY = y;
		};
		
		$this.wDraw = function(event) {

		    // Calculate the current mouse X, Y coordinates with canvas offset
		    var x, y;
		    x = event.pageX - $this._canvas.offsetLeft;
		    y = event.pageY - $this._canvas.offsetTop;

		    var pType = $this.wPointerType();
		    var pressure = $this.wPressure();
		    if ( $this.pState.size_jitter) {
		    	$this._context.lineWidth = $this.options.lineWidth * pressure;
		    } else {
		    	$this._context.lineWidth = $this.options.lineWidth;
		    }
		    

		    var color = '';
		    if (pType == 'pen') {
		    	color = $this.options.lineColor;
		    } else {
		    	color = '#ff5353';
		    	$this._context.lineWidth = $this.options.lineWidth * pressure + 2;
		    }
		    
		    // If the mouse is down (drawning) then start drawing lines
		    if( $this.pState.drawing ) {
		    	var vector = new Vector(x,y);
		    	vector.pressure = pressure;
		    	vector.penType = pType;
			    vector.lineWidth = $this.options.lineWidth;
			    vector.shiftKey = $this.pState.shiftKey;
		    	vector.altKey = $this.pState.altKey;
			    $this.currentLineVectors.push(vector);

		    	if ( $this.pState.opacity_jitter )
		    		$this._context.globalAlpha = pressure;
		        $this.wpRestoreCurrentImageData();
		        $this._context.strokeStyle = color;
		        $this._context.beginPath();
		        $this._context.moveTo($this.pState.oldX, $this.pState.oldY);
		        $this._context.lineTo(x, y);
		        $this._context.stroke();
		        $this._context.closePath();
		         
		        $this._context.globalAlpha = 1;
		     	$this.wpSaveImageData();
		    } else {
		    	$this.wDrawCursor(x,y);
		        
		    }
		    
		    
		    // Store the current X, Y position
		    $this.pState.oldX = x;
		    $this.pState.oldY = y;
		    
		};
		$this.wStopDrawing = function ( ev ) {
			$this.pState.drawing = false;
			$this.wpRestoreCommittedImageData();
			$this.renderVectorsAsPath($this.currentLineVectors);
			$this.currentLineVectors = [];
			$this.wpSaveCommittedImageData();
			$this.wpRestoreCommittedImageData();
		}
		$this.renderVectorsAsPath = function (vectors) {
			if ( ! vectors[0] )
				return;
			var x,y,xc,yc,v,p,w,i;
			var started = false;
			var ctx = $this._context;
			var color = '';
			var pType = vectors[0].penType;
		    
			var index = 0;
			
			if (pType == 'pen') {
		    	color = $this.options.lineColor;
		    } else {
		    	color = $this.options.backgroundColor;
		    	w = w + (w * p);
		    }
			ctx.strokeStyle = color;
			ctx.fillStyle = color;
			ctx.globalAlpha = $this.wGetOpacity() / 100;
			ctx.lineWidth = 0.1;
			// First we draw the line
			var first = true;
			for ( i = 0; i < vectors.length - 1; i++) {
				index++;
				v = vectors[i];
				x = v.x;
				y = v.y;
				p = v.pressure;
				w = v.lineWidth;
				if ( ! started ) {
					ctx.beginPath();
					ctx.moveTo(x,y);
					started = true;
					continue;
				}
				if ( i > 1 && v.shiftKey == true ) {
					var cv = v;
					var endv = cv;
					while (endv.shiftKey) {
						i = i + 1;
						tv = vectors[i];
						if (tv)
							endv = tv;
						else
							break;
					}
					ctx.lineTo(endv.x,endv.y);
				} else {
					xc = ( x + vectors[i + 1].x ) / 2;
					yc = ( y + vectors[i + 1].y ) / 2;
					ctx.quadraticCurveTo(x,y,xc,yc);
				}	
			}
			var cv, nv,dx,dy,xr,yr,fx,fy,t;
			// Then we backup and draw a mirrored line
			first = true;
			for ( i = vectors.length - 1; i > 0; i-- ) {	
				cv = vectors[i];
				if ( i < vectors.length - 3 && cv.shiftKey == true) {
					var endv = cv;
					while ( endv.shiftKey) {
						i = i -  1;
						tv = vectors[i];
						if (tv) {
							endv = tv;
						} else {
							break;
						}
					}
					nv = endv;
					cv.pressure = nv.pressure;
				} else {
					first = false;
					nv = vectors[ i - 1 ];
				}
				
				if ( ! nv )
					continue;
				t = cv.pressure * cv.lineWidth;
				dx = nv.x - cv.x;
				dy = nv.y - cv.y
				fx = dx / ( Math.sqrt( (dx * dx ) + (dy * dy ) ) );
				fy = dy / ( Math.sqrt( (dx * dx ) + (dy * dy ) ) );
				xr = cv.x + t * fy;
				yr = cv.y - t * fx;
				xc = ( xr + nv.x ) / 2;
				yc = ( yr + nv.y ) / 2;
				ctx.lineTo(xr,yr);
			}
			ctx.closePath();	
			ctx.fill();
		}
		return $this;
	};
	
	function getBox( vectors ) {
		var first = vectors[0];
		var last = vectors[ vectors.length - 1 ];
		var ty,tx,by,bx;
		if ( last.y < first.y ) {
			ty = last.y;
			by = first.y;
		} else {
			ty = first.y;
			by = last.y;
		}
		if ( last.x < first.x ) {
			tx = last.x;
			bx = first.x;
		} else {
			tx = first.x;
			bx = last.x;
		}
		var width = bx - tx;
		var height = by - ty;
		return {ty: ty, tx: tx, by: by, bx: bx, width: width, height: height};
	}
	function debugLineVecotors(vectors) { 
		for (var i = 0; i < vectors.length; i++) {
			var v = vectors[i];
			console.log("Vector: " + i + ' x: ' + v.x + " y: " + v.y + " p: " + v.pressure + " w: " + v.lineWidth );
		}
	}
	$.fn.wacom.defaults = {
	    	  'lineWidth':    	3,
	          'lineColor':      '#000',
	    'backgroundColor': 		'#d0b271',
	    		'opacity': 		100,
	};

})(jQuery);