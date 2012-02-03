

oc.EventFact = oc.TagSource.extend({
	init: function(rdfDescription) {
		this._super(rdfDescription);
		
		if (this.type && oc.artifactManager.artifactDisplayInfo.eventFactDisplayText[this.type.name]) {
			this.name = oc.artifactManager.artifactDisplayInfo.eventFactDisplayText[this.type.name];
			this.makeMeATag = true;
		}
	},

	getTagTypeName: function() {
		return 'Event/Fact';
	},

	shouldUseForImageSearch: function() {
		return false;
	},

	wasRehydrated: function() {
	},

	name: '',
	nInstances: 1
}, 'EventFact');
