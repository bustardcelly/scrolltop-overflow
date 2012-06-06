/*! scrolltop-overflow 0.2.0 allows for touch-enabled scrolling of overflow:scroll elements on mobile. (c) Todd Anderson : http://www.custardbelly.com/blog */
(function(window) {

	var isTouch = 'ontouchstart' in window,
		elements = window.document.querySelectorAll( 'div.scrolltop-overflow' ),
		printer = window.document.querySelector( 'div.printer' ),
		printline = function( txt ) {
			var line = document.createElement('p');
			var text = document.createTextNode(txt);
			line.appendChild(text);
			printer.appendChild(line);
		},
		scrollbarstyle = '::-webkit-scrollbar-thumb {border-radius: 2px; background-color: rgba(171, 171, 171, 1);}',
		sheet = (function() {
			var sheets = document.styleSheets,
				i = 0, 
				length = sheets.length,
				scrollbarSheet;
				for( i; i < length; i++ ) {
					scrollbarSheet = sheets[i];
					if( scrollbarSheet.href.indexOf('stof-scrollbar.css') != -1 ) {
						return scrollbarSheet;
					}
				}
			return null;
		}()),
		i = 0,
		length = elements.length,
		DAMP = 0.8,
		THRESHOLD = 0.01,
		VECTOR_MIN = 0.065,
		VECTOR_MAX = 60,
		VECTOR_MULTIPLIER = 0.25,
		RETURN_TIME = 85,
		linearMap = function( value, valueMin, valueMax, targetMin, targetMax ) {
			var zeroValue = value - valueMin,
				maxRange = valueMax - valueMin,
				valueRange = ( maxRange > 1 ) ? maxRange : 1,
				targetRange = targetMax - targetMin,
				zeroTargetValue = zeroValue * ( targetRange / valueRange ),
				targetValue = zeroTargetValue + targetMin;

			return targetValue;
		},
		/**
		 * Mark objects represent touch points in time during a user scroll.
		 * @param  {Number} y    Y position to store.
		 * @param  {Number} time Current timestamp.
		 */
		mark = function( y, time ) {
			this.y = y;
			this.time = time;
		},
		/**
		 * Scrollbar scans for the scrollbar.css file from this project being on the DOM.
		 * If found, using show() and hide() it will reveal the scrollbar using psuedo-scrollbar styles for webkit.
		 */
		scrollbar = function() {
			return {
				show: function() {
					if( sheet !== null ) {
						sheet.insertRule( scrollbarstyle, 1);
					}
				},
				hide: function() {
					if( sheet !== null ) {
						sheet.deleteRule( 1 );
					}
				}
			};
		},
		/**
		 * Animator attempts to use requestAnimationFrame, and falls back to setTimeout for
		 * invoking a method continually after start() until stop() request.
		 */ 
		animator = function() {
			var animateID,
				requestAnimationFrame = window.requestAnimationFrame || 
                                window.mozRequestAnimationFrame ||  
                                window.webkitRequestAnimationFrame || 
                                window.msRequestAnimationFrame ||
                                window.oRequestAnimationFrame,
                cancelAnimationFrame =  window.cancelAnimationFrame || 
                                window.mozCancelAnimationFrame ||  
                                window.webkitCancelAnimationFrame || 
                                window.msCancelAnimationFrame ||
                                window.oCancelAnimationFrame;
			return {
				start: function( method ) {
					if( requestAnimationFrame ) {
						animateID = requestAnimationFrame( method );
					}
					else {
						animateID = setTimeout( method, 1000 / 60 );
					}
				},
				stop: function() {
					if( requestAnimationFrame ) {
						if( cancelAnimationFrame && animateID ) {
							cancelAnimationFrame( animateID );
						}
					}
					else {
						clearTimeout( animateID );
					}
				}
			};
		},
		/**
		 * Decorate assigns event handlers for touch/mouse events to the element and requests animation and mdofication to its scrollTop property based on user gesture.
		 * @param  {HTMLElement} element The element to be decorate and allow for touch-based scrolling on overflow:scroll.
		 */
		decorate = function( element ) {
			var position = 0,
				scrollY = 0,
				prevScrollY = 0,
				difference = 0,
				direction = 0,
				velocity = 0,
				marks = [],
				touches,
				anim = animator(),
				bar = scrollbar(),
				/**
				 * Object pool to allow for only a finite amount of mark objects being created.
				 * @param  {mark} MarkObject The constructor to use in generating new mark objects.
				 */
				markBank = (function(MarkObject) {
					var mark, marks = [];
					return {
						getMark: function(y, time) {
							if( marks.length > 0 ) {
								mark = marks.shift();
								mark.y = y;
								mark.time = time;
								return mark;
							}
							return new MarkObject(y, time);
						},
						returnMark: function(m) {
							m.y = 0;
							m.time = 0;
							marks[marks.length] = m;
						}
					};
				})(mark),
				defaultTouchEndDelay = 200,
				touchEndID,
				presumeTouchEnd = function() {
					try {
						var evt = document.createEvent('TouchEvent');
						evt.initTouchEvent('touchend');
						evt.timeStamp = new Date();
						element.dispatchEvent(evt);
						console.log('event dispatch');
					}
					catch( e ) {
						console.log('presumeTouchEnd: ' + e.message);
					}
				},
				handleTouchMove = function( event ) {
					event.preventDefault();
					touches = isTouch ? event.touches : [event];
					scrollY = touches[0].clientY;
					difference = prevScrollY - scrollY;
					direction = ( difference > 0 ) ? 1 : -1;
					
					if( difference === 0 ) return;

					this.scrollTop = position + difference;
					position += difference;
					prevScrollY = scrollY;
					velocity = 0;
					marks[marks.length] = markBank.getMark(prevScrollY, event.timeStamp);

					if( typeof touchendID !== 'undefined' ) {
						clearTimeout( touchendID );
					}
					touchendID = setTimeout( presumeTouchEnd, defaultTouchEndDelay );
				},
				handleTouchEnd = function( event ) {
					var crossover = 0, 
						crossoverPercent = 0,
						i = 0,
						length = marks.length,
						mark, 
						currentmark, 
						prevmark, 
						currentY, newY,
						threshold, absThreshold, absVelocity,
						factor;

					if( typeof touchEndID !== 'undefined' ) {
						clearTimeout( touchEndID );
					}
					if( marks.length === 0 ) return;

					currentY = touches[0].clientY;
					crossover = event.timeStamp - RETURN_TIME;
					while( i++ < length-1 ) {
						mark = marks[i];
						if( mark.time > crossover ) {
							break;
						}
					}
					i = ( i === 0 ) ? 1 : i;
					currentmark = marks[i];
					prevmark = marks[i-1];
					if( currentmark === undefined || prevmark === undefined ) return;
					
					crossoverPercent = linearMap( crossover, prevmark.time, currentmark.time, 0, 1 );
					newY = (prevmark.y * ( 1 - crossoverPercent ) ) + ( currentmark.y * crossoverPercent );
					threshold = currentY - newY;
					absThreshold = ( threshold > 0 ) ? threshold : -threshold;
					if( absThreshold < THRESHOLD ) {
						newY = currentY;
					}

					if( currentY != newY ) {
						velocity = threshold * VECTOR_MULTIPLIER;
						absVelocity = ( velocity > 0 ) ? velocity : -velocity;
						if( absVelocity > VECTOR_MAX ) {
							factor = VECTOR_MAX / absVelocity;
							velocity *= factor;
						}
						startAnimation();
					}
				},
				/**
				 * Updates the scrollTop property of the element based on position and velocity.
				 */
				animate = function() {
					var absVelocity;

					position -= velocity;
					if( velocity === 0 ) return;

					element.scrollTop = position;
					
					velocity *= DAMP;
					absVelocity = ( velocity > 0 ) ? velocity : -velocity;
					if( absVelocity < VECTOR_MIN ) {
						velocity = 0;
					}
					if( velocity === 0 ) {
						endAnimation();
					}
					else {
						anim.start(animate);
					}
				},
				/**
				 * Request to start animation loop.
				 */
				startAnimation = function() {
					bar.show();
					anim.start(animate);
				},
				/**
				 * Request to stop animation loop.
				 */
				endAnimation = function() {
					bar.hide();
					var i = 0, length = marks.length;
					anim.stop();
					while( --i > -1 ) {
						markBank.returnMark(marks.shift());
					}
				};
				
			element.addEventListener( isTouch ? 'touchstart' : 'mousedown', function( event ) {
				event.stopPropagation();
				position = this.scrollTop;
				prevScrollY = isTouch ? event.touches[0].clientY : event.clientY;
				marks[marks.length] = markBank.getMark(prevScrollY, event.timeStamp);
				element.addEventListener( isTouch ? 'touchmove' : 'mousemove', handleTouchMove );
			});
			element.addEventListener( isTouch ? 'touchend' : 'mouseup', function( event ) {
				element.removeEventListener( 'touchmove', handleTouchMove );
				handleTouchEnd(event);
			});
		};

	// Loop through elements marked with class scrolltop-overflow and decorate them.
	for( i = 0; i < length; i++ ) {
		decorate( elements[i] );
	}

})(window);