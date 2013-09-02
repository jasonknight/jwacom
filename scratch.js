if ( $this.tmp_context ) {
				console.log("Using tmp canvas");
				ctx = $this.tmp_context;
				ctx.save();
			}

			if ( $this.tmp_context) {
				
				var box = getBox( vectors );
				var height = box.by;
				var width  = box.bx;
				var data = ctx.getImageData(0,0,100, 100);
				var alpha = $this.wGetOpacity() / 100;
				for ( var i = 0; i < 10; i++) {
					console.log( data[i] );
				}
				return;
				console.log(box.tx, ' ', box.ty, ' ', box.bx, ' ', box.by, ' ', box.width, ' ', box.height);
				for ( y = box.ty; y <= box.by; y++ ) {
					for ( x = box.tx; x <= box.bx; x++ ) {
						rgb = {
							r:  data[ ( (y - 1) * (width * 4)) + ((x - 1) * 4)    ],
							g:  data[ ( (y - 1) * (width * 4)) + ((x - 1) * 4) + 1 ],
							b:  data[ ( (y - 1) * (width * 4)) + ((x - 1) * 4) + 2 ],
						};
						console.log(rgb.r, ' ', rgb.g, ' ', rgb.b);
						$this.wPlot(x,y,rgb,alpha);
					}
				}
			}
			ctx.restore();