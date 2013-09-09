<?php
/*
Plugin Name: tagaroo
Plugin URI: http://tagaroo.opencalais.com
Description: Find and suggest tags and photos (from Flickr) for your content. Integrates with the Calais service.
Version: 1.4.8
Author: Crowd Favorite and Reuters
Author URI: http://crowdfavorite.com
License: GPL2
*/

define('OC_WP_GTE_23', version_compare($wp_version, '2.3', '>='));
define('OC_WP_GTE_25', version_compare($wp_version, '2.5', '>='));
define('OC_WP_GTE_26', version_compare($wp_version, '2.6', '>='));
define('OC_WP_GTE_27', version_compare($wp_version, '2.7', '>='));
define('OC_WP_GTE_28', version_compare($wp_version, '2.8', '>='));
define('OC_WP_GTE_33', version_compare($wp_version, '3.3', '>='));

define('OC_DRAFT_API_KEY', 'mdbtyu4ku286uhpakuj48dgj');
define('FLICKR_API_KEY', 'f3745df3c6537073c523dc6d06751250');

define('OC_HTTP_PATH', plugin_dir_url(__FILE__));
define('OC_FILE_PATH', plugin_dir_path(__FILE__));

function oc_agent_is_safari() {
	static $is_safari;
	if (!isset($is_safari)) {
		$matches = array();
		$is_safari = ereg('Safari/([0-9]+)', $_SERVER['HTTP_USER_AGENT'], $matches);
	}
	return $is_safari;
}

$oc_key_entered = false;
$oc_api_key = get_option('oc_api_key');
if ($oc_api_key && !empty($oc_api_key)) {
	$oc_key_entered = true;
}

if (!$oc_relevance_minimum = get_option('oc_relevance_minimum')) {
	$oc_relevance_minimum = 'any';
}

if (!$oc_auto_fetch = get_option('oc_auto_fetch')) {
	$oc_auto_fetch = 'yes';
}

if (!$oc_key_entered) {
	add_action('admin_notices', 'oc_warn_no_key_edit_page');
	add_action('after_plugin_row', 'oc_warn_no_key_plugin_page');
}

function oc_warn_no_key_plugin_page($plugin_file) {
	if (strpos($plugin_file, 'tagaroo.php')) {
		echo "<tr><td colspan='5' class='plugin-update'>";
		echo '<strong>Note</strong>: tagaroo requires an API key to work. <a href="options-general.php?page=tagaroo.php">Set your API Key</a>.';
		echo "</td></tr>";
	}
}

function oc_warn_no_key_edit_page() {
	if (oc_on_edit_page()) {
		echo '<div class="error" style="padding:5px;"><strong>Note</strong>: tagaroo is active but you have not <a href="options-general.php?page=tagaroo.php">set your API Key</a>.</div>';
	}
}

function oc_on_edit_page() {
	global $pagenow;
	return ($pagenow == 'post-new.php') || ($pagenow == 'post.php') || ($pagenow == 'tiny_mce_config.php');
}

function oc_api_param_xml($req_id = null, $metadata = '', $allow_distribution = false, $allow_search = false) {
	if (!$req_id) {
		$req_id = 'draft-'.time();
	}

	$submitter = home_url();
	return '
		<c:params xmlns:c="http://s.opencalais.com/1/pred/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
			<c:processingDirectives c:contentType="text/html" c:outputFormat="xml/rdf" c:enableMetadataType="SocialTags"></c:processingDirectives>
			<c:userDirectives c:allowDistribution="'.($allow_distribution ? 'true' : 'false').'" c:allowSearch="'.($allow_search ? 'true' : 'false').'" c:externalID="'.$req_id.'" c:submitter="'.$submitter.'">
			</c:userDirectives>
			<c:externalMetadata>
				'.$metadata.'
				<rdf:description><c:caller>Tagaroo</c:caller></rdf:description>
			</c:externalMetadata>
		</c:params>
	';
}

define('OC_DRAFT_CONTENT', 0);
define('OC_FINAL_CONTENT', 1);

