=== tagaroo ===
Tags: tag, tags, tagging, semantic data, photo, photos, pictures, Flickr, calais
Contributors: alexkingorg, crowdfavorite
Requires at least: 2.7
Tested up to: 3.6
Stable tag: 1.4.8
License: GPLv2
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Use tagaroo to get semantic data to use as tags and photo for your posts.

== Description ==

Tagaroo gives you an integration between your WordPress blog and the Calais web service. Tagaroo fetches semantic data (people, places, events, etc.) relevant to your blog post that you can use as tags. Tagaroo will also use these tags to search Flickr for appropriately licensed images for you to use in your blog posts.

== Installation ==

1. Download the plugin archive and expand it (you've likely already done this).
2. Upload the tagaroo directory to your wp-content/plugins directory.
3. Go to the Plugins page in your WordPress Administration area and click 'Activate' for tagaroo.
4. Go to Settings > Tagaroo and follow the instructions to register for your Calais API key.
5. Enter your API key, set your preferences for allowing your content to be indexed or not, and press the Update tagaroo Options button.
6. Congratulations, you've just installed tagaroo!

== Upgrade Notice ==

WordPress 3.5 compatibility upgrade.

WordPress 3.5 packages an updated version of jQuery (1.8.x) that drops support for a function we were using.  This breaks tagaroo's functionality.

== Usage ==

When writing blog posts, click the "Suggest Tags" link at any time to fetch appropriate tags and photos for the post.

With 1.4 we have added the functionality where you can select a paragraph or part of the post and click the 'Suggest Tags' to fetch fetch appropriate tags and photos for only selected text.

You can enter your own tags, or use tags suggested by Tagaroo. You can drag tags from the suggested tags list to the Post Tags area, or click on them to add them.

You can also drag tags up to the Tagaroo images list and Tagaroo will search Flickr for photos for that tag. You can sort the returned photos by interestingness, date take and date posted.

Clicking on a photo will show you a larger preview of the photo, and you can choose the size of the photo you want to add to your post.

== Changelog ==

= 1.4.8 =

* Include better compatibility for older versions of IE

= 1.4.7 =

* Fixed conflict with latest jQuery version shipped with WordPress 3.5

= 1.4.6 =

* Fixed bug with the setting of response headers in flickr api proxy

= 1.4.5 =

* Remove features that are now included in the version of jQuery bundled with WordPress
* Tested compatibility up to WordPress 3.4

= 1.4.4 =

* Replaced the class-snoopy calls with wp_remote_post().
* Tested compatibility up to WordPress 3.3.

= 1.4.3 =

* JavaScript fix.

= 1.4.2 =

* Additional JavaScript fix.

= 1.4.1 =

* Fixed compatibility issues with newer versions of jQuery delivered with WordPress 3.0.

= 1.4 =

* Added functionality where you can select a paragraph or part of the post and click the 'Suggest Tags' to fetch fetch appropriate tags and photos for only selected text

= 1.3 =

Tagaroo 1.3 will now identify 50 event types (up from 33 in the last version). We have made minor changes to the suggested tag names for some events.

New names are

- More descriptive/real world, for example 'Business Relationship' instead of 'Alliance'
- Unify some of the old ones, for example now we will have 'M&A' for 'Acquisition' and 'Merger' or 'Judicial Event' for 'Indictment', 'Trial' and 'Arrest'.

Old posts tagged with previous names will not be affected at all with this change. However, if you would like to use new naming for your old posts you just need to edit the post and save it with new names.

== Known Issues ==

The WordPress auto-save feature does not save all tagaroo tag data, be sure to use the Save/Publish button to make sure all of the tagaroo meta data is saved properly.

== Frequently Asked Questions ==

= Is this compatible with WordPress 2.2 or earlier? =

No, tagaroo integrates with the native tagging feature of WordPress that was added in WordPress 2.3.

= Where can I get support or request additional features? =

The best place to get support and request features for tagaroo is on the taragroo web site:

http://tagaroo.opencalais.com/

and in the forums:

http://tagaroo.opencalais.com/forums/


= Anything else? =

That should be it, enjoy tagaroo!
