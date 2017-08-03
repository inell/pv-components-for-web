/****************************************************************************
[PV. Components for Web]
Core.Polyfills
Pavel Voltage, 02.08.2017
v.1.2
/***************************************************************************/

/************************/
/**
 * Object create implementation
 */
if (!Object.create)
	Object.create = function (proto) {
		function F() {}
		F.prototype = proto;
		var object = new F;
		return object;
	}

/************************/
/**
 * Crossbrowser .bind (for IE8- and older shit)
 */
if (!Function.prototype.bind)
	Function.prototype.bind = function (context) {
		var me = this; //The function being called

		//Calling [bind] saves extra arguments [args] (they follow from 1-st position) to [bindArgs] array
		var bindArgs = Array.prototype.slice.call(arguments, 1)

		function wrapper() {
			var args = Array.prototype.slice.call(arguments);
			//This wrapper makes from [arguments] array of [args] and append them to [bindArgs] (carrying) by using [concat]
			var unshiftArgs = bindArgs.concat(args);
			//Then passes [func] calling with a context and array of arguments
			return me.apply(context, unshiftArgs);
		}

		return wrapper;
	}

/************************/
/**
 * Array .forEach implementation
 */
if (!Array.prototype.forEach) {
	Array.prototype.forEach = function (callback) {
		for (var i = 0; i < this.length; i++) {
			callback.apply(this, [this[i], i, this]);
		}
	}
}

/************************/
/**
 * Array .some implementation
 */
// Production steps of ECMA-262, Edition 5, 15.4.4.17
// Reference: http://es5.github.io/#x15.4.4.17
if (!Array.prototype.some) {
	Array.prototype.some = function (fun /*, thisArg*/) {
		if (this == null)
			throw new TypeError('Array.prototype.some called on null or undefined');
		if (typeof fun !== 'function')
			throw new TypeError();

		var t = Object(this);
		var len = t.length >>> 0;

		var thisArg = (arguments.length >= 2) ? arguments[1] : void 0;
		for (var i = 0; i < len; i++)
			if (i in t && fun.call(thisArg, t[i], i, t))
				return true;

		return false;
	};
}

/************************/
/**
 * CustomEvent object
 */
try {
	new CustomEvent("IE has CustomEvent, but doesn't support constructor");
} catch (e) {
	window.CustomEvent = function (event, params) {
		var evt;
		params = params || {
			type : event,
			bubbles : false,
			cancelable : false,
			detail : undefined
		};
		if (document.createEvent) {
			evt = document.createEvent("CustomEvent");
			evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		} else if (document.createEventObject) {
			//for IE 8
			evt = document.createEventObject();
			for (var p in params) {
				evt[p] = params[p];
			}
		}
		return evt;
	};

	CustomEvent.prototype = Object.create(window.Event.prototype);
}

/************************/
/**
 * Event listeners
 */
if (!Window.prototype.addEventListener) {
	// built-in event regisry
	var registry = {};

	/************************/
	/**
	 * addEventListener
	 */
	Window.prototype.addEventListener = HTMLDocument.prototype.addEventListener = Element.prototype.addEventListener = function (type, listener) {
		var target = this;
		var array = registry[type] || (registry[type] = new Array());
		//extends event object of listener()
		var extraListener = function (event) {
			event.currentTarget = target;
			event.preventDefault = function () {
				event.returnValue = false
			};
			event.stopPropagation = function () {
				event.cancelBubble = true
			};
			event.target = event.srcElement || target;

			listener.call(target, event);
		}
		array.push([target, listener, extraListener]);
		this.attachEvent("on" + type, array[array.length - 1][2]);
	}

	/************************/
	/**
	 * removeEventListener
	 */
	Window.prototype.removeEventListener = HTMLDocument.prototype.removeEventListener = Element.prototype.removeEventListener = function (type, listener) {
		for (var i = 0, eventStack = registry[type]; eventStack && eventStack[i]; i++) {
			if (eventStack[i][0] === this && eventStack[i][1] === listener)
				return this.detachEvent("on" + type, eventStack.splice(i, 1)[0][2]);
		}
	}

	/************************/
	/**
	 * dispatchEvent
	 */
	Window.prototype.dispatchEvent = HTMLDocument.prototype.dispatchEvent = Element.prototype.dispatchEvent = function (eventObject) {
		return this.fireEvent("on" + eventObject.type, eventObject);
	}
}
