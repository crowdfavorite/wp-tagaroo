
// Ties token drags together with objects that accept token drops. 
var CFTokenManager = CFBase.extend({
	
	dragStarted: function(token) {
		this.activeDragObjects[token.id_tag] = token;
		this.nDrags++;
	},
	
	dragEnded: function(token) {
		delete this.activeDragObjects[token.id_tag];
		this.nDrags--;
	},
	
	registerDropBox: function(tokenBox) {
		this.dropBoxes[tokenBox.id_tag] = { object: tokenBox, waiting: false };
	},
	
	tokensAreBeingDragged: function() {
		return (this.nDrags > 0);
	},
	
	tokensBeingDragged: function() {
		var objs = [];
		for (var name in this.activeDragObjects) {
			if (this.activeDragObjects[name] && typeof (this.activeDragObjects[name].insertIntoDOM) != 'undefined')	{
				objs.push(this.activeDragObjects[name]);
			}
		}
		return objs;
	},
	
	handleDragMouseUp: function() {
		var box = this.tokenBoxWaitingForDrop();
		if (box) {
			box.mouseUp();
		}
	},
	
	setTokenBoxWaitingForDrop: function(tokenBox) {
		this.dropBoxes[tokenBox.id_tag].waiting = true;
	},
	
	setTokenBoxStoppedWaitingForDrop: function(tokenBox) {
		this.dropBoxes[tokenBox.id_tag].waiting = false;
	},
	
	tokenBoxWaitingForDrop: function() {
		for (var obj_name in this.dropBoxes) {
			if (this.dropBoxes[obj_name].waiting) {
				return this.dropBoxes[obj_name].object;
			}
		}
		return null;
	},
	activeDragObjects: {},
	dropBoxes: {},
	nDrags: 0	
});

// singleton
cf.tokenManager = new CFTokenManager;
