scrolltop-overflow
==================

Utility library to provide overflow scrolling on mobile browsers that do not support -webkit-overflow-scrolling. (Generally anything pre AppleWebKit 533 - with the glorious exception of Chrome on iOS which reports as being 534 but does not support overlow-scrolling).

##why?##
On early mobile browsers, setting overflow on block containers does not allow for scrolling within the container using touch gesture. That gesture is typically overridden by the browser to perform kinetic scrolling of the page rather than the element. As such, you present content that is cut off and inaccessible.

scrolltop-overflow provides the ability to allow for user-scrolling within a block element that has content hidden in the overflow. It's not super fancy in its animation in providing kinetic scrolling based on OS, but it does provide animated scrolling with a flick gesture.

It is important to note that scrolltop-overflow will not automatically decorate any elements upon load and invocation of the library. It is not intended to be a polyfill. It simply provides a means for a developer to determine what decoration - if any - to apply based on the browser's candidacy for supporting -webkit-overflow-scrolling, and does so by providing an API for detection and decoration.

##how##
The scrolltop-overflow project scripts (found in /scripts) provide the main utility library that does detection and decoration of elements, as well as wrapper files for deployment targets namespaced on global/window or AMD (in this case specifically [RequireJS](http://requirejs.org)). The Makefile included in the project calls a custom python script that will replace demarked lines in the wrapper files with scrolltop-overflow.js so as to allow for multiple deployment strategies.

When deployed using the Makefile, scrolltop-overflow is shortened to stof-&lt;target&gt;-&lt;version&gt;.js

###scrolltop-overflow.js###
Library provides an API for detection of whether the current browser it is loaded into supports -webkit-overflow-scrolling:touch and decorator methods for when it does or does not. When the browser does support -webkit-overflow-scrolling, it simply assigns that css rule to the element and let's the browser control the behaviour for the container. When it does not, it sets overflow:auto, provides a global styling for scrollbars on overflow-n content elements and assigns touch event handlers to allow for user scrolling within an element.

###wrapper-*###

_wrapper-module.js_
Uses basic IIFE module pattern to add a namespaced object onto and accessible from the window.

_wrapper-require.js_
Requires [RequireJS](http://requirejs.org). Basic define and export of namspaced library acceeible using common AMD.

###usage###
Provided in this project's repo are examples found in /examples :) I prefer to work with AMD, so this quick summary of how to use scrolltop-overflow will provide an example using RequireJS:

	require( ['script/stof-require-0.3.1'], function( stof ) {
		var isCandidate = stof.detect();
		
	    if(isCandidate) {
	        stof.decorateAll('div.scrolltop-overflow');
	    }
	    else if(stof.supportsWebkitOverflow) {
	        stof.applyWebkitOverflow('div.scrolltop-overflow');
	    }
	});

This example utilizes the API provided by scrolltop-overflow.

_+ detect()_
Runs detection of whether the current browser passes as being a candidate for scrolltop-overflow; meaning, the browser does not support -webkit-overflow-scrolling:touch. As mentioned earlier, scrolltop-overflow will not automatically decorate any elements when calling detect(). It is not intended to be a polyfill. It simply provides a means for a developer to determine what decoration - if any - to apply based on the browser's candidacy for supporting -webkit-overflow-scrolling, and does so by providing an API for detection and decoration.

_+ decorateAll(query)_
Decorates all elements that match the CSS query to allow for user-scrolling when -webkit-overflow-scrolling is not supported.

_+ applyWebkitOverflow(query)_
Decorates all elements that match the CSS query with -webkit-overflow-scrolling:touch styles.

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