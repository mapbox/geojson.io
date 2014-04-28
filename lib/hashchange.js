/**
 * Hashchange Event Polyfill
 */

(function() {

	window.HashChangeEvent = (function() {
		var ret = function(oldURL, newURL) {
			this.oldURL = oldURL;
			this.newURL = newURL;
			this.timeStamp = (new Date()).getTime();
		};
		ret.prototype = {
			bubbles: false,
			cancelable: false,
			currentTarget: null,
			defaultPrevented: false,
			returnValue: true,
			srcElement: null,
			target: null,
			timeStamp: null,
			type: 'hashchange'
		};
		return ret;
	}());

	var fix = {

		// Bound event listeners
		listeners: {
			funcs: [ ],
			remove: function(func) {
				var arr = [ ];
				for (var i = 0, c = fix.listeners.funcs.length; i < c; i++) {
					if (fix.listeners.funcs[i] !== func) {
						arr.push(fix.listeners.funcs[i]);
					}
				}
				fix.listeners.funcs = arr;
			}
		},

		// Start the poller
		init: function() {
			// Get the starting hash
			fix.lastHash = fix.getHash();
			fix.lastLocation = String(location);
			// Patch addEventListener
			if (window.addEventListener) {
				var nativeAEL = window.addEventListener;
				window.addEventListener = function(evt, func) {
					if (evt === 'hashchange') {
						fix.listeners.funcs.push(func);
					} else {
						return nativeAEL.apply(window, arguments);
					}
				};
			}
			// Patch attachEvent
			if (window.attachEvent) {
				var nativeAE = window.attachEvent;
				window.attachEvent = function(evt, func) {
					if (evt === 'onhashchange') {
						fix.listeners.funcs.push(func);
					} else {
						return nativeAE.apply(window, arguments);
					}
				};
			}
			// Start polling
			fix.setTimeout();
		},

		// The previous hash value
		lastHash: null,
		lastLocation: null,

		// The number of miliseconds between pollings
		pollerRate: 50,

		// Read the hash value from the URL
		getHash: function() {
			return location.hash.slice(1);
		},

		// Sets the next interval for the timer
		setTimeout: function() {
			window.setTimeout(fix.pollerInterval, fix.pollerRate);
		},

		// Creates a new hashchange event object
		createEventObject: function(oldURL, newURL) {
			return new window.HashChangeEvent(oldURL, newURL);
		},

		// Runs on an interval testing the hash
		pollerInterval: function() {
			var hash = fix.getHash();
			if (hash !== fix.lastHash) {
				var funcs = fix.listeners.funcs.slice(0);
				if (typeof window.onhashchange === 'function') {
					funcs.push(window.onhashchange);
				}
				for (var i = 0, c = funcs.length; i < c; i++) {
					var evt = fix.createEventObject({
						oldURL: fix.lastLocation,
						newURL: String(location)
					});
				}
				fix.lastHash = fix.getHash();
				fix.lastLocation = String(location);
			}
			fix.setTimeout();
		}

	};

	fix.init();

}());
