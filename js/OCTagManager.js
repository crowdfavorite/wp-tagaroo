

// Owner of how a tag is classified: current, suggested, blacklisted.
// Generally you should use the TagManager's methods to manage tags
// rather than the lower level stuff. Ex: createTagIfNew method instead
// of creating a tag independently.

oc.TagManager = CFBase.extend({
	init: function() {
	},

	// have a slug? need a tag? come here. i give you best deal.
	tagForSlug: function(slug) {
		return this.tagSlugMap[slug];
	},

	// tags register themselves upon creation/rehydration. no need to do it manually.
	registerTag: function(tag) {
		this.tagSlugMap[tag.slug] = tag;
	},

	// tags will unregister themselves when their delete method is called
	// which, since js doesn't have automatic destructors, you *may* need to do by hand.
	// but for most cases, calling tagManager.deleteTag(tag) is the way to go.
	unregisterTag: function(tag) {
		this._removeTagFromBuckets(tag);
		delete this.tagSlugMap[tag.slug];// = undefined;
	},

	_removeTagFromBuckets: function(tag) {
		switch(tag.bucketName) {
			case 'suggested':
				this.suggestedTags = jQuery.grep(this.suggestedTags, function(t, i) {
					return tag != t;
				});
				this.updateSuggestedBox();
			break;
			case 'current':
				this.currentTags = jQuery.grep(this.currentTags, function(t, i) {
					return tag != t;
				});
				this.updateCurrentBox();
			break;
			case 'blacklisted':
				this.blacklistedTags = jQuery.grep(this.blacklistedTags, function(t, i) {
					return tag != t;
				});
				this.updateBlacklistedBox();
			break;
			case 'none':
			default:
		}
		tag._setBucketName('none');
	},

	deleteUnusedSuggestedTags: function() {
		var poppet = this;
		jQuery.each(this.tagSlugMap, function(slug, tag) {
			if (tag.bucketName == 'suggested') {
				poppet.deleteTag(tag);
			}
			else if (tag.bucketName == 'blacklisted' && tag.getBucketPlacement() != 'user') {
				poppet.deleteTag(tag);
			}
		});
	},

	updateSuggestedBox: function() {
		if (!this.deferUpdates) {
			this.suggestedBox.removeTokens();
			var poppet = this;
			this.suggestedBox.addTokens(jQuery.map(this.suggestedTags, function(tag) {
				return (poppet.suggestedFilter == 'All' || tag.source.getTagTypeName() == poppet.suggestedFilter) ? tag.textToken : null;
			}));
			/*
			jQuery.each(this.suggestedTags, function(i, tag) {
				if (poppet.suggestedFilter == 'All' || tag.source.getTagTypeName() == poppet.suggestedFilter) {
					poppet.suggestedBox.addToken(tag.textToken);
				}
			});
			*/
		}
		else {
			this._addUpdateMethod(this.updateSuggestedBox);
		}
	},
	updateCurrentBox: function() {
		if (!this.deferUpdates) {
			this.currentBox.removeTokens();
			var poppet = this;
			this.currentBox.addTokens(jQuery.map(this.currentTags, function(tag) { return tag.textToken; }));
			/*
			jQuery.each(this.currentTags, function(i, tag) {
				poppet.currentBox.addToken(tag.textToken);
			});
			*/
		}
		else {
			this._addUpdateMethod(this.updateCurrentBox);
		}
	},
	updateBlacklistedBox: function() {
		if (!this.deferUpdates) {
			this.blacklistedBox.removeTokens();
			var poppet = this;
			this.blacklistedBox.addTokens(jQuery.map(this.blacklistedTags, function(tag) { return tag.textToken; }));
			/*
			jQuery.each(this.blacklistedTags, function(i, tag) {
				poppet.blacklistedBox.addToken(tag.textToken);
			});
			*/
		}
		else {
			this._addUpdateMethod(this.updateBlacklistedBox);
		}
	},

	updateBoxes: function() {
		// methods list is a fifo. order of invocation is important.
		// the suggested box, for example, depends on the filter list being updated first.
		this._addUpdateMethod(this.updateFilterList);
		this._addUpdateMethod(this.updateBlacklistedBox);
		this._addUpdateMethod(this.updateSuggestedBox);
		this._addUpdateMethod(this.updateCurrentBox);
	},

	// defer all UI updates until we drop to idle, then do it once
	_addUpdateMethod: function(method) {
		// if deferUpdates is off, we're in the middle of invoking deferred updates.
		// let's not go there.
		if (!this.deferUpdates) {
			return;
		}

		// we currently may need to run the same method twice at different times.
		// but it's safe to not make several calls to the same method in a row.
		if (this.updateMethods[this.updateMethods.length - 1] != method) {
			this.updateMethods.push(method);
		}

		if (!this.updateTimerRef) {
			var poppet = this;
			this.updateTimerRef = setTimeout(function() { poppet._invokeUpdates(); }, 0);
		}
	},

	_invokeUpdates: function() {
		var poppet = this;
		var methods = this.updateMethods;
		var nMethods = methods.length;
		this.updateMethods = [];

		this.deferUpdates = false;
		// kinda dumb optimization
		if (nMethods > 6) {
			this.updateFilterList();
			this.updateBlacklistedBox();
			this.updateSuggestedBox();
			this.updateCurrentBox();
			this.updateSuggestedBox();
			this.updateBlacklistedBox();
		}
		else {
			for (var i = 0; i < nMethods; i++) {
				methods.shift().call(this);
			}
		}
		this.deferUpdates = true;

		oc.updateArchiveField();	// for now, just always call it
		if (this.updateTimerRef) {
			clearTimeout(this.updateTimerRef);
			this.updateTimerRef = 0;
		}
	},

	putTagInSuggested: function(tag, placement) {
		if (tag) {
			this._removeTagFromBuckets(tag);
			this.suggestedTags.push(tag);
			tag._setBucketName('suggested');
			tag._setBucketPlacement(placement || 'auto');
			this.updateBoxes();
		}
	},

	putTagInCurrent: function(tag, placement) {
		if (tag) {
			this._removeTagFromBuckets(tag);
			this.currentTags.push(tag);
			tag._setBucketName('current');
			tag._setBucketPlacement(placement || 'auto');
			this.updateBoxes();
		}
	},

	putTagInBlacklist: function(tag, placement) {
		if (tag) {
			this._removeTagFromBuckets(tag);
			this.blacklistedTags.push(tag);
			tag._setBucketName('blacklisted');
			tag._setBucketPlacement(placement || 'auto');
			this.updateBoxes();
		}
	},

	putAllSuggestedInCurrent: function() {
		var poppet = this;
		jQuery.each(this.suggestedTags, function(i, tag) {
			if (poppet.suggestedFilter == 'All' || tag.source.getTagTypeName() == poppet.suggestedFilter) {
				poppet.putTagInCurrent(tag);
			}
		});
	},

	toggleSuggestedIgnoredBuckets: function() {
		if (this.suggestedShowing) {
			this.showIgnoredBucket();
		}
		else {
			this.showSuggestedBucket();
		}
	},

	showSuggestedBucket: function() {
		jQuery('#cf_tokenbox_suggested_tags').slideDown('fast');
		jQuery('#oc_filter_tags_form').slideDown('fast');
		jQuery('#cf_tokenbox_blacklisted_tags').slideUp('fast');
		this.suggestedShowing = true;
	},

	showIgnoredBucket: function() {
		jQuery('#cf_tokenbox_suggested_tags').slideUp('fast');
		jQuery('#oc_filter_tags_form').slideUp('fast');
		jQuery('#cf_tokenbox_blacklisted_tags').slideDown('fast');
		this.suggestedShowing = false;
	},

	updateFilterList: function() {
		if (!this.deferUpdates) {
			if (this.shouldUpdateFilterList) {
				var poppet = this;
				var filterNames = {};
				jQuery.each(this.tagSlugMap, function(slug, tag) {
					if (!tag.isUserGenerated() && tag.source.type) {
						if (tag.bucketName == 'suggested') {
							filterNames[tag.source.getTagTypeName()] = true;
						}
					}
				});
				var currentStillExists = false;
				var optionsHTML = '<option label="All">All</option>';
				jQuery.each(filterNames, function(name, dummy) {
					if (name == poppet.suggestedFilter) {
						currentStillExists = true;
					}
					optionsHTML += '<option label="' + name + '">' + name + '</option>';
				});
				jQuery('#oc_tag_filter_select').html(optionsHTML);
				if (jQuery.browser.msie && jQuery.browser.version >= 7.0 && jQuery.browser.version < 8.0) {
					if (jQuery('#oc_filter_tags_form').css('display') != 'none') {
						jQuery('#oc_filter_tags_form').hide().show();	// don't ask.
					}
				}
				if (!currentStillExists) {
					this.filterSuggestedByType('All');
					jQuery('#oc_tag_filter_select option[label=All]').attr('selected', 'selected');
				}
				else {
					this.filterSuggestedByType(this.suggestedFilter);
					jQuery('#oc_tag_filter_select option[label="' + this.suggestedFilter + '"]').attr('selected', 'selected');
				}
			}
		}
		else {
			this._addUpdateMethod(this.updateFilterList);
		}
	},

	filterSuggestedByType: function(type) {
		this.shouldUpdateFilterList = false;
		this.suggestedFilter = type;
		this.updateSuggestedBox();
		this.shouldUpdateFilterList = true;
	},

	tagsAsCSV: function(options) {
		var poppet = this;
		var tags = [];

		if (typeof(options) == 'string') {
			options = {which: options};
		}
		if (typeof(options.which) == 'string') {
			options.which = /,/.test(options.which) ? options.which.split(/\s*,\s*/) : [options.which];
		}
		jQuery.each(options.which, function(i, which) {
			switch(which) {
				case 'current':
					tags = tags.concat(poppet.currentTags);
				break;
				case 'suggested':
					tags = tags.concat(poppet.suggestedTags);
				break;
				case 'blacklisted':
				case 'ignored':
					tags = tags.concat(poppet.blacklistedTags);
				break;
			}
		});
		if (options.filter) {
			if (typeof (options.filter) == 'string') {
				options.filter = options.filter.split(/\s*,\s*/);
			}
			jQuery.each(options.filter, function(i, filter) {
				switch(filter) {
					case 'imageSearch':
						tags = jQuery.grep(tags, function(tag, i) { return tag.shouldUseForImageSearch(); });
					break;
				}
			});
		}
		return jQuery.map(tags, function(tag) { return tag.text; }).join();
	},

	// use this instead of new oc.Tag
	createTagIfNew: function(text, source) {
		// Calais will return entities with commas in them. we have to de-comma-ify before doing anything else
		text = text.replace(/,/g, ' ');
		var slug = cf.slugify(text);
		var existingTag = this.tagSlugMap[slug];

		if ( ! source ) {
			// loop through and if no source, see if wp tag exists
			jQuery.each(this.tagSlugMap, function( tagSlug, tag ) {
				if ( undefined !== tag.wpSlug  && tag.wpSlug == slug ) {
					existingTag = tag;
				}
			});
		}
		else if ( typeof(existingTag) == 'undefined' ) {
			slug = slug + source.type.name;
			existingTag = this.tagSlugMap[slug];
		}


		if (typeof(existingTag) == 'undefined') {
			return new oc.Tag(text, source);
		}
		else if (existingTag.bucketName == 'none') {
			return existingTag;
		}
		return null;
	},

	// use this to remove all knowledge of a tag.
	deleteTag: function(tag) {
		tag.destruct();
	},

	// todo: smarter serialization
	getSerializedTags: function() {
		var tagSerializations = [];
		var result = '{';
		jQuery.each(this.tagSlugMap, function(slug, tag) {
			switch (tag.bucketName) {
				case 'blacklisted':
					if (tag.getBucketPlacement() == 'user') {
						tagSerializations.push('"' + slug + '": ' + tag.serialize());
					}
				break;
				case 'current':
					tagSerializations.push('"' + slug + '": ' + tag.serialize());
				break;
				case 'suggested':
				break;
			}
		});
		result += tagSerializations.join(', ');
		result += '}';
		return result;
	},

	// normalizes across all current tags
	normalizeRelevance: function() {
		var max = 0;
		jQuery.each(this.tagSlugMap, function(slug, tag) {
			max = Math.max(max, tag.source ? tag.source.getRawRelevance() : 0);
		});
		if (max > 0) {
			jQuery.each(this.tagSlugMap, function(slug, tag) {
				if (tag.source) {
					tag.source.setNormalizedRelevance(tag.source.getRawRelevance() / max);
				}
			});
		}
	},

	// source of truth for all known tags; unless we're *really* done with a tag, it doesn't leave this object.
	// maps from tag slug to tag object.
	tagSlugMap: {},

	// "buckets" for tags ... unfortunately we need to keep these synched with the tags' own bucketName member.
	currentTags: [],
	suggestedTags: [],
	blacklistedTags: [],

	// pointers to the various UI boxes
	suggestedBox: null,
	currentBox: null,
	blacklistedBox: null,

	// current suggested source type filter, a string
	suggestedFilter: 'All',
	suggestedShowing: true,
	shouldUpdateFilterList: true,

	// when we do a bunch of moving of stuff around we mark the UI as needing an update
	// and use a timer to hold off on actually updating until we fall back into the idle loop.
	deferUpdates: true,
	updateTimerRef: 0,
	updateMethods: []

});

// singleton
oc.tagManager = new oc.TagManager;
