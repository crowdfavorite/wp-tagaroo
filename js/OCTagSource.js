

/**
 * Note: currently subclasses are responsible for serializing all superclass fields!
 */
oc.TagSource = CFBase.extend({
	init: function(rdfDescription) {
		this.url = rdfDescription['rdf:about'];
		this.subjectURL = rdfDescription.subject ? rdfDescription.subject[0]['rdf:resource'] : null;
		this.type = rdfDescription.type ? oc.artifactManager.createArtifactTypeIfNew(rdfDescription.type[0]['rdf:resource']) : null;
		this.name = rdfDescription.name ? rdfDescription.name[0].Text : '';
	},

	wasRehydrated: function() {
		// make sure we're hooked up to the right object
		this.type = oc.artifactManager.createArtifactTypeIfNew(this.type.url);
	},

	getTagText: function() {
		return this.name;
	},

	getTagTypeName: function() {
		return this.type.name;
	},

	getTagTypeIconURL: function() {
		return '';
	},

	getTagTypeClassName: function() {
		var tagTypeName = this.getTagTypeName();
		// This accounts for entities living beneath another. Ex: City under Geography
		var typeName = this.type.name;

		if ( tagTypeName == typeName ) {
			return cf.slugify(tagTypeName);
		}
		else {
			return cf.slugify(typeName);
		}
	},

	isAmbiguous: function() {
		return false;
	},

	getSubjectURL: function() {
		return this.subjectURL;
	},
	setRawRelevance: function(relevance) {
		this.rawRelevance = relevance;
	},
	setNormalizedRelevance: function(relevance) {
		this.normalizedRelevance = relevance;
	},
	getRawRelevance: function() {
		return this.rawRelevance;
	},
	getNormalizedRelevance: function() {
		return this.normalizedRelevance;
	},

	/**
	 * We're going to stand in for the passed artifact. Weirdly the ambiguous
	 * artifact is the one who gets the relevance, etc.
	 *
	 * Probably the artifact will always be an entity; may make sense to put this up
	 * in Entity rather than here.
	 */
	willResolveAmbiguousArtifact: function(artifact) {
		if (artifact.getRawRelevance() > this.getRawRelevance()) {
			this.setRawRelevance(artifact.getRawRelevance());
		}
	},

	shouldGenerateTag: function() {
		return this.makeMeATag;
	},

	shouldUseForImageSearch: function() {
		return true;
	},

	url: '',
	type: null,
	subjectURL: '',
	rawRelevance: 0,
	normalizedRelevance: 0,
	makeMeATag: false
}, 'TagSource');
