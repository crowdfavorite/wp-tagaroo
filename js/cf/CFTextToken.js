
var CFTextToken = CFToken.extend({
	init: function(string, id_tag) {
		this._super(string, id_tag);
		this.text = string;
	},
	text: '',
	getContentHTML: function(mode) {
		return this.text;
	}
});
