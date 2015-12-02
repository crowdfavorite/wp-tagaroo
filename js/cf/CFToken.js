
// Tokens are drag-droppable boxes that display an overlay when hovering and dragging.
//
// The JS object represents the UI element but lives independently
// of its visual representation in the DOM. Call insertIntoDOM to add it or move
// it around and removeFromDOM to take it out.

var cfdebugdd = false;

ddlog = function(string) {
	if (cfdebugdd) {
		console.log(string);
	}
}

var CFToken = CFBase.extend({
	init: function(name, id_tag, options) {
		if (typeof id_tag == 'undefined') {
			this.id_tag = cf.slugify(name) + new Date().valueOf();
		}
		else {
			this.id_tag = id_tag
		}
		this.name = name;
		if (typeof options != 'undefined') {
			this.options = options;
		}
	},

	getInlineClass: function() {
		return 'cf_token inline';
	},

	getOverlayClass: function() {
		return 'cf_token overlay';
	},

	getInlineHTML: function() {
		return '<li class="' + this.getInlineClass() + '" id="cf_token_inline_' + this.id_tag + '"><span class="left-endcap"></span>' + this.getContentHTML('inline') + '<span class="right-endcap"></span></li>';
	},

	// override to draw content. mode can be one of ['inline' | 'overlay']
	getContentHTML: function(mode) {
		return '';
	},

	getOverlayHTML: function() {
		return '<div class="' + this.getOverlayClass() + '" id="cf_token_overlay_' + this.id_tag + '"><span class="left-endcap"></span>' + this.getContentHTML('overlay') +'<span class="right-endcap"></span></div>';
	},

	// jQueryManip is one of: append, prepend, after, before, etc...
	insertIntoDOM: function(jQueryManip, relativeTo) {
		this.willBeInsertedIntoDOM();

		var html = this.getInlineHTML();
		eval('jQuery(relativeTo).' + jQueryManip + '(html);');
		jQuery('body').append(this.getOverlayHTML());
		this.wasInsertedIntoDOM();
	},

	removeFromDOM: function() {
		if (this.isInDOM) {
			this.willBeRemovedFromDOM();
			this.jqInline.remove();
			this.jqOverlay.remove();
			this.isInDOM = false;
			this.wasRemovedFromDOM();
		}
	},

	// subclasses may override
	willBeInsertedIntoDOM: function() {
		this.removeFromDOM();
	},
	wasInsertedIntoDOM: function() {
		this.jqInline = jQuery('#cf_token_inline_' + this.id_tag);
		this.jqOverlay = jQuery('#cf_token_overlay_' + this.id_tag);
		var poppet = this;
		this.jqInline.on('mouseenter', function(e) { poppet.inlineHoverStart(); });
		this.jqOverlay.on('mouseenter', function(e) { poppet.overlayHoverStart(); });
		this.jqOverlay.on('mouseleave', function(e) { poppet.overlayHoverEnd(); poppet.inlineHoverEnd(); });
		this.isInDOM = true;
	},
	willBeRemovedFromDOM: function() {},
	wasRemovedFromDOM: function() {},

	_inlineClickHandler: null,
	_inlineDoubleClickHandler: null,
	inlineHoverStart: function() {
		ddlog('inlineHoverStart');
		if (!this.showingOverlay && !cf.tokenManager.tokensAreBeingDragged() && this.shouldShowOverlay()) {
			this.showOverlay();
		}
		var poppet = this;
		this._inlineClickHandler = function(e) { poppet.inlineClicked(e); };
		this._inlineDoubleClickHandler = function(e) { poppet.inlineDoubleClicked(e); };
		this.jqInline.click(this._inlineClickHandler);
		this.jqInline.dblclick(this._inlineDoubleClickHandler);
	},

	inlineHoverEnd: function() {
		ddlog('inlineHoverEnd');
		var poppet = this;
		if (this.showingOverlay) {
			if (poppet.overlayWaitingForHover) {
				poppet.hideOverlay();
			}
			poppet.overlayWaitingForHover = false;
		}
		this.jqInline.unbind('click', this._inlineClickHandler);
		this.jqInline.unbind('dblclick', this._inlineDoubleClickHandler);
	},

	inlineClicked: function(e) {
	},
	inlineDoubleClicked: function(e) {
	},

	overlayHoverStart: function() {
		ddlog('overlayHoverStart');
		this.overlayHasHover = true;
		this.overlayWaitingForHover = false;
		var poppet = this;
		this.jqOverlay.mousedown(function(e) {
			poppet.overlayMouseDown(e);
			cf.gobbleEvent(e);
		});
	},

	overlayHoverEnd: function() {
		ddlog('overlayHoverEnd');
		if (this.showingOverlay && !this.draggingOverlay) {
			this.overlayHasHover = false;
			this.jqOverlay.unbind('mousedown');
			this.hideOverlay();
		}
		this.overlayWaitingForHover = false;
	},

	_overlayInitialMouseMovedHandler: null,
	_overlayInitialMouseUpHandler: null,
	overlayMouseDown: function(e) {
		if (this.overlayHasMouseDown) {
			// for some reason we get two mousedown events sometimes. grr.
			return;
		}
		var poppet = this;
		this.overlayHasMouseDown = true;
		this.overlayMouseDownPos = { x:e.pageX, y:e.pageY };
		this.overlayMouseDownTime = new Date().valueOf();
		ddlog('overlayMouseDown, ' + this.overlayMouseDownTime + '(' + this.overlayMouseDownPos.x + ', ' + this.overlayMouseDownPos.y + ')');
		this._overlayInitialMouseMovedHandler = function(e) {
			ddlog('_overlayInitialMouseMovedHandler, ' + (new Date().valueOf() - poppet.overlayMouseDownTime) + '(' + e.pageX + ', ' + e.pageY + ')');
			if (poppet.overlayHasMouseDown && ((new Date().valueOf() - poppet.overlayMouseDownTime) > 10) &&
				(e.pageX >= poppet.overlayMouseDownPos.x + 2 || e.pageX <= poppet.overlayMouseDownPos.x - 2) ||
				(e.pageY >= poppet.overlayMouseDownPos.y + 2 || e.pageY <= poppet.overlayMouseDownPos.y - 2)) {
				jQuery('body').unbind('mousemove', poppet._overlayInitialMouseMovedHandler);
				if (poppet.overlayShouldBeDraggable()) {
					poppet.overlayDragBegin(e);
				}

			}
			return true;
		}
		this._overlayInitialMouseUpHandler = function(e) {
			poppet.overlayMouseUp(e);
		}

		jQuery('body').mousemove(this._overlayInitialMouseMovedHandler);
		if (jQuery.browser.msie) {
			jQuery('body').mouseup(this._overlayInitialMouseUpHandler);
		}
		else {
			jQuery(window).mouseup(this._overlayInitialMouseUpHandler);
		}

	},

	overlayMouseUp: function(e) {
		ddlog('overlayMouseUp');
		this.overlayHasMouseDown = false;
		if (this.draggingOverlay) {
			cf.tokenManager.handleDragMouseUp();
			this.overlayDragEnd(e);
		}
		else {
			this.overlayClicked(e);
		}

		jQuery('body').unbind('mousemove', this._overlayInitialMouseMovedHandler);
		if (jQuery.browser.msie) {
			jQuery('body').unbind('mouseup', this._overlayInitialMouseUpHandler);
		}
		else {
			jQuery(window).unbind('mouseup', this._overlayInitialMouseUpHandler);
		}

	},

	overlayClicked: function(e) {
		ddlog('overlayClicked');
	},

	_overlayDraggingMouseMovedHandler: null,
	_overlayDraggingMouseUpHandler: null,
	overlayDragBegin: function(e) {
		ddlog('overlayDragBegin');
		var poppet = this;
		var overlayPos = cf.pagePosition(this.jqInline.get(0));
		var paddingOffset = parseInt(this.jqOverlay.css('padding-left'));
		this.dragOffset = { left: (overlayPos.left - e.pageX - paddingOffset), top: (overlayPos.top - e.pageY) };

		this._overlayDraggingMouseMovedHandler = function(e) {
			if (poppet.draggingOverlay) {
				poppet.overlayDragContinue(e);
			}
			return true;
		}
		jQuery('body').mousemove(this._overlayDraggingMouseMovedHandler);

		this._overlayDraggingMouseUpHandler = function(e) {
			poppet.overlayMouseUp(e);
			return true;
		}
		if (jQuery.browser.msie) {
			jQuery('body').mouseup(this._overlayDraggingMouseUpHandler);
		}
		else {
			jQuery(window).mouseup(this._overlayDraggingMouseUpHandler);
		}

		this.draggingOverlay = true;
		cf.tokenManager.dragStarted(this);
		this.jqInline.hide();
	},

	overlayDragEnd: function(e) {
		ddlog('overlayDragEnd');
		jQuery('body').unbind('mousemove', this._overlayDraggingMouseMovedHandler);
		if (jQuery.browser.msie) {
			jQuery('body').unbind('mouseup', this._overlayDraggingMouseUpHandler);
		}
		else {
			jQuery(window).unbind('mouseup', this._overlayDraggingMouseUpHandler);
		}

		this.draggingOverlay = false;
		cf.tokenManager.dragEnded(this);
		this.overlayHoverEnd();
		this.jqInline.show();
	},

	overlayDragContinue: function(e) {
		if (this.draggingOverlay) {
			ddlog('overlayDragContinue: (' + e.pageX + ', ' + e.pageY + ') ');
			this.jqOverlay.css({
				left: e.pageX + this.dragOffset.left,
				top: e.pageY + this.dragOffset.top
			});
		}
		else {
			ddlog('overlayDragContinue, overlay not being dragged, gobbling the event');
			cf.gobbleEvent(e);
		}

	},

	// for subclasses:
	// the inlineFrame and overlayFrame arguments will *include* padding in their width and height
	// values.
	//
	// the return values from this method should also *include* padding in their values. in other words,
	// the padding will be subtracted automatically before setting the css width: and height: values.
	//
	// default centers the overlay
	getOverlayFrame: function(inlineFrame, overlayFrame) {
		var marginDeltaY = parseInt(this.jqInline.css('margin-top'));
		var marginDeltaX = parseInt(this.jqInline.css('margin-left'));
		return {
			left: inlineFrame.left + (inlineFrame.width / 2.0) - (overlayFrame.width / 2.0) - marginDeltaX,
			top: inlineFrame.top + (inlineFrame.height / 2.0) - (overlayFrame.height / 2.0) - marginDeltaY,
			width: overlayFrame.width - parseInt(this.jqOverlay.css('padding-left')) - parseInt(this.jqOverlay.css('padding-right')),
			height: overlayFrame.height - parseInt(this.jqOverlay.css('padding-bottom')) - parseInt(this.jqOverlay.css('padding-top'))
		};
	},

	_overlayShowHideMouseMovedHandler: null,
	showOverlay: function() {
		ddlog('showOverlay ' + this.id_tag);
		var inlineFrame = cf.pageFrame(this.jqInline.get(0));
		var overlayFrame = cf.pageFrame(this.jqOverlay.get(0));
		var newFrame = this.getOverlayFrame(inlineFrame, overlayFrame);
		this.willShowOverlay();
		this.jqOverlay.css({
			visibility:'visible',
			left: newFrame.left,
			top: newFrame.top,
			width: newFrame.width - parseInt(this.jqOverlay.css('padding-left')) - parseInt(this.jqOverlay.css('padding-right')),
			height: newFrame.height - parseInt(this.jqOverlay.css('padding-top')) - parseInt(this.jqOverlay.css('padding-bottom'))
		});
		this.showingOverlay = true;
		this.overlayWaitingForHover = true;
		this.didShowOverlay();

		var poppet = this;
		this._overlayShowHideMouseMovedHandler = function(e) {
			ddlog('_overlayShowHideMouseMovedHandler ' + poppet.id_tag + ', overlayHasHover: ' + (poppet.overlayHasHover ? 'yes' : 'no'));
			if (poppet.showingOverlay &&
				!poppet.overlayWaitingForHover &&
				poppet.overlayHasHover &&
				!poppet.draggingOverlay &&
				!cf.pointInRect({ x: e.pageX, y: e.pageY }, cf.pageFrame(poppet.jqOverlay.get(0)))) {
				ddlog('_overlayShowHideMouseMovedHandler hiding overlay ' + poppet.id_tag);
				poppet.hideOverlay();
			}
		}
		jQuery('body').mousemove(this._overlayShowHideMouseMovedHandler);
	},

	hideOverlay: function() {
		this.willHideOverlay();
		ddlog('hideOverlay ' + this.id_tag);
		this.jqOverlay.css('visibility', 'hidden');
		this.showingOverlay = false;
		this.overlayHoverEnd();
		jQuery('body').unbind('mousemove', this._overlayShowHideMouseMovedHandler);
		this.didHideOverlay();
	},

	shouldShowOverlay: function() {
		return true;
	},
	overlayShouldBeDraggable: function() {
		return true;
	},
	willShowOverlay: function() {},
	didShowOverlay: function() {},
	willHideOverlay: function() {},
	didHideOverlay: function() {},

	getSortKey: function() {
		return this.name;
	},

	toString: function() {
		return this.getSortKey();
	},

	id_tag: '',
	name: '',
	options: {},
	jqInline: null,
	jqOverlay: null,
	showingOverlay: false,
	overlayMouseDownPos: { x: 0, y: 0 },
	overlayMouseDownTime: null,
	overlayWaitingForHover: false,
	overlayHasHover: false,
	overlayHasMouseDown: false,
	draggingOverlay: false,
	dragOffset: { left:0, top:0 },
	isInDOM: false,
	overlayExists: false
});
