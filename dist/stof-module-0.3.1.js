/**
 * scrolltop-overflow 0.3.1
 *
 * This is a wrapper placeholder for providing scrolltop-overflow (stof) on the global object, namespaced to com.custardbelly.stof
 * (c) Todd Anderson : http://www.custardbelly.com/blog
 */
(function(context) {
/*! 
	scrolltop-overflow 0.3.1 allows for touch-enabled scrolling of overflow:scroll elements on mobile. 
	On iOS, without --webkit-overflow-scrolling, user-scrolling for containers with overflow is not possible and takes on browser bounce/drag gesture.
	We can overcome that using scrolltop-overflow, but first we check if the browser itself has --webkit-overflow-scrolling, then to check UA to see how to apply scrolling capabilities. 
	With <iOS5, that will be with scrolltop-overflow.

	(c) Todd Anderson : http://www.custardbelly.com/blog
*/
var isTouch = 'ontouchstart' in window,
	scrollbarstyle = '::-webkit-scrollbar-thumb {border-radius: 2px; background-color: rgba(171, 171, 171, 1);}',
	sheet = (function() {
		var sheets = document.styleSheets,
			i, 
			length = sheets.length,
			scrollbarSheet;
			for( i = 0; i < length; i++ ) {
				scrollbarSheet = sheets[i];
				if( scrollbarSheet.href && 
					scrollbarSheet.href.indexOf('stof-scrollbar.css') != -1 ) {
					return scrollbarSheet;
				}
			}
		return null;
	}()),
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
		var inserted = false;
		return {
			show: function() {
				if( sheet !== null && !inserted ) {
					inserted = true;
					sheet.insertRule( scrollbarstyle, 1);
				}
			},
			hide: function() {
				if( sheet !== null && inserted ) {
					inserted = false;
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
			// rAF detection - http://paulirish.com/2011/requestanimationframe-for-smart-animating/
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
				this.stop();
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
	assignStylesOnElement = function( element, styleObject ) {
		var property;
		for( property in styleObject ) {
			element.style[property] = styleObject[property];
		}
	},
	namespace = function( packageString, context ) {
		var list = packageString.split('.'),
			head = context,
			item;
		while( list.length > 0 ) {
			item = list.shift();
			if( typeof head[item] === 'undefined' ) {
				head[item] = {};
			}
			head = head[item];
		}
		return head;
	};

/**
 * [com.custardbelly.stof] Namespaced scrolltop-overflow utility.
 * @param  {Object} stof Namespaced global object.
 */
(function(stof) {
	stof.hasDetected = false;
	stof.supportsWebkitOverflow = false;
	stof.isCandidateForSTOF = false;
	/**
	 * Detects if the browser is a candidate for scrolltop-overflow on elements. It is eliminated as a candidate if it:
	 *    1) supports -webkit-overflow-scrolling:touch
	 *    2) Does not meet minimum requirement of AppleWebKit < 533.
	 */
	stof.detect = function() {
		// hoisting explicitly.
		var ua = window.navigator.userAgent,
			platform = window.navigator.platform,
			webkitVersion,
			webkitVersionIsCandidate, 	// AppleWebKit/<=533
			webkitVersionIsCriOS;		// AppleWebkit/>=534 && CriOS

		if( !stof.hasDetected ) {
			stof.supportsWebkitOverflow = "WebkitOverflowScrolling" in window.document.documentElement.style;
			// webkit regex detection, gratiously appropriated from https://github.com/filamentgroup/Overthrow/blob/master/overthrow.js 
			webkitVersion = ua.match( /AppleWebKit\/([0-9]+)/ );
			webkitVersionIsCandidate = ( webkitVersion && (webkitVersion[1] <= 533) );
			webkitVersionIsCriOS = !webkitVersionIsCandidate && ( webkitVersion && (webkitVersion[1] >= 534) && (ua.match( /CriOS/ )!==null) );
			stof.isCandidateForSTOF = !stof.supportsWebkitOverflow && ( webkitVersionIsCandidate || webkitVersionIsCriOS );
		}
		stof.hasDetected = true;
		return stof.isCandidateForSTOF;
	};
	/**
	 * Decorate assigns event handlers for touch/mouse events to the element and requests animation and mdofication to its scrollTop property based on user gesture.
	 * @param  {HTMLElement} element The element to be decorate and allow for touch-based scrolling on overflow:scroll.
	 */
	stof.decorate = function( element ) {
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
					var evt = document.createEvent(isTouch ? 'TouchEvent' : 'MouseEvents');
					if( isTouch ) {
						evt.initTouchEvent('touchend');
					}
					else {
						evt.initMouseEvent('mouseup');
					}
					evt.timeStamp = new Date();
					element.dispatchEvent(evt);
				}
				catch( e ) {
					console.log('Exception on scrolltop-overflow:presumeTouchEnd. [REASON]: ' + e.message + '. Possible not support for TouchEvent/MouseEvent.');
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

				if( typeof touchEndID !== 'undefined' ) {
					clearTimeout( touchEndID );
				}
				touchEndID = setTimeout( presumeTouchEnd, defaultTouchEndDelay );
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
				if( marks.length === 0 || touches.length === 0 ) return;

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
				touches = [];
				while( --i > -1 ) {
					markBank.returnMark(marks.shift());
				}
			};
			
		element.addEventListener( isTouch ? 'touchstart' : 'mousedown', function( event ) {
			event.stopPropagation();
			position = this.scrollTop;
			touches = isTouch ? event.touches : [event];
			prevScrollY = touches[0].clientY;
			marks[marks.length] = markBank.getMark(prevScrollY, event.timeStamp);
			element.addEventListener( isTouch ? 'touchmove' : 'mousemove', handleTouchMove );
		});
		element.addEventListener( isTouch ? 'touchend' : 'mouseup', function( event ) {
			element.removeEventListener( 'touchmove', handleTouchMove );
			handleTouchEnd(event);
		});
		assignStylesOnElement(element, {position: 'relative', overflow: 'scroll'});
	};

	/**
	 * Quick auto decoration of all elements that match selector. Default selector is div.scrolltop-overflow.
	 * @param  {String} selector CSS selector string to access all elements that match. Default is 'div.scrolltop-overflow'.
	 */
	stof.decorateAll = function( selector ) {
		var elements = window.document.querySelectorAll( selector || 'div.scrolltop-overflow' ),
			i, length = elements.length;
		// Loop through elements marked with class scrolltop-overflow and decorate them.
		for( i = 0; i < length; i++ ) {
			stof.decorate( elements[i] );
		}	
	};

	/**
	 * Applies -webkit-overflow-scrolling:touch styles to elements found by selector.
	 * @param  {String} selector CSS selector string to access all elements that match. Default is 'div.scrolltop-overflow'.
	 */
	stof.applyWebkitOverflow = function( selector ) {
		var elements = window.document.querySelectorAll( selector || 'div.scrolltop-overflow' ),
			i, length = elements.length;
		// Loop through elements marked with class scrolltop-overflow and decorate them.
		for( i = 0; i < length; i++ ) {
			assignStylesOnElement( elements[i], {'-webkit-overflow-scrolling': 'touch', 'overflow': 'scroll'} );
		}	
	};
}( namespace('com.custardbelly.stof', (typeof context !== 'undefined') ? context : window) ));}(window));