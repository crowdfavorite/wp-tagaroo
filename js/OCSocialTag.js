

oc.SocialTag = oc.TagSource.extend({
	init: function(rdfDescription) {
		this._super(rdfDescription);
		this.makeMeATag = true;
		this.importance = parseFloat(rdfDescription.importance.Text) || 1;
	},
		
	getTagText: function() {
		// we may be based on a document category. if so, see if we have some override display text
		if (oc.artifactManager.artifactDisplayInfo.docCatDisplayText[this.name]) {
			return oc.artifactManager.artifactDisplayInfo.docCatDisplayText[this.name];
		}
		return this.name;
	},
	
	getTagTypeName: function() {
		return this.type.name;
	},
	
	getSubject: function() {
		return null;
	},
	getRawRelevance: function() {
		// for this release, importance will be either 1 or 2. normalized against other relevance
		// scores, social tags will always sort to the top. this is desired behavior.
		return this.importance;
	},

	nInstances: 1,
	importance: 0
}, 'SocialTag');
