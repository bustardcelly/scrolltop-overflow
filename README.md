scrolltop-overflow
==================

utilities to provide overflow scrolling on mobile without -webkit-overflow-scrolling support.

##scrolltop-overflow.js##
Straight up HTML. Once loaded, auto-Decorates elements with class '.scrolltop-overflow' to allow for overflow scrolling in div on mobile.
- See index.html for usage.

##scrolltop-overflow.amd.js##
Requires [RequireJS](http://requirejs.org). Basic define and export of decorator() function to invoke on an element.
###usage###
	require( ['script/scrolltop-overflow.amd'], function( scrollerate ) {
		var els = document.querySelectorAll('div.scrolltop-overflow'),
    		i = 0, 
    		len = els.length;

		for( i; i < len; i++ ) {
			scrollerate( els[i] );
		}
	});