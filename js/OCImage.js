
oc.Image = CFBase.extend({
	init: function() {
	},
	availableSizes: function() {
	},
	getImageURL: function(size) { return ''; },
	getImagePageURL: function(size) { return ''; },
	getTitle: function() { return 'Unknown'; },
	getAuthor: function() { return 'Unknown'; },
	getAuthor: function() { return 'Unknown'; },
	getSourceName: function() { return 'Unknown'; },
	getSourceURL: function() { return ''; },
	getSourceIconURL: function() { return ''; },
	getLicense: function() { return 'Unknown'; },
	getLicensePageURL: function() { return ''; },
	getLicenseIconURL: function() { return ''; },
	getTagsString: function() { return ''; }
});

oc.FlickrImage = oc.Image.extend({
	init: function(flickrJSONObj) {
		this.flickrObj = flickrJSONObj;
	},
	
	// size is one of the image suffixes: 
	// s		small square 75x75
	// t		thumbnail, 100 on longest side
	// m		small, 240 on longest side
	// [none]	medium, 500 on longest side
	//
	// the following are there, but let's not expose them in the UI:	
	//
	// b		large, 1024 on longest side (only exists for very large original images)
	// o		original image, either a jpg, gif or png, depending on source format	
	getImageURL: function(size) {
		return 'http://farm' + 
				this.flickrObj.farm + 
				'.static.flickr.com/' + 
				this.flickrObj.server + 
				'/' + this.flickrObj.id + '_' + this.flickrObj.secret + 
				(size ? '_' + size : '') + '.jpg';
	},
	getImagePageURL: function(size) { 
		return 'http://flickr.com/photos/' + this.flickrObj.owner + '/' + this.flickrObj.id; 
	},
	getAuthor: function() {
		return this.flickrObj.ownername;
	},
	getAuthorURL: function() {
		return 'http://flickr.com/photos/' + this.flickrObj.owner;
	},
	getTitle: function() {
		return this.flickrObj.title;
	},
	getSourceName: function() { return 'Flickr' },
	getSourceURL: function() { return 'http://flickr.com'; },	
	getTagsString: function() {
		return this.flickrObj.tags;
	},
	getLicense: function() {
		if (!this.cachedLicenseName) {
			this._cacheLicenseInfo();
		}
		return this.cachedLicenseName;
	},
	getLicensePageURL: function() { 
		if (!this.cachedLicensePageURL) {
			this._cacheLicenseInfo();
		}
		return this.cachedLicensePageURL;
	},
	getLicenseIconURL: function() {
		return oc.imageManager.ccLicenseIconMap[this.flickrObj.license];
	},
	
	_cacheLicenseInfo: function() {
		if (oc.imageManager.flickrLicenseInfo.stat == 'ok') {
			var poppet = this;
			var x = jQuery.grep(oc.imageManager.flickrLicenseInfo.licenses.license, function(obj) {
				return (obj.id == poppet.flickrObj.license);
			});
			this.cachedLicenseName = x[0].name;
			this.cachedLicensePageURL = x[0].url;
		}
		else {
			this.cachedLicenseName = 'Unknown';
			this.cachedLicensePageURL = '';
		}
	},
	
	flickrObj: {}
});
