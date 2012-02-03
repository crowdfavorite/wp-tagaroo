

oc.Entity = oc.TagSource.extend({
	init: function(rdfDescription) {
		this._super(rdfDescription);
		this.url = rdfDescription['rdf:about'];
		this.type = oc.artifactManager.createArtifactTypeIfNew(rdfDescription['type'][0]['rdf:resource']);
		if ((this.type.name == 'City' || this.type.name == 'ProvinceOrState') && ('shortname' in rdfDescription)) {
			this.name = rdfDescription.shortname[0].Text;
		}
		else {
			this.name = rdfDescription.name[0].Text;
		}
	},
		
	getTagText: function() {
		return this.name;
	},
	
	getTagTypeName: function() {
		return this.type.name;
	},
	
	shouldGenerateTag: function() {
		// URLs have names, but let's not make them tags.
		return (this.type.name != 'URL');
	},

	isAmbiguous: function() {
		return this.type.isAmbiguous();
	},
	
	getSubject: function() {
		return this.subject;
	},

	addEventFact: function(eventFact) {
		this.eventFacts[eventFact.url] = eventFact;
	},

	eventsFacts: {},
	nInstances: 1
}, 'Entity');