function oc_ping_oc_api($content, $content_status = OC_DRAFT_CONTENT, $paramsXML = null) {
	global $oc_api_key;
	if (!$paramsXML) {
		$paramsXML = oc_api_param_xml();
	}

	if ($content_status == OC_DRAFT_CONTENT) {
		$key = OC_DRAFT_API_KEY;
	}
	else {
		$key = $oc_api_key;
	}

	$done = false;
	$tries = 0;
	do {
		$tries++;
		$response = oc_do_ping_oc_api($key, $content, $paramsXML);
		if ($response['errortype'] == 3 && $tries <= 3) {
			continue;
		}
		$done = true;
	}
	while (!$done);

	return $response;
}

function oc_do_ping_oc_api($key, $content, $paramsXML) {
	if (!isset($_POST['publish']) && !isset($_POST['save'])) {
		$result = wp_remote_post('http://api.opencalais.com/enlighten/rest/', array(
			'body' => array(
				'licenseID' => $key,
				'content' => $content,
				'paramsXML' => $paramsXML,
			),
		));

		if (!is_wp_error($result) and isset($result['body'])) {
			if (strpos($result['body'], 'Invalid request format - the request has missing or invalid parameters') !== false) {
				return array(
					'success' => false,
					'error' => 'API Key Invalid.',
					'errortype' => 1
				);
			}
			$matches = array();
			$error_match = preg_match('/<Error Method="ProcessText"(.*?)><Exception>([^<]*)<\/Exception><\/Error>/', html_entity_decode($result['body']), $matches);
			if ($error_match) {
				return array(
					'success' => false,
					'error' => $matches[2],
					'errortype' => 2
				);
			}
			//@file_put_contents(dirname(__FILE__).'/output.txt', $snoop->results);
			return array(
				'success' => true,
				'content' => $result['body'],
				'errortype' => 0
			);
		}
		else {
			return array(
				'success' => false,
				'error' => 'Could not contact OpenCalais: -- "'.print_r($result, true).'"',
				'errortype' => 3
			);
		}
	}
}

function oc_get_flickr_license_info() {
	$info = get_option('oc_flickrLicenseInfo');
	if (!$info) {
		$result = wp_remote_post('http://api.flickr.com/services/rest', array(
			'body' => array(
				'method' => 'flickr.photos.licenses.getInfo',
				'api_key' => FLICKR_API_KEY,
				'format' => 'json',
				'nojsoncallback' => 1,
			),
		));
		if (!is_wp_error($result) and isset($result['body'])) {
			$info = $result['body'];
			update_option('oc_flickrLicenseInfo', $info);
		}
	}
	return $info;
}

function oc_ping_flickr_api($data) {
	$result = wp_remote_post('http://api.flickr.com/services/rest', array(
		'body' => array(
			'method' => 'flickr.photos.search',
			'api_key' => FLICKR_API_KEY,
			'tags' => $data['tags'],
			'license' => '1,2,3,4,5,6',
			'extras' => 'tags,license,owner_name',
			'per_page' => $data['per_page'],
			'page' => $data['page'],
			'sort' => $data['sort'],
			'format' => 'json',
			'nojsoncallback' => 1,
		),
	));
	// to do: more error checking
	if (!is_wp_error($result) and isset($result['body'])) {
		return array(
			'success' => true,
			'headers' => $result['headers'],
			'content' => $result['body']
		);
	}
	else {
		return array(
			'success' => false,
			'error' => 'Could not contact Flickr.'
		);
	}
}

