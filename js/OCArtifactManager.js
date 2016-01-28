

oc.ArtifactManager = CFBase.extend({
	init: function() {
	},

	// temporary solution
	unarchiveArtifact: function(archivedArtifact, version) {

		switch (version.toString()) {
			case '1':
			case '1.0':
				var fakeDesc = {
					'rdf:about': archivedArtifact.url,
					type:[{'rdf:resource': archivedArtifact.type.url}],
					name:[{Text: archivedArtifact.name}],
					categoryName:[{Text: archivedArtifact.name}]
				};

				// cheesy way to tell if the archived artifact is an entity or event/fact
				if (typeof(archivedArtifact.targetEntityURL) != 'undefined') {
					var eventFact = oc.artifactManager.eventFactFromDescription(fakeDesc);
					if (eventFact) {
						this.eventFactMap[eventFact.url] = eventFact;
					}
				}
				else {
					var entity = oc.artifactManager.entityFromDescription(fakeDesc);
					if (entity) {
						this.entityMap[entity.url] = entity;
					}
				}
				// we didn't have doccat types in v 1.
			break;
			case '1.1':
				// not normally used in 1.1, but the function exists for backwards compatibility.
				var artifact = CFBase.unserialize(archivedArtifact, 'oc.');
				this.registerArtifact(artifact);
			break;
		}
	},

	generateArtifacts: function(descriptions) {
		var poppet = this;
		var resultArray = [];

		// make one pass creating all the entities, doc cats, social tags, etc
		jQuery.each(descriptions, function(i, desc) {

			if (poppet.isSocialTagDescription(desc)) {
				var newSocialTag = poppet.socialTagFromDescription(desc);
				if (newSocialTag) {
					poppet.eventFactMap[newSocialTag.url] = newSocialTag;
					resultArray.push(newSocialTag);
				}
			}
			else if (poppet.isDocumentCategoryDescription(desc)) {
				var newDocCat = poppet.docCatFromDescription(desc);
				if (newDocCat) {
					poppet.docCatMap[newDocCat.url] = newDocCat;
					resultArray.push(newDocCat);
				}
			}
			else if (poppet.isEntityDescription(desc)) {
				var newEntity = poppet.entityFromDescription(desc);
				if (newEntity) {
					poppet.entityMap[newEntity.url] = newEntity;
					resultArray.push(newEntity);
				}
			}

		});

		// make a second pass:
		// - create events/facts and attach them to entities if appropriate
		// - attach relevance ratings
		jQuery.each(descriptions, function(i, desc) {

			if (poppet.isEventFactDescription(desc)) {
				var newEventFact = poppet.eventFactFromDescription(desc);
				if (newEventFact) {
					poppet.eventFactMap[newEventFact.url] = newEventFact;
					resultArray.push(newEventFact);
				}
			}

			// check for a relevance rating
			var relevance = poppet.relevanceFromDescription(desc);
			if (relevance !== null) {
				var targetURL = desc.subject[0]['rdf:resource'];
				if (targetURL in poppet.entityMap) {
					poppet.entityMap[targetURL].setRawRelevance(relevance);
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
		if (this.docCatMap[artifact.url]) {
			delete this.eventFactMap[artifact.url];
		}
	},

	registerArtifact: function(artifact) {
		switch (artifact._className) {
			case 'EventFact':
				this.eventFactMap[artifact.url] = artifact;
			break;
			case 'DocCat':
				this.docCatMap[artifact.url] = artifact;
			break;
			case 'Entity':
				this.entityMap[artifact.url] = artifact;
			break;
		}
	},

	entityFromDescription: function(rdfDescription) {
		var url = rdfDescription['rdf:about'];
		if (this.entityMap[url]) {
			return this.entityMap[url];
		}
		else {
			return new oc.Entity(rdfDescription);
		}
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

	socialTagFromDescription: function(rdfDescription) {
		var url = rdfDescription['rdf:about'];
		if (this.socialTagMap[url]) {
			return this.socialTagMap[url];
		}
		else {
			return new oc.SocialTag(rdfDescription);
		}
	},

	isEventFactDescription: function(rdfDescription) {
		// ignore anything with a name
		if (!rdfDescription.name) {
			return rdfDescription;
		}
		return null;
	},

	relevanceFromDescription: function(rdfDescription) {
		if (this.isRelevanceDescription(rdfDescription)) {
			return parseFloat(rdfDescription.relevance[0].Text);
		}
		return null;
	},

	isEntityDescription: function(rdfDescription) {
		// for now, basically, anything with a name. check this *after* other, more specific checks.
		return ('name' in rdfDescription);
	},
	isRelevanceDescription: function(rdfDescription) {
		return ('type' in rdfDescription && rdfDescription.type[0]['rdf:resource'] == 'http://s.opencalais.com/1/type/sys/RelevanceInfo');
	},
	isDocumentCategoryDescription: function(rdfDescription) {
		return ('type' in rdfDescription && rdfDescription.type[0]['rdf:resource'] == 'http://s.opencalais.com/1/type/cat/DocCat');
	},
	isSocialTagDescription: function(rdfDescription) {
		return ('type' in rdfDescription && rdfDescription.type[0]['rdf:resource'] == 'http://s.opencalais.com/1/type/tag/SocialTag');
	},


	docCatFromDescription: function(rdfDescription) {
		var url = rdfDescription['rdf:about'];
		if (this.docCatMap[url]) {
			return this.docCatMap[url];
		}
		else {
			return new oc.DocCat(rdfDescription);
		}
	},

	createArtifactTypeIfNew: function(typeURL) {
		if (typeURL) {
			if (typeURL in this.artifactTypes) {
				return this.artifactTypes[typeURL];
			}
			this.artifactTypes[typeURL] = new oc.ArtifactType(typeURL);
			return this.artifactTypes[typeURL];
		}
		return null;
	},

	registerArtifactType: function(artifactType) {
		this.artifactTypes[artifactType.url] = artifactType;
	},

	getArtifactTypeNames: function() {
		var names = [];
		for (var url in this.artifactTypes) {
			names.push(this.artifactTypes[url].name);
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
		for(url in this.docCatMap) {
			result.push(this.docCatMap[url]);
		}
		for(url in this.socialTagMap) {
			result.push(this.socialTagMap[url]);
		}

		return result;
	},

	resolveAmbiguousEntity: function(artifact) {
		for (var url in this.entityMap) {
			if (!this.entityMap[url].isAmbiguous() && this.entityMap[url].getSubjectURL() == artifact.url) {
				return this.entityMap[url];
			}
		}
		return null;
	},

	// maps from RDF:description url to artifact objects
	entityMap: {},
	eventFactMap: {},
	docCatMap: {},
	socialTagMap: {},

	// all known artifact types for this post.
	// v1: maps from artifact type name to ArtifactType object
	// v1.1: maps from artifact type full url to ArtifactType object
	artifactTypes: {},

	artifactDisplayInfo: {

		docCatDisplayText: {
			Business_Finance: 'Business/Finance',
			Disaster_Accident: 'Disaster/Accident',
			Education: 'Education',
			Entertainment_Culture: 'Entertainment/Culture',
			Environment: 'Environment',
			Health_Medical_Pharma: 'Health/Medical/Pharmaceuticals',
			Hospitality_Recreation: 'Hospitality/Recreation',
			Human_Interest: 'Human Interest',
			Labor: 'Labor',
			Law_Crime: 'Law/Crime',
			Politics: 'Politics',
			Religion_Belief: 'Religion/Belief',
			Social_Issues: 'Social Issues',
			Sports: 'Sports',
			Technology_Internet: 'Technology/Internet',
			War_Conflict: 'War/Conflict',
			Weather: 'Weather'
		},

		eventFactDisplayText: {
			Acquisition: 'Acquisition',
			Alliance: 'Business Partnership',
			AnalystEarningsEstimate: 'Earnings Estimate',
			AnalystRecommendation: 'Analyst Recommendation',
			ArmedAttack: 'Armed Attack',
			ArmsPurchaseSale: 'Arms Purchase Sale',
			Arrest: 'Judicial Event',
			Bankruptcy: 'Bankruptcy',
			BonusSharesIssuance: 'Bonus Shares Issuance',
			BusinessRelation: 'Business Partnership',
			Buybacks: 'Security Buyback',
			CandidatePosition: 'Candidate Position',
			CompanyAccountingChange: 'Accounting Change',
			CompanyAffiliates: 'Company Affiliates',
			CompanyCompetitor: 'Company Competitor',
			CompanyCustomer: 'Company Customer',
			CompanyEarningsAnnouncement: 'Earnings Announcement',
			CompanyEarningsGuidance: 'Earnings Guidance',
			CompanyEmployeesNumber: 'Company Employees Number',
			CompanyExpansion: 'Company Expansion',
			CompanyForceMajeure: 'Force Majeure',
			CompanyFounded: 'Company Founded',
			CompanyInvestigation: 'Company Investigation',
			CompanyInvestment: 'Funding',
			CompanyLaborIssues: 'Labor Issues',
			CompanyLayoffs: 'Layoffs',
			CompanyLegalIssues: 'Legal Issues',
			CompanyListingChange: 'Company Listing Change',
			CompanyLocation: 'Company Location',
			CompanyMeeting: 'General or Shareholder Meeting',
			CompanyNameChange: 'Name Change',
			CompanyProduct: 'Company Product',
			CompanyReorganization: 'Reorganization',
			CompanyRestatement: 'Restatement',
			CompanyTechnology: 'Company Technology',
			CompanyTicker: 'Company Ticker',
			CompanyUsingProduct: 'Company Using Product',
			ConferenceCall: 'Conference Call',
			ContactDetails: 'Contact Details',
			Conviction: 'Judicial Event',
			CreditRating: 'Credit Rating',
			Deal: 'Deal',
			DebtFinancing: 'Debt Financing',
			DelayedFiling: 'Delayed Filing',
			DiplomaticRelations: 'Diplomatic Relations',
			Dividend: 'Dividend Issuance',
			EmploymentChange: 'Employment Change',
			EmploymentRelation: 'Employment Relation',
			EnvironmentalIssue: 'Environmental Issues',
			EquityFinancing: 'Equity Financing',
			Extinction: 'Extinction',
			FamilyRelation: 'Family Relation',
			FDAPhase: 'FDA Phase',
			IndicesChanges: 'Indices Changes',
			Indictment: 'Judicial Event',
			IPO: 'IPO',
			JointVenture: 'Business Partnership',
			ManMadeDisaster: 'Man-Made Disaster',
			Merger: 'Merger',
			MilitaryAction: 'Military Action',
			MovieRelease: 'Movie Release',
			MusicAlbumRelease: 'Music Album Release',
			NaturalDisaster: 'Natural Disaster',
			PatentFiling: 'Patent Filing',
			PatentIssuance: 'Patent Issuance',
			PersonAttributes: 'Person Attributes',
			PersonCareer: 'Person Career',
			PersonCommunication: 'Person Communication and Meetings',
			PersonEducation: 'Person Education',
			PersonEmailAddress: 'Person Email Address',
			PersonLocation: 'Person Location',
			PersonParty: 'Person Party',
			PersonRelation: 'Person Relation',
			PersonTravel: 'Person Travel',
			PoliticalEndorsement: 'Political Endorsement',
			PoliticalRelationship: 'Political Relationship',
			PollsResult: 'Polls Result',
			ProductIssues: 'Product Issues',
			ProductRecall: 'Product Recall',
			ProductRelease: 'Product Release',
			Quotation: 'Quotation',
			SecondaryIssuance: 'Second Stock Issuance',
			StockSplit: 'Stock Split',
			Trial: 'Judicial Event',
			VotingResult: 'Voting Result'
		}
	}
});

// singleton
oc.artifactManager = new oc.ArtifactManager;
