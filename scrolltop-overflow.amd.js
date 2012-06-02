define( function() {

	var DAMP = 0.8,
		THRESHOLD = 0.01,
		VECTOR_MIN = 0.065,
		VECTOR_MAX = 60,
		VECTOR_MULTIPLIER = 0.25,
		RETURN_TIME = 85,
		mark = function( y, time ) {
			this.y = y;
			this.time = time;
		},
		linearMap = function( value, valueMin, valueMax, targetMin, targetMax ) {
			var zeroValue = value - valueMin,
				maxRange = valueMax - valueMin,
				valueRange = ( maxRange > 1 ) ? maxRange : 1,
				targetRange = targetMax - targetMin,
				zeroTargetValue = zeroValue * ( targetRange / valueRange ),
				targetValue = zeroTargetValue + targetMin;

			return targetValue;
		},
		decorate = function( element ) {
			var position = 0,
				scrollY = 0,
				prevScrollY = 0,
				difference = 0,
				direction = 0,
				velocity = 0,
				animateKey,
				marks = [],
				touches,
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
				handleTouchMove = function( event ) {
					event.preventDefault();
					touches = event.touches;
					scrollY = touches[0].clientY;
					difference = prevScrollY - scrollY;
					direction = ( difference > 0 ) ? 1 : -1;
					
					if( difference === 0 ) return;

					this.scrollTop = position + difference;
					position += difference;
					prevScrollY = scrollY;
					velocity = 0;
					marks[marks.length] = markBank.getMark(prevScrollY, event.timeStamp);
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
				},
				startAnimation = function() {
					animateKey = setInterval( animate, 60 );
				},
				endAnimation = function() {
					var i = 0, length = marks.length;
					clearInterval( animateKey );
					while( --i > -1 ) {
						markBank.returnMark(marks.shift());
					}
				};

			element.addEventListener( 'touchstart', function( event ) {
				event.stopPropagation();
				position = this.scrollTop;
				prevScrollY = event.touches[0].clientY;
				marks[marks.length] = markBank.getMark(prevScrollY, event.timeStamp);
				element.addEventListener( 'touchmove', handleTouchMove );
			});
			element.addEventListener( 'touchend', function( event ) {
				element.removeEventListener( 'touchmove', handleTouchMove );
				handleTouchEnd(event);
			});
		};

	return decorate;
});