function oc_request_handler() {
	wp_enqueue_script('jquery');

	if (OC_WP_GTE_23 && !OC_WP_GTE_25) {
		// copied from wp 2.5
		if (isset($_GET['action']) && 'ajax-tag-search' == $_GET['action']) {
			global $wpdb;
			if (!current_user_can('manage_categories')) {
				die('-1');
			}

			$s = $_GET['q']; // is this slashed already?

			if (strstr($s, ',')) {
				die;
			} // it's a multiple tag insert, we won't find anything
			$results = $wpdb->get_col("SELECT name FROM $wpdb->terms WHERE name LIKE ('%$s%')");
			echo join($results, "\n");
			die;
		}
	}
	if (!empty($_POST['oc_action'])) {
		switch ($_POST['oc_action']) {
			case 'update_api_key':
				if (current_user_can('manage_options')) {
					$get_q = '';
					$key_changed = false;
					if (isset($_POST['oc_api_key'])) {
						global $oc_api_key;
						if ($_POST['oc_api_key'] == '') {
							update_option('oc_api_key', stripslashes($_POST['oc_api_key']));
						}
						else {
							if ($_POST['oc_api_key'] != $oc_api_key) {
								$key_changed = true;
								$oc_api_key = $_POST['oc_api_key'];
								$test = oc_ping_oc_api('Wordpress Plugin API key test.', OC_FINAL_CONTENT);
								if ($test['success']) {
									$success = update_option('oc_api_key', stripslashes($_POST['oc_api_key']));
									if (!$success) {
										$get_q .= '&oc_update_failed=true';
									}
								}
								else {
									if ($test['error'] == 'API Key Invalid.') {
										$test['error'] = 'The API key '.$oc_api_key.' does not appear to be valid.';
									}
									$get_q .= '&oc_api_test_failed='.urlencode($test['error']);
								}
							}
						}
					}

					$allow_search = (isset($_POST['oc_privacy_searchable']) && $_POST['oc_privacy_searchable'] == 'on');
					$allow_dist = (isset($_POST['oc_privacy_distribute']) && $_POST['oc_privacy_distribute'] == 'on');
					update_option('oc_privacy_prefs', array(
						'allow_search' => ($allow_search ? 'yes' : 'no'),
						'allow_distribution' => ($allow_dist ? 'yes' : 'no')
					));

					if (isset($_POST['oc_relevance_minimum'])) {
						update_option('oc_relevance_minimum', $_POST['oc_relevance_minimum']);
					}

					if (isset($_POST['oc_auto_fetch']) && $_POST['oc_auto_fetch'] == 'on') {
						update_option('oc_auto_fetch', 'yes');
					}
					else {
						update_option('oc_auto_fetch', 'no');
					}

					if ($get_q == '') {
						$get_q .= '&updated=true'.($key_changed ? '&oc_key_changed=true' : '');
					}

					header('Location: '.admin_url('options-general.php?page=tagaroo.php'.$get_q));
					die();
				}
				else {
					wp_die('You are not allowed to manage options.');
				}
				die();
			case 'api_proxy_oc':
				$result = oc_ping_oc_api(stripslashes($_POST['text']));
				if ($result['success'] == false) {
					header('Content-Type: text/html; charset=utf-8');
					echo '__oc_request_failed__{ error: \''.addslashes($result['error']).'\'}';
				}
				else {
					header('Content-Type: text/xml; charset=utf-8');
					echo $result['content'];
				}
				die();
			case 'api_proxy_flickr':
				$result = oc_ping_flickr_api($_POST);
				if ($result['success'] == false) {
					header('Content-Type: text/html; charset=utf-8');
					echo '__oc_request_failed__{ error: \''.addslashes($result['error']).'\'}';
				}
				else {
					if (isset($result['headers']) && gettype($result['headers']) == 'array') {
						foreach ($result['headers'] as $header_key => $header_value) {
							header($header_key.': '.$header_value);
						}
					}
					echo $result['content'];
				}
				die();
		}
	}
	if (!empty($_GET['oc_action'])) {
		switch ($_GET['oc_action']) {
			case 'admin_js':
				global $oc_config, $oc_relevance_minimum, $oc_auto_fetch;
				header("Content-type: text/javascript");
				require(OC_FILE_PATH.'/js/cf/offset.js');
				if (OC_WP_GTE_23 && !OC_WP_GTE_25) {
					require(OC_FILE_PATH.'/js/suggest.js');
				}
				require(OC_FILE_PATH.'/js/cf/CFCore.js');
				require(OC_FILE_PATH.'/js/OCCore.js');
				print('oc.wp_gte_28 = '.(OC_WP_GTE_28 ? 'true' : 'false').';');
				print('oc.wp_gte_27 = '.(OC_WP_GTE_27 ? 'true' : 'false').';');
				print('oc.wp_gte_25 = '.(OC_WP_GTE_25 ? 'true' : 'false').';');
				print('oc.wp_gte_23 = '.(OC_WP_GTE_23 ? 'true' : 'false').';');
				print('oc.minimumRelevance = \''.$oc_relevance_minimum.'\';');
				print('oc.autoFetch = '.($oc_auto_fetch == 'yes' ? 'true' : 'false').';');
				require(OC_FILE_PATH.'/js/xmlObjectifier.js');
				require(OC_FILE_PATH.'/js/json2.js');
				require(OC_FILE_PATH.'/js/cf/CFTokenManager.js');
				require(OC_FILE_PATH.'/js/cf/CFTokenBox.js');
				require(OC_FILE_PATH.'/js/cf/CFToken.js');
				require(OC_FILE_PATH.'/js/cf/CFTextToken.js');

				require(OC_FILE_PATH.'/js/OCTagSource.js');
				require(OC_FILE_PATH.'/js/OCEventFact.js');
				require(OC_FILE_PATH.'/js/OCEntity.js');
				require(OC_FILE_PATH.'/js/OCDocCat.js');
				require(OC_FILE_PATH.'/js/OCSocialTag.js');
				require(OC_FILE_PATH.'/js/OCArtifactManager.js');
				require(OC_FILE_PATH.'/js/OCArtifactType.js');

				require(OC_FILE_PATH.'/js/OCTag.js');
				require(OC_FILE_PATH.'/js/OCTagManager.js');
				require(OC_FILE_PATH.'/js/OCTagToken.js');
				require(OC_FILE_PATH.'/js/OCTagBox.js');

				require(OC_FILE_PATH.'/js/OCImage.js');
				require(OC_FILE_PATH.'/js/OCImageManager.js');
				require(OC_FILE_PATH.'/js/OCImageToken.js');
				require(OC_FILE_PATH.'/js/OCImageParadeBox.js');

				$licensesJSON = oc_get_flickr_license_info();
				if ($licensesJSON) {
					print('oc.imageManager.flickrLicenseInfo = '.$licensesJSON.';');
				}

				if (OC_WP_GTE_23 && !OC_WP_GTE_25) {
					require(OC_FILE_PATH.'/js/mce/mce2/editor_plugin.js');
				}
				require(OC_FILE_PATH.'/js/admin-edit.js');
				die();
			case 'admin_css':
				header("Content-type: text/css");
				print(oc_get_css('admin'));
				ob_start();
				require(OC_FILE_PATH.'/css/admin-edit.css');
				require(OC_FILE_PATH.'/css/token-styles.css');
				$css = ob_get_contents();
				ob_end_clean();
				$css = str_replace('CALAISPLUGIN', OC_HTTP_PATH, $css);
				print($css);
				if (OC_WP_GTE_23 && !OC_WP_GTE_25) {
					require(OC_FILE_PATH.'/css/admin-edit-wp23.css');
				}
				if (oc_agent_is_safari()) {
					print('
						.right_textTokenButton {
							top: 2px;
						}
					');
				}
				die();
			case 'rte_css':
				header("Content-type: text/css");
				print(oc_get_css('rte'));
				die();
			case 'published_css':
				header("Content-type: text/css");
				print(oc_get_css('published'));
				die();
		}
	}
}
add_action('init', 'oc_request_handler', 10);

function oc_get_control_wrapper($which, $id = '', $title = '') {
	$wrapper = array();
	if (OC_WP_GTE_23 && !OC_WP_GTE_25) {
		$wrapper['head'] = '
			<div class="dbx-b-ox-wrapper">
				<fieldset id="'.$id.'_fieldset" class="dbx-box">
					<div class="dbx-h-andle-wrapper"><h3 class="dbx-handle">'.$title.'</h3></div>
					<div class="dbx-c-ontent-wrapper">
						<div class="dbx-content">
							<div id="'.$id.'">
		';
		$wrapper['foot'] = '
							</div>
						</div>
					</div>
				</fieldset>
			</div>
		';
	}
	else {
		if (OC_WP_GTE_25 && !OC_WP_GTE_27) {
			$wrapper['head'] = '
			<div id="'.$id.'" class="postbox">
				<h3>'.$title.'</h3>
				<div class="inside">
		';
			$wrapper['foot'] = '
				</div>
			</div>
		';
		}
		else {
			if (OC_WP_GTE_27) {
				// handled via add_meta_box
				return '';
			}
		}
	}
	return $wrapper[$which];
}

function oc_render_tag_controls() {
	global $oc_config;
	global $post;
	$status_in_controls = (OC_WP_GTE_27 ? '
		<div class="oc_status" id="oc_status">
			<div id="oc_tag_searching_indicator">Finding tags&hellip;</div>
			<a href="#" id="oc_suggest_tags_link">Suggest Tags</a>
		</div>
	' : '');
	$status_in_header = (OC_WP_GTE_27 ? '' : '
		<div id="oc_tag_searching_indicator">Finding tags&hellip;</div>
		<a href="#" id="oc_suggest_tags_link">Suggest Tags</a>
	');
	$meta = get_post_meta($post->ID, 'oc_metadata', true);
	print('
		'.oc_get_control_wrapper('head', 'oc_tag_controls', 'tagaroo Tags'.$status_in_header).'
				<div class="oc_tag_notification" id="oc_api_notifications"></div>
				'.$status_in_controls.'
				<textarea id="oc_metadata" type="hidden" name="oc_metadata">'.$meta.'</textarea>
				<input id="newtag" type="hidden" value=""/>

				<div id="oc_suggested_tags_wrapper">
					<div class="clear"></div>
				</div>

				<div id="oc_current_tags_wrapper">
					<div id="oc_add_tag_form">
						<label for="oc_add_tag_field">Add your own tags:</label>
						<input type="text" id="oc_add_tag_field" autocomplete="off" />
						<input type="button" class="button" id="oc_add_tag_button" value="Add" />
						<div class="oc_tag_notification" id="oc_current_tag_notifications">&nbsp;</div>
					</div>
					<div class="clear"></div>
				</div>
				<div class="clear"></div>
		'.oc_get_control_wrapper('foot').'
	');
}

function oc_render_image_controls() {
	$options = '
		<option label="Interestingness" value="interestingness" selected="selected">Interestingness</option>
		<option label="Date Posted" value="date-posted">Date Posted</option>
		<option label="Date Taken" value="date-taken">Date Taken</option>
	';
	print('
			'.oc_get_control_wrapper('head', 'oc_image_controls', 'tagaroo Images').'
				<div id="oc_filmstrip_wrapper"></div>
				<div id="oc_images_page_back" class="disabled"></div>
				<div id="oc_images_page_fwd" class="disabled"></div>
				<div id="oc_images_tools">
					<span id="oc_images_page_num"></span><br />
					<a href="#" id="oc_images_sort_toggle">Sorting Options</a>
				</div>
				<div id="oc_images_result_tags"></div>
				<div class="clear"></div>
				<div id="oc_images_sort">
					<label for="oc_images_sort_select">Sort by:</label>
					<select id="oc_images_sort_select">
						'.$options.'
					</select>
					<label>Sort Order:</label>
					<input id="oc_sort_direction_asc" type="radio" name="oc_sort_direction" value="asc"/>
					<label for="oc_sort_direction_asc">Ascending</label>
					<input id="oc_sort_direction_desc" type="radio" name="oc_sort_direction" value="desc" checked="checked"/>
					<label for="oc_sort_direction_desc">Descending</label>
				</div>
				<div class="clear"></div>
				<div id="oc_image_preview"></div>
			'.oc_get_control_wrapper('foot').'
	');
}

function oc_open_dbx_group() {
	print('<div class="dbx-group" id="oc-dbx">');
}

function oc_close_dbx_group() {
	print('</div>');
}

if ($oc_key_entered) {
	if (OC_WP_GTE_23 && !OC_WP_GTE_25) {
		add_action('edit_form_advanced', 'oc_open_dbx_group');
	}

	if (!OC_WP_GTE_27) {
		add_action('edit_form_advanced', 'oc_render_image_controls');
		add_action('edit_form_advanced', 'oc_render_tag_controls');
	}
	else {
		// use the meta_box
	}

	if (OC_WP_GTE_23 && !OC_WP_GTE_25) {
		add_action('edit_form_advanced', 'oc_close_dbx_group');
	}
}

function oc_get_css($which) {
	switch ($which) {
		case 'published':
			return '
			';
		case 'admin':
			print('
#oc_preview_loading {
	position:absolute;
	background:url('.OC_HTTP_PATH.'/images/loading-black.gif) 0 50% no-repeat;
	width:16px;
	height:16px;
}
#oc_image_searching {
	background:url('.OC_HTTP_PATH.'/images/loading-white.gif) 0 50% no-repeat;
	padding:8px 28px;
}
#oc_tag_searching_indicator,
#oc_suggest_tags_link {
	position:absolute;
	top: '.(OC_WP_GTE_33 ? '11px' : (OC_WP_GTE_27 ? '4px' : '7px')).';
	height:16px;
	display:none;
	text-align: right;
	font-size: 11px;
	font-weight: normal;
}
#oc_tag_searching_indicator {
	background:url('.OC_HTTP_PATH.'/images/'.(OC_WP_GTE_27 ? 'loading-trans.gif' : 'loading.gif').') center right no-repeat;
	width: 200px;
	right: '.(OC_WP_GTE_33 ? '11px' : '6px').';
	padding: 3px 25px 0 0;
	color: #909090;
	line - height:12px;
}
#oc_suggest_tags_link {
	width:100px;
	right: '.(OC_WP_GTE_33 ? '11px' : '6px').';
	top: '.(OC_WP_GTE_33 ? '11px' : (OC_WP_GTE_27 ? '3px' : '6px')).';
	padding: 1px 8px 1px 2px;
	line - height:15px;
	background: white url('.OC_HTTP_PATH.'/images/Calais-icon_16x16.jpg) 3px 50 % no-repeat;
	border:1px solid #bbb;
	text-decoration:none;
}
#oc_suggest_tags_link a,
#oc_suggest_tags_link a:visited {
	color: #21759B;
}
#oc_suggest_tags_link a:hover {
	color:#F6880C;
}
#oc_close_preview_button {
	position: absolute;
	background: url('.OC_HTTP_PATH.'/images/close-dark.gif) no-repeat;
	height: 16px;
	width: 16px;
	top: 7px;
	right: 5px;
	cursor: pointer;
}
#oc_metadata {
	display:none;
}
#oc_close_preview_button.loading {
	background: url('.OC_HTTP_PATH.'/images/loading-black.gif) no-repeat;	
}
.right_textTokenButton {
	display: block;
	float: right;
	position: relative;
	width:16px;
	height:16px;
	margin:0 6px 0 0;
	top:2px;
}
.left_textTokenButton {
	display: inline;
	position: relative;
	color: gray;
	width:10px;
	height:10px;
	padding: 0 5px;
	margin:0 6px 0 0;
	top:1px;
}
.oc_tagToken {
	background: #dbf1fc url('.OC_HTTP_PATH.'/images/tag-background.gif) center center repeat-x;
}
.oc_tagToken span.left-endcap {
	display: block;
	background: transparent url('.OC_HTTP_PATH.'/images/tag-left-endcap.gif) left center no-repeat;
	position: absolute;
	height: 20px;
	width: 7px;
}
.oc_tagToken.userInline, .oc_tagToken.userOverlay {
	background: #fff3db url('.OC_HTTP_PATH.'/images/tag-background-user.gif) center center repeat-x;
}
.right_textTokenButton.disabled {
	background-position: 0 -16px;
}
.right_textTokenButton.hover {
	background-position: 0 -32px;
}
.right_textTokenButton.kill {
	background-image: url('.OC_HTTP_PATH.'/images/delete.png);
	cursor:pointer;
}
.right_textTokenButton.add {
	background-image: url('.OC_HTTP_PATH.'/images/add.png);
	cursor:pointer;
}

