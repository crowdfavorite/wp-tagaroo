
if (!window.ocMCE3PluginAdded) {
	(function() {
		tinymce.create('tinymce.plugins.tagaroo', {
			/**
			 * Initializes the plugin, this will be executed after the plugin has been created.
			 * This call is done before the editor instance has finished it's initialization so use the onInit event
			 * of the editor instance to intercept that event.
			 *
			 * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
			 * @param {string} url Absolute URL to where the plugin is located.
			 */
			init : function(ed, url) {
				if (typeof(oc) == 'object') {
					ed.onInit.add(this.initInstance);
					ed.onRemove.add(this.removeInstance);
					ed.onChange.add(this.onChange);
					ed.onKeyUp.add(this.handleKeyUp);
				}
			},

			/**
			 * Returns information about the plugin as a name/value array.
			 * The current keys are longname, author, authorurl, infourl and version.
			 *
			 * @return {Object} Name/value array containing information about the plugin.
			 */
			getInfo : function() {
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
			handleKeyUp: function(editor, e) {
				oc.tickleIdleTimer();
				return true;
			},
			execCommand: function(editorID, element, command, userInterface, value) {
				return false;
			}		
		});

		// Register plugin
		window.ocMCE3PluginAdded = true;
		tinymce.PluginManager.add('tagaroo', tinymce.plugins.tagaroo);
	})();	
}