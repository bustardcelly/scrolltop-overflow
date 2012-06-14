scrolltop-overflow
==================

utilities to provide overflow scrolling on mobile without -webkit-overflow-scrolling support.

##scrolltop-overflow.js##
Straight up HTML. Once loaded, auto-Decorates elements with class '.scrolltop-overflow' to allow for overflow scrolling in div on mobile.
- See index.html for usage.

##stof-detection.amd.js, scrolltop-overflow.amd.js##
Requires [RequireJS](http://requirejs.org). Basic define and export of decorator() function to invoke on an element.

###usage with stof-detection###
stof-detection can be used to provide solutions for overflow scrolling cross-browser. This means that if the browser supports -webkit-overflow-scrolling, then simply assign it. Otherwise, run a test if it is elligible for scrolltop-overflow decoration (typically this is AppleWebKit versions <= 533). If elligble, decorate with scrolltop-overflow module, else default to assigning overflow:auto which will enabled overflow scrolling on most Android browsers.

	require.config({
	    baseUrl: "../script",
	    paths: {
	        "script": "."
	    }
 	});
	require( ['script/amd/stof-detection.amd'], function( requiresSTOF ) {
		console.log( 'requires stof: ' + requiresSTOF ); // returns true if scrolltop-overflow decoration was needed.
	});

###usage without stof-detection###
	require( ['script/amd/scrolltop-overflow.amd'], function( scrollerate ) {
		var els = document.querySelectorAll('div.scrolltop-overflow'),
    		i = 0, 
    		len = els.length;

		for( i; i < len; i++ ) {
			scrollerate( els[i] );
		}
	});

#A Bit About Scrollbars#
How scrolltop-overflow works is by updating the scrollTop property of a div that has a static height and overflow:scroll defined. As such, scrollbars are not present on a mobile device (at least for those not fortunate to support -webkit-overflow-scrolling). They are not present on resize of the element container, nor on 'scrolling' with scrolltop-overflow.

In order to show scrollbars upon 'scroll' gesture, scrolltop-overflow employs the ::-webkit-scrollbar pseudo-style. This is a fantastic article that goes into more depth: [http://css-tricks.com/custom-scrollbars-in-webkit/](http://css-tricks.com/custom-scrollbars-in-webkit/).

scrolltop-overflow applies the bar style at runtime. The _scrollbarstyle_ property found in the library defines the thumb style. This is inserted into a stylesheet upon start of scroll and deleted from a stylesheet upon end of scroll using the insertRule() and deleteRule() methods, respectively. As such, scrolltop-overflow - if you are looking for scrollbar display support - requires the inclusion of _style/stof-scrollbar.css_ file. scrolltop-overflow scans for this stylesheets existance on the DOM and calls insertRule() and deleteRule() on its instance to show and hide the scrollbar.

The one caveat in this solution is that this style is applied to the document as whole; meaning, this style is applied to EVERY element you have decorated with scrolltop-overflow. In other words, when a scroll is triggered by one scrolltop-overflow element, if there is another scrolltop-overflow element visible in the viewport, the scrollbar will be seen in that element as well (though use is not actively interacting with it). A minor caveat, in my opinion, as i imagine the standard usecase being a single scrolltop-overflow visible at any given time in the viewport.

This behaviour/display is optional, of course. If you choose to not include the _stof-scrollbar.css_ file in your page, then the User will not see any scrollbar displayed when scrolling.

just a heads up :)

##Not working in latest on Android?##
[http://code.google.com/p/android/issues/detail?id=19625](http://code.google.com/p/android/issues/detail?id=19625)

scrolltop-overflow may not work on all Android-flavored browsers. As such, it is recommended to try setting overflow:auto on the container and see if that provides the desired behavior. This is the default assignment when using #stof-detection.amd# _no scrollbars will appear with such assignment_