.right_textTokenButton.image {
	background-image: url('.OC_HTTP_PATH.'/images/picture.png);
	cursor:pointer;
}
#oc_images_page_fwd, #oc_images_page_fwd.disabled, #oc_images_page_back, #oc_images_page_back.disabled {
	background: url('.OC_HTTP_PATH.'/images/image-nav-background.gif) 0 0 no-repeat;
	'.(!OC_WP_GTE_33 ? 'margin: 40px 15px 0;' : '').'
}
#oc_preview_insert_sizes li.square {
	background: url('.OC_HTTP_PATH.'/images/img-size-75.png);
}
#oc_preview_insert_sizes li.thumb {
	background: url('.OC_HTTP_PATH.'/images/img-size-100.png);
}
#oc_preview_insert_sizes li.small {
	background: url('.OC_HTTP_PATH.'/images/img-size-200.png);
}
#oc_preview_insert_sizes li.medium {
	background: url('.OC_HTTP_PATH.'/images/img-size-500.png);
}
.socialtag .token-text {
	font-weight:bold;
}

			');
			return '
			';
		case 'rte':
			return '
			';
	}

}

function oc_menu_items() {
	if (current_user_can('manage_options')) {
		add_options_page(
			'tagaroo Options'
			, 'tagaroo'
			, 'manage_options'
			, basename(__FILE__)
			, 'oc_options_form'
		);
	}

}
add_action('admin_menu', 'oc_menu_items');

