define( function() {

	// On iOS, without --webkit-overflow-scrolling, user-scrolling for containers with overflow is not possible and takes on browser bounce/drag gesture.
	// We can overcome that using scrolltop-overflow, but first we check if the browser itself has --webkit-overflow-scrolling, then to check UA to see how to apply scrolling capabilities.
	// With iOS, that will be with scrolltop-overflow, with Android: overflow: auto.
	var isTouch = "ontouchstart" in window,
		hasWebkitOverflow = "WebkitOverflowScrolling" in window.document.documentElement.style,
		elements = window.document.querySelectorAll('div.scrolltop-overflow'),
		ua = navigator.userAgent,
		platform = navigator.platform,
		webkit = ua.match( /AppleWebKit\/([0-9]+)/ ),
		isCandidate = webkit && (webkit[1] <= 533),
		operateOnElements = function( list, func ) {
			var i = els.length,
				args = Array.prototype.slice.call(arguments).slice(2);
			while( --i > -1 ) {
				func.apply( null, [els[i]].concat(args) );
			}
		},
		setClassOnElement = function( element, name ) {
			element.classList.add(name);
		},
		assignStylesOnElement = function( element, styleObject ) {
			var property;
			for( property in styleObject ) {
				element.style[property] = styleObject[property];
			}
		}; 

	// If supports webkit-overflow-scrolling: touch, just assign the class.
	if( hasWebkitOverflow ) {
		operateOnElements( elements, setClassOnElement, 'overflowable' );
	}
	// Otherwise, assume it is iOS without support and decorate with scrolltop-overflow library.
	else if( isCandidate ) {
		require( ['script/amd/scrolltop-overflow.amd'], function( scrollate ) {
			operateOnElements( elements, function( element, styleObject ) {
				scrollate( element );				
				assignStylesOnElement( element, styleObject );
			}, {position: 'relative', overflow: 'scroll'});
		});
	}
	// Else, try auto. May need to refine previous clause with possible failing platforms.
	else {
		operateOnElements( elements, assignStylesOnElement, {position: 'relative', overflow: 'auto'} );
	}

	return !hasWebkitOverflow && isCandidate;
});