

oc.Entity = oc.TagSource.extend({
	init: function(rdfDescription) {
		this._super(rdfDescription);
		this.url = rdfDescription['rdf:about'];
		this.type = oc.artifactManager.createArtifactTypeIfNew(rdfDescription['type'][0]['rdf:resource']);

		if ((this.type.name == 'City' || this.type.name == 'ProvinceOrState') && ('shortname' in rdfDescription)) {
			this.name = rdfDescription.shortname[0].Text;
		}
		else if (this.type.name === 'Company' && undefined !== rdfDescription.commonname) {
			this.name = rdfDescription.commonname[0].Text;
			this.fullName = rdfDescription.name[0].Text;
			this.ticker = !! rdfDescription.ticker ? rdfDescription.ticker[0].Text : false;
			this.permID = rdfDescription.permid[0].Text;
		}
		else {
			this.name = rdfDescription.name[0].Text;
		}
	},

	// Handles entities such as Company, Person etc...
	getTagText: function() {
		return this.maybeMapTagText(this.name);
	},

	getTagTypeName: function() {
		return this.maybeMapName(this.type.name);
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

	maybeMapName : function(name) {
		if ('undefined' !== typeof(this.eventTypeMap[name])) {
			return this.eventTypeMap[name];
		}
		return name;
	},

	maybeMapTagText : function (text) {
		var typeName = this.type.name;
		if ('undefined' !== typeof(this.eventTypeMap[typeName])) {
			if ('Person' == typeName) {
				return text;
			}
			else if ( 'ProvinceOrState' == typeName ) {
				return 'Province/State: ' + text;
			}
			return typeName + ': ' + text;
		}
		return text;
	},

	// Map certain Entity types to another or a grouping
	eventTypeMap : {
		'City' : 'Geography',
		'Continent' : 'Geography',
		'Country' : 'Geography',
		'ProvinceOrState' : 'Geography',
		'Region' : 'Geography',
		'Editor' : 'Person',
		'Person' : 'Person',
		// 'Position' : 'Person',
		'Journalist' : 'Person',
		'Company' : 'Organization'
	},
	eventsFacts: {},
	nInstances: 1
}, 'Entity');