function oc_options_form() {
	global $oc_api_key, $oc_key_entered, $oc_relevance_minimum, $oc_auto_fetch;
	$error = '';

	$api_msg = '';
	if (!$oc_key_entered) {
		$api_msg = '
			<p>Like Akismet and a few other WordPress plugins the use of tagaroo requires that each user obtain a key for the service. 
			Tagaroo is built on top of the Calais service and getting a key is easy:</p>
			<ul>
				<li>Click <a href="http://opencalais.com/user/register">here</a> and follow the instructions for registering for an API key. Fill out the form and you’ll have your key in a few seconds.</li>
				<li>When you receive the key copy it and paste it in the box above.</li>
				<li>You’re done!</li>
			</ul>';
	}
	if (isset($_GET['oc_api_test_failed'])) {
		$error = '<p><span class="error" style="padding:3px;"><strong>Error</strong>: '.$_GET['oc_api_test_failed'].'</span></p>';
	}
	if (isset($_GET['oc_update_failed'])) {
		$error = '<p><span class="error" style="padding:3px;"><strong>Error</strong>: Could not update API key.</span></p>';
	}
	if (empty($error) && isset($_GET['oc_key_changed']) && $_GET['oc_key_changed'] == true && !empty($oc_api_key)) {
		$api_msg = '<p>Your API Key is valid. Enjoy!</p>';
	}
	else if (!empty($error)) {
		$api_msg = '';
	}

	$searchable_checked = 'checked="checked"';
	$distribute_checked = 'checked="checked"';
	$privacy_prefs = get_option('oc_privacy_prefs');
	if ($privacy_prefs) {
		if ($privacy_prefs['allow_search'] != 'yes') {
			$searchable_checked = '';
		}
		if ($privacy_prefs['allow_distribution'] != 'yes') {
			$distribute_checked = '';
		}
	}
	print('
		<div class="wrap">
			<h2>tagaroo</h2>
			<form action="" method="post">
				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row">Calais API Key</th>
							<td>
								<input type="text" size="24" name="oc_api_key" autocomplete="off" value="'.$oc_api_key.'" /><br/>'.$api_msg.$error.'
							</td>
						</tr>
					</tbody>
				</table>

				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row">Your posts can be:</th>
							<td>
								<input id="oc_privacy_searchable" type="checkbox" name="oc_privacy_searchable" '.$searchable_checked.' />
								<label for="oc_privacy_searchable">Searched</label><br/>
								<input id="oc_privacy_distribute" type="checkbox" name="oc_privacy_distribute" '.$distribute_checked.' />
								<label for="oc_privacy_distribute">Distributed</label><br/>
								<p><a href="http://opencalais.com/page/API_terms_of_use">Only public, published posts will be indexed by Calais</a></p>
							</td>
						</tr>
					</tbody>
				</table>

				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row">Suggest tags with:</th>
							<td>
								<input id="oc_relevance_any" type="radio" name="oc_relevance_minimum" value="any" '.($oc_relevance_minimum == 'any' ? 'checked="checked"' : '').'/>
								<label for="oc_relevance_any">Any relevance rating</label><br/>
								<input id="oc_relevance_medium" type="radio" name="oc_relevance_minimum" value="medium" '.($oc_relevance_minimum == 'medium' ? 'checked="checked"' : '').'/>
								<label for="oc_relevance_medium">Medium or higher relevance rating</label><br/>
								<input id="oc_relevance_high" type="radio" name="oc_relevance_minimum" value="high" '.($oc_relevance_minimum == 'high' ? 'checked="checked"' : '').'/>
								<label for="oc_relevance_high">Only high relevance ratings</label><br/>
								<p>'./*(Explanatory copy goes here.)*/'</p>
							</td>
						</tr>
					</tbody>
				</table>

				<table class="form-table">
					<tbody>
						<tr>
							<th scope="row">Auto-fetch tags?</th>
							<td>
								<input type="checkbox" name="oc_auto_fetch" '.($oc_auto_fetch == 'yes' ? 'checked="checked"' : '').' /><br/>
							</td>
						</tr>
					</tbody>
				</table>

				<p class="submit">
					<input type="hidden" name="oc_action" value="update_api_key" />
					<input type="submit" name="submit" value="Update tagaroo Options" />
				</p>
			</form>
		</div>
	');
}

function oc_admin_head() {
	global $oc_key_entered;
	if (oc_on_edit_page() && $oc_key_entered) {
		print('
	<script type="text/javascript" src="'.admin_url('index.php?oc_action=admin_js').'"></script>
	<link type="text/css" href="'.admin_url('index.php?oc_action=admin_css').'" rel="stylesheet" />
	<link type="text/css" href="'.admin_url('index.php?oc_action=admin_css').'" rel="stylesheet" />
	<!--[if IE]>
	<link type="text/css" href="'.OC_HTTP_PATH.'/css/ie6.css" rel="stylesheet" />
	<![endif]-->
	');
		if (OC_WP_GTE_27) {
			add_meta_box('oc_tag_controls', 'tagaroo Tags', 'oc_render_tag_controls', 'post', 'normal', 'high');
			add_meta_box('oc_image_controls', 'tagaroo Images', 'oc_render_image_controls', 'post', 'normal', 'high');
		}
	}
}
add_action('admin_head', 'oc_admin_head');

if (OC_WP_GTE_25) {
	function oc_addMCE_plugin($plugins) {
		global $oc_key_entered;
		if ($oc_key_entered) {
			$plugins['tagaroo'] = OC_HTTP_PATH.'/js/mce/mce3/editor_plugin.js';
		}
		return $plugins;
	}

	if (oc_on_edit_page()) {
		add_filter('mce_external_plugins', 'oc_addMCE_plugin');
	}
}
else {
	if (OC_WP_GTE_23) {
		function oc_addMCE_plugin($plugins) {
			global $oc_key_entered;
			if ($oc_key_entered) {
				$plugins[] = 'tagaroo';
			}
			return $plugins;
		}

		if (oc_on_edit_page()) {
			add_filter('mce_plugins', 'oc_addMCE_plugin');
		}
	}
}

function oc_addMCE_css($csv) {
}
add_filter('mce_css', 'oc_addMCE_css');

function oc_generate_commit_id($post) {
	return get_permalink($post).time();
}

function oc_save_post($post_id, $post) {
	if (OC_WP_GTE_26 && $post->post_type == 'revision') {
		// it's at least WP2.6 and a revision, so don't add meta data, just return.
		return;
	}
	if ($post->post_status == 'publish') {
		// commit the content to opencalais
		$privacy_prefs = get_option('oc_privacy_prefs');

		$oc_id = get_post_meta($post_id, 'oc_commit_id');
		if (!$oc_id) {
			$oc_id = oc_generate_commit_id($post);
			add_post_meta($post_id, 'oc_commit_id', $oc_id);
		}
		$params = oc_api_param_xml(
			$oc_id,
			'',
			($privacy_prefs['allow_distribution'] == 'yes'),
			($privacy_prefs['allow_search'] == 'yes')
		);
		$result = oc_ping_oc_api($post->post_content, OC_FINAL_CONTENT, $params);
	}
	if (isset($_POST['oc_metadata'])) {
		$metadata = get_post_meta($post_id, 'oc_metadata', true);
		if (!$metadata) {
			$r = add_post_meta($post_id, 'oc_metadata', stripslashes($_POST['oc_metadata']));
		}
		else {
			$r = update_post_meta($post_id, 'oc_metadata', stripslashes($_POST['oc_metadata']));
		}
	}
}
add_action('save_post', 'oc_save_post', 10, 2);


?>
