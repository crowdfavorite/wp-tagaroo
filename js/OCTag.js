var num = 1;

oc.Tag = CFBase.extend({
	init: function(text, source) {
		this.text = text;
		this.slug = cf.slugify(text);
		this.wpSlug = this.slug;

		if ( !! source ) {
			this.slug = this.slug + source.type.name
			this.type = source.type.name;
			if ( 'Company' === this.type ) {
				// Dont store companies w/o permids
				if ( undefined !== source.permID ) {
					this.name = source.name;
					this.fullName = source.fullName;
					this.permID = source.permID;
					this.ticker = source.ticker;
				}
			}
		}

		this.textToken = new oc.TagToken(this);
		oc.tagManager.registerTag(this);
		this.source = source || null;

	},

	wasRehydrated: function() {
		this.textToken = new oc.TagToken(this);
		oc.tagManager.registerTag(this);
	},

	isUserGenerated: function() {
		return (this.source == null);
	},

	shouldUseForImageSearch: function() {
		if (this.source) {
			return this.source.shouldUseForImageSearch();
		}
		return true;
	},

	makeCurrent: function(placement) {
		oc.tagManager.putTagInCurrent(this, placement || 'auto');
	},

	makeSuggested: function(placement) {
		oc.tagManager.putTagInSuggested(this, placement || 'auto');
	},

	makeBlacklisted: function(placement) {
		oc.tagManager.putTagInBlacklist(this, placement || 'auto');
	},

	getBucketPlacement: function() {
		return this.bucketPlacement;
	},

	getBucketName: function() {
		return this.bucketName;
	},

	_setBucketName: function(bucketName) {
		this.bucketName = bucketName;
	},

	_setBucketPlacement: function(placement) {
		this.bucketPlacement = placement;
	},

	// i can haz automatic destructors?
	destruct: function() {
		this.textToken.removeFromDOM();
		oc.tagManager.unregisterTag(this);
		if (this.source) {
			oc.artifactManager.deleteArtifact(this.source);
		}
	},

	toJSON: function() {
		return {
			text: this.text,
			slug: this.slug,
			source: this.source,
			bucketName: this.bucketName,
			bucketPlacement: this.bucketPlacement,
			_className: this._className,
			wpSlug : this.wpSlug,
			type: this.type
		};
	},

	text: '',
	slug: '',
	textToken: null,
	source: null,
	bucketName: 'none',
	bucketPlacement: 'auto'	// ['user' | 'auto']
}, 'Tag');
