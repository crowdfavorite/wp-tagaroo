
var CFTokenBox = CFBase.extend({
	init: function(id_tag, title) {
		this.id_tag = id_tag;
		this.title = title || '';
	},
	addTokens: function(tokens) {
		jQuery.each(this.tokens, function(i, token) {
			token.removeFromDOM();
		});
		this.tokens = this.tokens.concat(tokens);
		
		this.sortTokens();
		
		var poppet = this;
		var inline = '';
		var overlay = '';
		jQuery.each(this.tokens, function(i, token) {
			inline += token.getInlineHTML();
			overlay += token.getOverlayHTML();
			token.willBeInsertedIntoDOM();
			//token.insertIntoDOM('append', jQuery('ul.cf_tokenbox', poppet.jq));
		});
		jQuery('ul.cf_tokenbox', this.jq).append(inline);
		jQuery('body').append(overlay);
		jQuery.each(this.tokens, function(i, token) {
			token.wasInsertedIntoDOM();
		});
	},
	addToken: function(token) {
		jQuery.each(this.tokens, function(i, token) {
			token.removeFromDOM();
		});
		this.tokens.push(token);
		this.sortTokens();
		var poppet = this;
		jQuery.each(this.tokens, function(i, token) {
			token.insertIntoDOM('append', jQuery('ul.cf_tokenbox', poppet.jq));
		});
	},
	removeToken: function(token) {
		token.removeFromDOM();
		this.tokens = jQuery.grep(this.tokens, function(t) {
			return (t != token);
		});
	},
	removeTokens: function() {
		var poppet = this;
		// slight optimization to short-curcuit nested looping on each individual removeToken call
		var tokensCopy = this.tokens;
		this.tokens = [];
		jQuery.each(tokensCopy, function(i, token) {
			poppet.removeToken(token);
		});
	},
	
	sortTokens: function() {
		// for performance on ie, we sort using built-in string comparison
		this.tokens.sort();
		this.tokens.reverse();
	},
	
	// jQueryManip is one of: append, prepend, after, before, etc...
	insertIntoDOM: function(jQueryManip, relativeTo) {
		this.willBeInsertedIntoDOM();
		var html = this.getContainerHTML();
		eval('jQuery(relativeTo).' + jQueryManip + '(html);');
		this.jq = jQuery('#cf_tokenbox_' + this.id_tag);
		this.registerEvents();
		cf.tokenManager.registerDropBox(this);
		this.wasInsertedIntoDOM();
	},
	
	willBeInsertedIntoDOM: function() {},
	wasInsertedIntoDOM: function() {},
	
	getContainerHTML: function() {
		var header = '';
		if (this.title.length) {
			header = '<h4 id="cf_tokenbox_header_' + this.id_tag + '" class="cf_tokenbox_header">' + this.title + '</h4>';
		}
		return '\
		' + header + '\
		<div id="cf_tokenbox_' + this.id_tag + '" class="cf_tokenbox_wrapper">\
			<ul class="' + this.getListClass() + '"></ul>\
		</div>';
	},
	
	getListClass: function() {
		return 'cf_tokenbox';
	},
	
	// the "i can accept this drop" highlight class
	getDropFocusClass: function() {
		return 'cf_tokenBoxHighlight';
	},
	
	_bodyMouseMovedHandler: null,
	registerEvents: function() {
		var poppet = this;
		this._bodyMouseMovedHandler = function(e) {
			var element = poppet.jq.get(0);
			if (cf.pointInRect({ x: e.pageX, y: e.pageY }, cf.pageFrame(element))) {
				if (!poppet.mouseIsHovering) {
					poppet.mouseOver();
				}				
				poppet.bodyMouseMoved(e);
			}
			else if (poppet.mouseIsHovering) {
				poppet.mouseOut();
			}
			return true;
		}
		jQuery('body').mousemove(this._bodyMouseMovedHandler);
	},
	
	_bodyMouseUpHandler: null,
	mouseOver: function() {
		this.mouseIsHovering = true;
		if (cf.tokenManager.nDrags > 0 && this.canAcceptDrop()) {
			var poppet = this;
			this.jq.addClass(this.getDropFocusClass());
			cf.tokenManager.setTokenBoxWaitingForDrop(this);
			this._bodyMouseUpHandler = function(e) {
				poppet.mouseUp(e);
			}
		}
	},
	
	mouseOut: function(e) {
		this.mouseIsHovering = false;
		this.jq.removeClass(this.getDropFocusClass());
		cf.tokenManager.setTokenBoxStoppedWaitingForDrop(this);
	},
	
	mouseUp: function(e) {
		var tokens = cf.tokenManager.tokensBeingDragged();
		this.handleDrop(tokens);		
		this.dropCompleted();
	},
	
	bodyMouseMoved: function() {
	},
	
	// subclasses can override.
	canAcceptDrop: function() {
		return (cf.tokenManager.nDrags > 0);
	},
	
	// subclasses can override. tokens is an array.
	// default implementation just adds tokens.
	handleDrop: function(tokens) {
		this.addTokens(tokens);
	},
	
	dropCompleted: function() {
		this.jq.removeClass(this.getDropFocusClass());
		cf.tokenManager.setTokenBoxStoppedWaitingForDrop(this);
		
		// meh.
		oc.tagManager._invokeUpdates();
	},
	
	id_tag: '',
	title: '', 
	jq: null,
	tokens: [],
	mouseIsHovering: false
	
});
