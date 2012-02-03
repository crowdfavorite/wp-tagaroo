
var cf = {};

// following John Resig, http://ejohn.org/blog/simple-javascript-inheritance/
// Inspired by base2 and Prototype
(function(){
	var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
	// The base Class implementation (does nothing)
	this.CFBase = function(){};
	
	// Create a new Base that inherits from this class
	CFBase.extend = function(prop, className) {
		var _super = this.prototype;
		
		// Instantiate a base class (but only create the instance,
		// don't run the init constructor)
		initializing = true;
		var prototype = new this();
		initializing = false;

		prototype.wasRehydrated = function() {
		};
		
		prototype.serialize = function() {
			return JSON.stringify(this);
		};
		
		prototype.toJSON = function() {
			return this;
		};
		
		// Copy the properties over onto the new prototype
		for (var name in prop) {
			// Check if we're overwriting an existing function
			prototype[name] = typeof prop[name] == "function" && 
				typeof _super[name] == "function" && fnTest.test(prop[name]) ?
				(function(name, fn){
					return function() {
						var tmp = this._super;
						
						// Add a new ._super() method that is the same method
						// but on the super-class
						this._super = _super[name];
						
						// The method only need to be bound temporarily, so we
						// remove it when we're done executing
						var ret = fn.apply(this, arguments);
						this._super = tmp;
						
						return ret;
					};
				})(name, prop[name]) :
				prop[name];
		}
		
		// The dummy class constructor
		function CFBase() {
			// All construction is actually done in the init method
			if ( !initializing && this.init ) {
				
				if (arguments.length == 1 && arguments[0] == '__cf_unserialize__') {
					this._className = className;
				}
				else {
					this.init.apply(this, arguments);
					this._className = className || '';
				}
			}

		}
		
		
		// Populate our constructed prototype object
		CFBase.prototype = prototype;
		
		// Enforce the constructor to be what we expect
		CFBase.constructor = CFBase;

		// And make this class extendable
		CFBase.extend = arguments.callee;
		
		return CFBase;
	};
	
	CFBase.unserialize = function(json, classNamespace) {
		var o = null;
		if ('_className' in json) {
			eval('o = new ' + (classNamespace || '') + json._className + '("__cf_unserialize__");');
		}
		if (o) {
			for (var p in json) {
				if (json[p] && typeof json[p] == 'object' && '_className' in json[p]) {
					o[p] = CFBase.unserialize(json[p], classNamespace);
				}
				else {
					o[p] = json[p];	// note: not cloning containers!
				}
			}
			o.wasRehydrated();
		}
		return o;
	};
})();


// almost, but not quite, like WP's sanitize_title_with_dashes
cf.slugify = function(string) {
	return string.toLowerCase().replace(/[^%a-z0-9 _-]/g, '').replace(/\s+/g, '-');
}

// thanks, quirksmode!
cf.windowDimensions = function() {
	var x,y;
	if (self.innerHeight) { 
		// all except Explorer
		x = self.innerWidth;
		y = self.innerHeight;
	}
	else if (document.documentElement && document.documentElement.clientHeight) {
		// Explorer 6 Strict Mode
		x = document.documentElement.clientWidth;
		y = document.documentElement.clientHeight;
	}
	else if (document.body) { 
		// other Explorers
		x = document.body.clientWidth;
		y = document.body.clientHeight;
	}
	return { x: x, y: y };
}

cf.scrollingOffset = function() {
	var x,y;
	if (self.pageYOffset) { // all except Explorer
		x = self.pageXOffset;
		y = self.pageYOffset;
	}
	else if (document.documentElement && document.documentElement.scrollTop) {
		// Explorer 6 Strict
		x = document.documentElement.scrollLeft;
		y = document.documentElement.scrollTop;
	}
	else if (document.body) { // all other Explorers
		x = document.body.scrollLeft;
		y = document.body.scrollTop;
	}
	return { x: x, y: y };
}

cf.pagePosition = function(element) {
	return jQuery(element).offset();
}

// elements' "hasLayout" must be set for this to work in msie.
// give them a zoom:1 css property to force hasLayout.
// NB: the value returned from this *includes* padding.
cf.pageFrame = function(element) {
	var pos = cf.pagePosition(element);
	pos.width = element.clientWidth;
	pos.height = element.clientHeight;
	return pos;
}

cf.gobbleEvent = function(e) {
	e.cancelBubble = true;	// MS
	if (e.preventDefault) e.preventDefault();
	if (e.stopPropagation) e.stopPropagation();	// W3C
}

cf.pointInRect = function(point, rect) {
	return (
		(point.y >= rect.top) && (point.y <= rect.top + rect.height) &&
		(point.x >= rect.left) && (point.x <= rect.left + rect.width)
	);
}

cf.disableTextSelection = function(element) {
	element.onselectstart = function() {
		return false;
	};
	element.unselectable = "on";
	element.style.MozUserSelect = "none";
}

// ie joy
if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(elt /*, from*/) {
		var len = this.length;

		var from = Number(arguments[1]) || 0;
		from = (from < 0) ? Math.ceil(from) : Math.floor(from);
		if (from < 0)
			from += len;

		for (; from < len; from++) {
			if (from in this && this[from] === elt) return from;
		}
		return -1;
	};
}