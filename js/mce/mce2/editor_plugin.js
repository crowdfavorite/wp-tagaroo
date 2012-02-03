
oc.mcePlugin = {
	getInfo: function() {
		return {
			longname : 'tagaroo TinyMCE Plugin',
			author : 'Crowd Favorite',
			authorurl : 'http://crowdfavorite.com',
			infourl : '',
			version : "1.0"
		};
	},
	initInstance: function(instance) {
		oc.rte = instance;
	},
	removeInstance: function(instance) {
		oc.rte = null;
	},
	onChange: function(inst) {
		oc.tickleIdleTimer();
	},
	handleEvent: function(event) {
		oc.tickleIdleTimer();
		return true;
	},
	execCommand: function(editorID, element, command, userInterface, value) {
		return false;
	},
	cleanup : function(type, content) {
		switch (type) {
			case 'insert_to_editor':
				this.onChange(oc.rte);
			break;
			case 'get_from_editor':
			break;
		}
		return content;
	}	
};
if (oc && tinyMCE) {
	tinyMCE.addPlugin('tagaroo', oc.mcePlugin);
}

