
oc.ImageParadeBox = CFTokenBox.extend({
	init: function() {
		this._super('image_filmstrip');
	},
	handleDrop: function(tokens) {
		var tags = [];
		jQuery.each(tokens, function(i, token) {
			if (token.tag) {
				tags.push(token.tag.text);
			}
		});
		if (tags.length) {
			oc.imageManager.pingFlickr(oc.imageManager.mode_specificTags, true, tags.join(','));
		}
	},
	canAcceptDrop: function() {
		var payload = cf.tokenManager.tokensBeingDragged();
		jQuery.each(payload, function(i, token) {
			if (!token.tag) {
				return false;
			}
		});
		return true;
	},
	getListClass: function() {
		return 'cf_tokenbox cloud';
	},
	getDropFocusClass: function() {
		return 'cf_imageBoxHighlight';
	},

	addToken: function(token) {
		if (this.showingEmptyMessage && token) {
			this.jq.html('<ul class="' + this.getListClass() + '"></ul>');
			this.showingEmptyMessage = false;
		}
		this._super(token);
	},
	removeToken: function(token) {
		this._super(token);
		if (!this.showingEmptyMessage && this.tokens.length == 0) {
			this.showEmptyMessage();
		}
	},
	
	showEmptyMessage: function() {
		if (!this.showingEmptyMessage && this.tokens.length == 0) {
			this.jq.html('<div class="oc_empty">No Images</div>');
			this.showingEmptyMessage = true;
		}
	},
	
	showingEmptyMessage: false
	
});