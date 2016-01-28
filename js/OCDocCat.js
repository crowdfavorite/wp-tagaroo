

oc.DocCat = oc.TagSource.extend({
	init: function(rdfDescription) {
		this._super(rdfDescription);
		this.name = rdfDescription.name[0].Text;

		if (this.type && oc.artifactManager.artifactDisplayInfo.docCatDisplayText[this.name]) {
			this.name = oc.artifactManager.artifactDisplayInfo.docCatDisplayText[this.name];
		}
		this.makeMeATag = true;

		if (rdfDescription.score) {
			this.score = parseFloat(rdfDescription.score[0].Text);
			this.setRawRelevance(this.score);
		}
	},

	getTagText: function() {
		return this.name;
	},

	getTagTypeName: function() {
		return 'Document Category';
	},

	isAmbiguous: function() {
		return false;
	},

	getSubjectURL: function() {
		return this.subjectURL;
	},

	shouldGenerateTag: function() {
		return this.name !== 'Other' && (this.score > .6);
	},

	score: 0
}, 'DocCat');
