


oc.ArtifactType = CFBase.extend({
	init: function(typeURL) {
		this.url = typeURL;
		this.name = typeURL.substring(typeURL.lastIndexOf('/') + 1);
		oc.artifactManager.registerArtifactType(this);
	},
	
	isAmbiguous: function() {
		return (this.url.indexOf('/er/') == -1);
	},

	url: '',
	iconURL: '',
	name: ''
}, 'ArtifactType');
