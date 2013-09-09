
oc.TagToken = CFTextToken.extend({
	init: function(tag) {
		this._super(tag.text, 'oc_tagToken_' + cf.slugify(tag.text));
		this.tag = tag;
		var poppet = this;
		// ie does not respect the toString in our prototype. assign it by hand here.
		this.toString = function() { return poppet.getSortKey(); };
	},
	getInlineClass: function() {
		if (this.tag.isUserGenerated()) {
			return 'oc_tagToken userInline';
		}
		else {
			var className = this.tag.source.getTagTypeClassName();
			return 'oc_tagToken suggestedInline' + (className.length ? ' ' + className : '');
		}
	},
	
	getOverlayClass: function() {
		if (this.tag.isUserGenerated()) {
			return 'oc_tagToken userOverlay';			
		}
		else {
			var className = this.tag.source.getTagTypeClassName();
			return 'oc_tagToken suggestedOverlay' + (className.length ? ' ' + className : '');
		}
	},
	
	getOverlayFrame: function(inlineFrame, overlayFrame) {
		var marginDeltaY = parseInt(this.jqInline.css('margin-top'));
		var marginDeltaX = parseInt(this.jqInline.css('margin-left'));
		var controlsWidth = (this.tag.bucketName == 'current') ? 70 : 0;
		var width = controlsWidth + inlineFrame.width;
		var left = inlineFrame.left - marginDeltaX;
		
		if (this.tag.bucketName != 'current') {
			var w = jQuery('span.token-text', this.jqInline).width() - 70;
			if (this.textWidth > w) {
				var delta = (this.textWidth - w) + ((jQuery.browser.msie && jQuery.browser.version < 7.0) ? 30 : 10);
				width += delta;
				left -= delta;
			}
		}
		return {
			left: left,
			top: inlineFrame.top - marginDeltaY,
			width: width,
			height: inlineFrame.height
		};
	},
		
	getContentHTML: function(mode) {
		if (this.tag.bucketName == 'current' && mode == 'inline') {
			return '<span class="token-text">' + this.text + '</span>';
		}
		
		var addHover = '';
		if (this.tag.bucketName != 'current' && mode == 'overlay') {
			addHover = ' hover';
		}
		
		var addButton = '<span class="right_textTokenButton' + addHover + ' add" id="add_textTokenButton_' + this.id_tag + '_' + mode + '"></span>';
		if (this.tag.bucketName == 'current') {
			addButton = '';
		}
		var killButton = '<span class="right_textTokenButton kill" id="kill_textTokenButton_' + this.id_tag + '_' + mode + '"></span>';
		if (this.tag.bucketName == 'blacklisted') {
			killButton = '';
		}
		var imageButton = '<span class="right_textTokenButton image" id="image_textTokenButton_' + this.id_tag + '_' + mode + '"></span>';
		
		var title = this.tag.source ? this.text + ' | Relevance: ' + this.tag.source.getNormalizedRelevance().toString().substr(0, 4) : this.text;
		var text = this.text;
		var limit = jQuery.browser.msie ? 25 : 28;
		if (this.tag.bucketName == 'blacklisted') {
			limit += 5;
		}
		if (text.length > limit && mode == 'inline') {
			text = text.substr(0, limit - 2) + '&hellip;';
		}
		return killButton + imageButton + addButton + '<span title="' + title + '" id="oc_tagName_' + this.id_tag + '" class="token-text">' + text + '</span>';
	},
	
	wasInsertedIntoDOM: function() {
		this._super();
		var poppet = this;
		jQuery('#add_textTokenButton_' + this.id_tag + '_overlay').mousedown(function(e) {
			oc.tagManager.putTagInCurrent(poppet.tag);
		});
		jQuery('#kill_textTokenButton_' + this.id_tag + '_overlay').mousedown(function(e) {
			if (!poppet.tag.isUserGenerated()) {
				if (poppet.tag.bucketName == 'current') {
					oc.tagManager.putTagInBlacklist(poppet.tag, 'user');
				}
				else if (poppet.tag.bucketName == 'suggested') {
					oc.tagManager.putTagInBlacklist(poppet.tag, 'user');
				}
				else if (poppet.tag.bucketName == 'blacklisted') {
					oc.tagManager.putTagInSuggested(poppet.tag, 'user');
				}
			}
			else {
				oc.tagManager.deleteTag(poppet.tag);
			}
			cf.gobbleEvent(e);
			return false;
		});
		jQuery('#image_textTokenButton_' + this.id_tag + '_overlay').mousedown(function(e) {
				oc.imageManager.pingFlickr(oc.imageManager.mode_specificTags, true, poppet.tag.text);
				return false;
			}
		);
		
		jQuery('#kill_textTokenButton_' + this.id_tag + '_overlay').hover(
			function(e) {
				if (poppet.tag.bucketName == 'suggested') {
					jQuery('#add_textTokenButton_' + poppet.id_tag + '_overlay').removeClass('hover');
				}
				if (poppet.tag.bucketName != 'blacklisted') {
					jQuery(this).addClass('hover');
				}
			},
			function(e) { 
				if (poppet.tag.bucketName == 'suggested') {
					jQuery('#add_textTokenButton_' + poppet.id_tag + '_overlay').addClass('hover');
				}
				if (poppet.tag.bucketName != 'blacklisted') {
					jQuery(this).removeClass('hover');
				}
			}
		);
		jQuery('#image_textTokenButton_' + this.id_tag + '_overlay').hover(
			function(e) {
				if (poppet.tag.bucketName != 'current') {
					jQuery('#add_textTokenButton_' + poppet.id_tag + '_overlay').removeClass('hover');
				}
				jQuery(this).addClass('hover');
			},
			function(e) { 
				if (poppet.tag.bucketName != 'current') {
					jQuery('#add_textTokenButton_' + poppet.id_tag + '_overlay').addClass('hover');
				}
				jQuery(this).removeClass('hover');
			}
		);
		
		// figure out default width of our text
		this.textWidth = jQuery('<span class="dummy_token-text" id="dummy_' + this.id_tag + '">' + this.text + '</span>').appendTo('body').width();
		jQuery('#dummy_' + this.id_tag).remove();
		
		cf.disableTextSelection(this.jqInline.get(0));
		cf.disableTextSelection(jQuery('span.token-text', this.jqInline).get(0));
		cf.disableTextSelection(this.jqOverlay.get(0));
		cf.disableTextSelection(jQuery('span.token-text', this.jqOverlay).get(0));
	},
	
	wasRemovedFromDOM: function() {
		this.hideTooltip();
	},

	overlayClicked: function(e) {
		this._super(e);
		if (this.tag.bucketName != 'current') {
			oc.tagManager.putTagInCurrent(this.tag);
		}
	},

	showTooltip: function() {
		
		// in case we missed the hover-off
		this.hideTooltip();
		this.jqTooltip = jQuery('\
			<div class="cf_tooltip tagToken">\
				<div>' + this.tag.source.getTagTypeName() + '</div>\
			</div>\
		').appendTo('body');

		var overlayFrame = cf.pageFrame(this.jqOverlay.get(0));
		var tooltipFrame = cf.pageFrame(this.jqTooltip.get(0));
				
		var left = overlayFrame.left + 25;
		var w = Math.max(
				tooltipFrame.width - parseInt(this.jqTooltip.css('padding-left')) - parseInt(this.jqTooltip.css('padding-right')),
				overlayFrame.width
			);

		if ((left + w) > window.outerWidth) {
			left -= (left + w) - window.outerWidth;
		}
		var css =  {
			left: left + 'px',
			top: overlayFrame.top + overlayFrame.height + 'px',
			visibility:'visible',
			display:'none'
		};
		this.jqTooltip.css(css).show();		
	},
	
	hideTooltip: function() {
		if (this.jqTooltip) {
			var poppet = this;
			this.jqTooltip.hide('fast', function() { poppet.jqTooltip.remove(); } );
		}		
	},
	
	getSortKey: function() {
		if (this.tag) {
			if (this.tag.isUserGenerated()) {
				return Number.MAX_VALUE;
			}
			return parseFloat(this.tag.source.getNormalizedRelevance());
		}
		return this._super();
	},
		
	tag: null,	// NB this is a ref to the full-fledged tag object, not just a string
	jqTooltip: null,
	textWidth: -1
});
