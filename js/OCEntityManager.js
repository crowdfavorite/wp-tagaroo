

oc.EntityManager = CFBase.extend({
	init: function() {
	},

	// temporary solution
	unarchiveArtifact: function(archivedArtifact) {
		var fakeDesc = {
			'rdf:about': archivedArtifact.url,
			type:[{'rdf:resource': archivedArtifact.type.url}],
			name:[{Text: archivedArtifact.name}]
		};

		// cheesy way to tell if the archived artifact is an entity or event/fact
		if (typeof(archivedArtifact.targetEntityURL) != 'undefined') {
			var eventFact = oc.entityManager.eventFactFromDescription(fakeDesc);
			if (eventFact) {
				this.eventFactMap[eventFact.url] = eventFact;
			}
		}
		else {
			var entity = oc.entityManager.entityFromDescription(fakeDesc);
			if (entity) {
				this.entityMap[entity.url] = entity;
			}
		}
	},

	generateArtifacts: function(descriptions) {
		var poppet = this;
		var resultArray = [];

		// make one pass creating all the entities
		jQuery.each(descriptions, function(i, desc) {
			var newEntity = poppet.entityFromDescription(desc);
			if (newEntity) {
				poppet.entityMap[newEntity.url] = newEntity;
				resultArray.push(newEntity);
			}
		});

		// make a second pass creating events/facts and attaching them to entities if appropriate
		jQuery.each(descriptions, function(i, desc) {
			if (poppet.isEventFactDescription(desc)) {
				var newEventFact = poppet.eventFactFromDescription(desc);
				if (newEventFact) {
					poppet.eventFactMap[newEventFact.url] = newEventFact;
					var targetURL = newEventFact.getTargetEntityURL();
					if (targetURL) {
						jQuery.each(poppet.entityMap, function(url, entity) {
							if (url == targetEntityURL) {
								entity.addEventFact(desc);
							}
						});
					}
					resultArray.push(newEventFact);
				}
			}
		});
		return resultArray;
	},

	deleteArtifact: function(artifact) {
		if (this.entityMap[artifact.url]) {
			delete this.entityMap[artifact.url];
		}
		if (this.eventFactMap[artifact.url]) {
			delete this.eventFactMap[artifact.url];
		}
	},

	entityFromDescription: function(rdfDescription) {
		// for now we assume that entities have names.
		if (rdfDescription.name) {
			var url = rdfDescription['rdf:about'];
			if (this.entityMap[url]) {
				return this.entityMap[url];
			}
			else {
				return new oc.Entity(rdfDescription);
			}
		}
		return null;
	},

	eventFactFromDescription: function(rdfDescription) {
		var url = rdfDescription['rdf:about'];
		if (this.eventFactMap[url]) {
			return this.eventFactMap[url];
		}
		else {
			return new oc.EventFact(rdfDescription);
		}
	},


	isEventFactDescription: function(rdfDescription) {
		var url = rdfDescription['rdf:about'];
		// ignore anything with a name
		if (!rdfDescription.name) {
			return rdfDescription;
		}
		return null;
	},

	createArtifactTypeIfNew: function(typeURL) {
		if (typeURL) {
			var name = typeURL.substring(typeURL.lastIndexOf('/') + 1);
			for (var existingTypeName in this.artifactTypes) {
				if (existingTypeName == name) {
					return this.artifactTypes[name];
				}
			}
			this.artifactTypes[name] = new oc.ArtifactType(typeURL);
			return this.artifactTypes[name];
		}
		return null;
	},

	registerArtifactType: function(artifactType) {
		this.artifactTypes[artifactType.name] = artifactType;
	},

	getArtifactTypeNames: function() {
		var names = [];
		for (var name in this.artifactTypes) {
			names.push(name);
		}
		return names;
	},

	getArtifacts: function() {
		var result = [];
		for(var url in this.entityMap) {
			result.push(this.entityMap[url]);
		}
		for(url in this.eventFactMap) {
			result.push(this.eventFactMap[url]);
		}
		return result;
	},

	// maps from RDF:description url to artifact objects
	entityMap: {},
	eventFactMap: {},

	// all known artifact types for this post. maps from artifact type name to ArtifactType object
	artifactTypes: {},

	artifactDisplayInfo: {

		// these are the event/facts we turn into tags, and also their display text
		eventFactDisplayText: {
			Acquisition: 'Acquisition',
			Alliance: 'Alliance',
			AnalystEarningsEstimate: 'Earnings Estimate',
			AnalystRecommendation: 'Analyst Recommendation',
			Arrest: 'Arrest',
			Bankruptcy: 'Bankruptcy',
			BusinessRelation: 'Partnership',
			Buybacks: 'Buyback',
			CompanyEarningsAnnouncement: 'Earnings Announcement',
			CompanyEarningsGuidance: 'Earnings Guidance',
			CompanyExpansion: 'Company Expansion',
			CompanyInvestment: 'Investment',
			CompanyLegalIssues: 'Legal Issues',
			CompanyMeeting: 'Company Meeting',
			CompanyNameChange: 'Company Name Change',
			CompanyReorganization: 'Reorganization',
			ConferenceCall: 'Conference Call',
			Conviction: 'Conviction',
			EmploymentChange: 'Employment Change',
			EnvironmentalIssue: 'Environmental Issues',
			Extinction: 'Extinction',
			Indictment: 'Indictment',
			IPO: 'IPO',
			JointVenture: 'Joint Venture',
			ManMadeDisaster: 'Man-Made Disaster',
			Merger: 'Merger',
			NaturalDisaster: 'Natural Disaster',
			PatentFiling: 'Patent Filing',
			PatentIssuane: 'Patent Issuance',
			ProductRecall: 'Product Recall',
			ProductRelease: 'Product Release',
			StockSplit: 'Stock Split',
			Trial: 'Trial'
		}
	}
});

// singleton
oc.entityManager = new oc.EntityManager;
