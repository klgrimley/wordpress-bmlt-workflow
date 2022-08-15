<?php
// Copyright (C) 2022 nigel.bmlt@gmail.com
// 
// This file is part of bmlt-workflow.
// 
// bmlt-workflow is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// bmlt-workflow is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with bmlt-workflow.  If not, see <http://www.gnu.org/licenses/>.


/**
 * Plugin Name: BMLT Workflow
 * Plugin URI: https://github.com/bmlt-enabled/bmlt-workflow
 * Description: Workflows for BMLT meeting management!
 * Version: 1.0.0
 * Requires at least: 5.2
 * Tested up to: 6.0
 * Author: @nigel-bmlt
 * Author URI: https://github.com/nigel-bmlt
 **/


 define('BW_PLUGIN_VERSION','1.0.0');

if (!defined('ABSPATH')) exit; // die if being called directly

require 'config.php';

if (file_exists('vendor/autoload.php')) {
    // use composer autoload if we're running under phpunit
    include 'vendor/autoload.php';
} else {
    // custom autoloader if not. only autoloads out of src directory
    spl_autoload_register(function (string $class) {
        if (strpos($class, 'bw\\') === 0) {
            $class = str_replace('bw\\', '', $class);
            require __DIR__ . '/src/' . str_replace('\\', '/', $class) . '.php';
        }
    });
}

use bw\BMLT\Integration;
use bw\REST\Controller;
use bw\BW_Database;
use bw\BW_WP_Options;
use bw\BW_Rest;

// database configuration
global $wpdb;

if (!class_exists('bw_plugin')) {
    class bw_plugin
    {
        use \bw\BW_Debug;

        public function __construct()
        {
            $this->BW_WP_Options = new BW_WP_Options();
            $this->bmlt_integration = new Integration();
            $this->BW_Rest = new BW_Rest();
            $this->BW_Rest_Controller = new Controller();
            $this->BW_Database = new BW_Database();

            // actions, shortcodes, menus and filters
            add_action('wp_enqueue_scripts', array(&$this, 'bw_enqueue_form_deps'));
            add_action('admin_menu', array(&$this, 'bw_menu_pages'));
            add_action('admin_enqueue_scripts', array(&$this, 'bw_admin_scripts'));
            add_action('admin_init',  array(&$this, 'bw_register_setting'));
            add_action('rest_api_init', array(&$this, 'bw_rest_controller'));
            add_shortcode('bw-meeting-update-form', array(&$this, 'bw_meeting_update_form'));
            add_filter('plugin_action_links', array(&$this, 'bw_add_plugin_link'), 10, 2);
            add_action('user_register', array(&$this,'bw_add_capability'), 10, 1 );

            register_activation_hook(__FILE__, array(&$this, 'bw_install'));
        }

        public function bw_meeting_update_form($atts = [], $content = null, $tag = '')
        {

            $bw_bmlt_test_status = get_option('bw_bmlt_test_status', "failure");
            if ($bw_bmlt_test_status != "success") {
                wp_die("<h4>WBW Plugin Error: BMLT Server not configured and tested.</h4>");
            }

            // base css and js for this page
            $this->prevent_cache_enqueue_script('bw-meeting-update-form-js', array('jquery'), 'js/meeting_update_form.js');
            $this->prevent_cache_enqueue_style('bw-meeting-update-form-css', false, 'css/meeting_update_form.css');
            $this->prevent_cache_enqueue_script('bw-general-js', array('jquery'), 'js/script_includes.js');
            wp_enqueue_style('dashicons');

            // jquery validation

            wp_enqueue_script('jqueryvalidate');
            wp_enqueue_script('jqueryvalidateadditional');

            // select2
            $this->enqueue_select2();

            // inline scripts
            $script  = 'var bw_form_submit_url = ' . json_encode(get_rest_url() . $this->BW_Rest->bw_rest_namespace . '/submissions') . '; ';
            $script .= 'var bw_bmlt_server_address = "' . get_option('bw_bmlt_server_address') . '";';
            // optional fields
            $script .= 'var bw_optional_location_nation = "' . get_option('bw_optional_location_nation') . '";';
            $script .= 'var bw_optional_location_sub_province = "' . get_option('bw_optional_location_sub_province') . '";';
            $script .= 'var bw_optional_postcode = "' . get_option('bw_optional_postcode') . '";';
            $script .= 'var bw_fso_feature = "'. get_option('bw_fso_feature').'";';

            // add meeting formats
            $formatarr = $this->bmlt_integration->getMeetingFormats();
            // $this->debug_log("FORMATS");
            // $this->debug_log($formatarr);
            // $this->debug_log(json_encode($formatarr));
            $script .= 'var bw_bmlt_formats = ' . json_encode($formatarr) . '; ';

            // do a one off lookup for our servicebodies
            $url = '/' . $this->BW_Rest->bw_rest_namespace . '/servicebodies';
            $this->debug_log("rest url = " . $url);

            $request  = new WP_REST_Request('GET', $url);
            $response = rest_do_request($request);
            $result = rest_get_server()->response_to_data($response, true);
            if (count($result) == 0) {
                wp_die("<h4>WBW Plugin Error: Service bodies not configured.</h4>");
            }
            $script .= 'var bw_service_bodies = ' . json_encode($result) . '; ';

            $this->debug_log("adding script " . $script);
            $status = wp_add_inline_script('bw-meeting-update-form-js', $script, 'before');
            $this->prevent_cache_enqueue_script('bw-meeting-update-form-js', array('jquery'), 'js/meeting_update_form.js');

            $result = [];
            $result['scripts'] = [];
            $result['styles'] = [];

            $this->debug_log("All scripts and styles");

            // Print all loaded Scripts
            global $wp_scripts;
            foreach ($wp_scripts->queue as $script) :
                $result['scripts'][] =  $wp_scripts->registered[$script]->src . ";";
            endforeach;

            // Print all loaded Styles (CSS)
            global $wp_styles;
            foreach ($wp_styles->queue as $style) :
                $result['styles'][] =  $wp_styles->registered[$style]->src . ";";
            endforeach;

            $this->debug_log(($result));


            ob_start();
            include('public/meeting_update_form.php');
            $content .= ob_get_clean();
            return $content;
        }

        private function prevent_cache_register_script($handle, $deps, $name)
        {
            wp_register_script($handle, plugin_dir_url(__FILE__) . $name, $deps, filemtime(plugin_dir_path(__FILE__) . $name), true);
        }

        private function prevent_cache_register_style($handle, $deps, $name)
        {

            $ret = wp_register_style($handle, plugin_dir_url(__FILE__) . $name, $deps, filemtime(plugin_dir_path(__FILE__) . $name), 'all');
        }

        private function prevent_cache_enqueue_script($handle, $deps, $name)
        {

            $ret = wp_enqueue_script($handle, plugin_dir_url(__FILE__) . $name, $deps, filemtime(plugin_dir_path(__FILE__) . $name), true);
        }

        private function prevent_cache_enqueue_style($handle, $deps, $name)
        {

            $ret = wp_enqueue_style($handle, plugin_dir_url(__FILE__) . $name, $deps, filemtime(plugin_dir_path(__FILE__) . $name), 'all');
        }

        private function register_select2()
        {
            wp_register_style('select2css', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css', false, '1.0', 'all');
            wp_register_script('select2', 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js', array('jquery'), '1.0', true);
        }

        private function enqueue_select2()
        {
            wp_enqueue_style('select2css');
            wp_enqueue_script('select2');
        }

        private function enqueue_jquery_dialog()
        {
            // jquery dialogs
            wp_enqueue_script('jquery-ui-dialog');
            wp_enqueue_style('wp-jquery-ui-dialog');
        }

        public function bw_enqueue_form_deps()
        {

            $this->register_select2();
            wp_register_script('jqueryvalidate', 'https://cdn.jsdelivr.net/npm/jquery-validation@1.19.3/dist/jquery.validate.min.js', array('jquery'), '1.0', true);
            wp_register_script('jqueryvalidateadditional', 'https://cdn.jsdelivr.net/npm/jquery-validation@1.19.3/dist/additional-methods.min.js', array('jquery', 'jqueryvalidate'), '1.0', true);
            $this->prevent_cache_register_script('bw-general-js', array('jquery'), 'js/script_includes.js');
            $this->prevent_cache_register_script('bw-meeting-update-form-js', array('jquery', 'jqueryvalidate', 'jqueryvalidateadditional'), 'js/meeting_update_form.js');
            $this->prevent_cache_register_style('bw-meeting-update-form-css', false, 'css/meeting_update_form.css');
            $this->debug_log("scripts and styles registered");
        }

        public function bw_admin_scripts($hook)
        {


            // $this->debug_log($hook);

            if (($hook != 'toplevel_page_bw-settings') && ($hook != 'bmlt-workflow_page_bw-submissions') && ($hook != 'bmlt-workflow_page_bw-service-bodies')) {
                return;
            }

            $this->prevent_cache_enqueue_script('bwjs', array('jquery'), 'js/script_includes.js');

            switch ($hook) {

                case ('toplevel_page_bw-settings'):
                    // base css and scripts for this page
                    $this->prevent_cache_enqueue_style('bw-admin-css', false, 'css/admin_options.css');
                    $this->prevent_cache_enqueue_script('admin_options_js', array('jquery'), 'js/admin_options.js');

                    // clipboard
                    wp_enqueue_script('clipboard');

                    // jquery dialog
                    $this->enqueue_jquery_dialog();

                    // inline scripts
                    $script  = 'var bw_admin_bmltserver_rest_url = ' . json_encode(get_rest_url() . $this->BW_Rest->bw_rest_namespace . '/bmltserver') . '; ';
                    $script .= 'var bw_admin_backup_rest_url = ' . json_encode(get_rest_url() . $this->BW_Rest->bw_rest_namespace . '/options/backup') . '; ';
                    $script .= 'var bw_admin_restore_rest_url = ' . json_encode(get_rest_url() . $this->BW_Rest->bw_rest_namespace . '/options/restore') . '; ';
                    $script .= 'var bw_admin_bw_service_bodies_rest_url = ' . json_encode(get_rest_url() . $this->BW_Rest->bw_rest_namespace . '/servicebodies') . '; ';
                    $script .= 'var bw_fso_feature = "'. get_option('bw_fso_feature').'";';

                    wp_add_inline_script('admin_options_js', $script, 'before');
                    break;

                case ('bmlt-workflow_page_bw-submissions'):
                    // base css and scripts for this page
                    $this->prevent_cache_enqueue_script('admin_submissions_js', array('jquery'), 'js/admin_submissions.js');
                    $this->prevent_cache_enqueue_style('bw-admin-submissions-css', false, 'css/admin_submissions.css');

                    // jquery dialog
                    $this->enqueue_jquery_dialog();

                    // datatables
                    wp_register_style('dtcss', 'https://cdn.datatables.net/v/dt/dt-1.11.5/b-2.2.2/r-2.2.9/sl-1.3.4/datatables.min.css', false, '1.0', 'all');
                    wp_register_script('dt', 'https://cdn.datatables.net/v/dt/dt-1.11.5/b-2.2.2/r-2.2.9/sl-1.3.4/datatables.min.js', array('jquery'), '1.0', true);
                    wp_enqueue_style('dtcss');
                    wp_enqueue_script('dt');

                    // select2 for quick editor
                    $this->register_select2();
                    $this->enqueue_select2();

                    // make sure our rest urls are populated
                    $script  = 'var bw_admin_submissions_rest_url = ' . json_encode(get_rest_url() . $this->BW_Rest->bw_rest_namespace . '/submissions/') . '; ';
                    $script  .= 'var bw_bmltserver_geolocate_rest_url = ' . json_encode(get_rest_url() . $this->BW_Rest->bw_rest_namespace . '/bmltserver/geolocate') . '; ';
                    // add our bmlt server for the submission lookups
                    $script .= 'var bw_bmlt_server_address = "' . get_option('bw_bmlt_server_address') . '";';

                    // add meeting formats
                    $formatarr = $this->bmlt_integration->getMeetingFormats();
                    $this->debug_log("FORMATS");
                    $this->debug_log(($formatarr));
                    $this->debug_log(json_encode($formatarr));
                    $script .= 'var bw_bmlt_formats = ' . json_encode($formatarr) . '; ';

                    // do a one off lookup for our servicebodies
                    $url = '/' . $this->BW_Rest->bw_rest_namespace . '/servicebodies';

                    $request  = new WP_REST_Request('GET', $url);
                    $response = rest_do_request($request);
                    $result     = rest_get_server()->response_to_data($response, true);
                    $script .= 'var bw_admin_bw_service_bodies = ' . json_encode($result) . '; ';

                    // defaults for approve close form
                    $bw_default_closed_meetings = get_option('bw_delete_closed_meetings');
                    $script .= 'var bw_default_closed_meetings = "' . $bw_default_closed_meetings . '"; ';

                    // optional fields in quickedit
                    $script .= 'var bw_optional_location_nation = "' . get_option('bw_optional_location_nation') . '";';
                    $script .= 'var bw_optional_location_sub_province = "' . get_option('bw_optional_location_sub_province') . '";';
                    $script .= 'var bw_optional_postcode = "' . get_option('bw_optional_postcode') . '";';

                    wp_add_inline_script('admin_submissions_js', $script, 'before');

                    break;

                case ('bmlt-workflow_page_bw-service-bodies'):
                    // base css and scripts for this page
                    $this->prevent_cache_enqueue_script('admin_service_bodies_js', array('jquery'), 'js/admin_service_bodies.js');
                    $this->prevent_cache_enqueue_style('bw-admin-submissions-css', false, 'css/admin_service_bodies.css');

                    // select2
                    $this->register_select2();
                    $this->enqueue_select2();

                    // make sure our rest url is populated
                    $script = 'var bw_admin_bw_service_bodies_rest_url = ' . json_encode(get_rest_url() . $this->BW_Rest->bw_rest_namespace . '/servicebodies') . '; ';
                    $script .= 'var wp_users_url = ' . json_encode(get_rest_url() . 'wp/v2/users') . '; ';
                    wp_add_inline_script('admin_service_bodies_js', $script, 'before');
                    break;
            }
        }

        public function bw_menu_pages()
        {

            add_menu_page(
                'BMLT Workflow',
                'BMLT Workflow',
                'manage_options',
                'bw-settings',
                '',
                'dashicons-analytics',
                null
            );

            add_submenu_page(
                'bw-settings',
                'Configuration',
                'Configuration',
                'manage_options',
                'bw-settings',
                array(&$this, 'display_bw_admin_options_page'),
                2
            );

            add_submenu_page(
                'bw-settings',
                'Workflow Submissions',
                'Workflow Submissions',
                $this->BW_WP_Options->bw_capability_manage_submissions,
                'bw-submissions',
                array(&$this, 'display_bw_admin_submissions_page'),
                2
            );

            add_submenu_page(
                'bw-settings',
                'Service Bodies',
                'Service Bodies',
                'manage_options',
                'bw-service-bodies',
                array(&$this, 'display_bw_admin_service_bodies_page'),
                2
            );
        }

        public function bw_add_plugin_link($plugin_actions, $plugin_file)
        {

            $new_actions = array();
            if (basename(plugin_dir_path(__FILE__)) . '/bmlt-workflow.php' === $plugin_file) {
                $new_actions['cl_settings'] = sprintf(__('<a href="%s">Settings</a>', 'comment-limiter'), esc_url(admin_url('admin.php?page=bw-settings')));
            }

            return array_merge($new_actions, $plugin_actions);
        }

        public function bw_rest_controller()
        {
            $this->BW_Rest_Controller->register_routes();
        }

        public function bw_register_setting()
        {

            $this->debug_log("registering settings");

            if (!current_user_can('activate_plugins')) {
                wp_die("This page cannot be accessed");
            }

            register_setting(
                'bw-settings-group',
                'bw_email_from_address',
                array(
                    'type' => 'string',
                    'description' => 'Email from address',
                    'sanitize_callback' => array(&$this, 'bw_email_from_address_sanitize_callback'),
                    'show_in_rest' => false,
                    'default' => 'example@example'
                )
            );

            register_setting(
                'bw-settings-group',
                'bw_delete_closed_meetings',
                array(
                    'type' => 'string',
                    'description' => 'Default for close meeting submission',
                    'sanitize_callback' => array(&$this, 'bw_delete_closed_meetings_sanitize_callback'),
                    'show_in_rest' => false,
                    'default' => 'unpublish'
                )
            );

            register_setting(
                'bw-settings-group',
                'bw_optional_location_nation',
                array(
                    'type' => 'string',
                    'description' => 'optional field for location_nation',
                    'sanitize_callback' => array(&$this, 'bw_optional_location_nation_sanitize_callback'),
                    'show_in_rest' => false,
                    'default' => 'hidden'
                )
            );

            register_setting(
                'bw-settings-group',
                'bw_optional_location_sub_province',
                array(
                    'type' => 'string',
                    'description' => 'optional field for location_sub_province',
                    'sanitize_callback' => array(&$this, 'bw_optional_location_sub_province_sanitize_callback'),
                    'show_in_rest' => false,
                    'default' => 'hidden'
                )
            );

            register_setting(
                'bw-settings-group',
                'bw_optional_postcode',
                array(
                    'type' => 'string',
                    'description' => 'optional field for postcode',
                    'sanitize_callback' => array(&$this, 'bw_optional_postcode_sanitize_callback'),
                    'show_in_rest' => false,
                    'default' => 'display'
                )
            );

            register_setting(
                'bw-settings-group',
                'bw_submitter_email_template',
                array(
                    'type' => 'string',
                    'description' => 'bw_submitter_email_template',
                    'sanitize_callback' => null,
                    'show_in_rest' => false,
                    'default' => file_get_contents(BW_PLUGIN_DIR . 'templates/default_submitter_email_template.html')
                )
            );
            register_setting(
                'bw-settings-group',
                'bw_fso_feature',
                array(
                    'type' => 'string',
                    'description' => 'bw_fso_feature',
                    'sanitize_callback' => array(&$this, 'bw_fso_feature_sanitize_callback'),
                    'show_in_rest' => false,
                    'default' => 'display'
                )
            );

            register_setting(
                'bw-settings-group',
                'bw_fso_email_template',
                array(
                    'type' => 'string',
                    'description' => 'bw_fso_email_template',
                    'sanitize_callback' => null,
                    'show_in_rest' => false,
                    'default' => file_get_contents(BW_PLUGIN_DIR . 'templates/default_fso_email_template.html')
                )
            );

            register_setting(
                'bw-settings-group',
                'bw_fso_email_address',
                array(
                    'type' => 'string',
                    'description' => 'FSO email address',
                    'sanitize_callback' => array(&$this, 'bw_fso_email_address_sanitize_callback'),
                    'show_in_rest' => false,
                    'default' => 'example@example.example'
                )
            );

            add_settings_section(
                'bw-settings-section-id',
                '',
                '',
                'bw-settings'
            );

            add_settings_field(
                'bw_bmlt_server_address',
                'BMLT Configuration',
                array(&$this, 'bw_bmlt_server_address_html'),
                'bw-settings',
                'bw-settings-section-id'
            );

            add_settings_field(
                'bw_backup_restore',
                'Backup and Restore',
                array(&$this, 'bw_backup_restore_html'),
                'bw-settings',
                'bw-settings-section-id'
            );

            add_settings_field(
                'bw_shortcode',
                'Meeting Update Form Shortcode',
                array(&$this,'bw_shortcode_html'),
                'bw-settings',
                'bw-settings-section-id'
            );

            add_settings_field(
                'bw_email_from_address',
                'Email From Address',
                array(&$this,'bw_email_from_address_html'),
                'bw-settings',
                'bw-settings-section-id'
            );

            add_settings_field(
                'bw_delete_closed_meetings',
                'Default for close meeting submission',
                array(&$this, 'bw_delete_closed_meetings_html'),
                'bw-settings',
                'bw-settings-section-id'
            );

            add_settings_field(
                'bw_optional_form_fields',
                'Optional form fields',
                array(&$this, 'bw_optional_form_fields_html'),
                'bw-settings',
                'bw-settings-section-id'
            );

            add_settings_field(
                'bw_fso_options',
                'Field Service Office configuration',
                array(&$this, 'bw_fso_options_html'),
                'bw-settings',
                'bw-settings-section-id'
            );

            // add_settings_field(
            //     'bw_fso_email_address',
            //     'Email address for the FSO (Starter Kit Notifications)',
            //     array(&$this, 'bw_fso_email_address_html'),
            //     'bw-settings',
            //     'bw-settings-section-id'
            // );


            // add_settings_field(
            //     'bw_fso_email_template',
            //     'Email Template for FSO emails (Starter Kit Notifications)',
            //     array(&$this, 'bw_fso_email_template_html'),
            //     'bw-settings',
            //     'bw-settings-section-id'
            // );

            add_settings_field(
                'bw_submitter_email_template',
                'Email Template for New Meeting',
                array(&$this, 'bw_submitter_email_template_html'),
                'bw-settings',
                'bw-settings-section-id'
            );
        }
        public function bw_fso_feature_sanitize_callback($input)
        {
            $this->debug_log("fso_enablde sanitize callback");            
            $this->debug_log($input);

            $output = get_option('bw_fso_feature');
            switch ($input) {
                case 'hidden':
                case 'display':
                    return $input;
                }
            add_settings_error('bw_fso_feature','err','Invalid FSO Enabled setting.');
            return $output;
        }

        public function bw_optional_postcode_sanitize_callback($input)
        {
            $this->debug_log("postcode sanitize callback");            
            $this->debug_log($input);

            $output = get_option('bw_optional_postcode');
            switch ($input) {
                case 'hidden':
                case 'displayrequired':
                case 'display':
                    return $input;
                }
            add_settings_error('bw_optional_postcode','err','Invalid Postcode setting.');
            return $output;
        }

        public function bw_optional_location_nation_sanitize_callback($input)
        {
            $this->debug_log("location nation sanitize callback");            
            $this->debug_log($input);

            $output = get_option('bw_optional_location_nation');
            switch ($input) {
                case 'hidden':
                case 'displayrequired':
                case 'display':
                    return $input;
                }
            add_settings_error('bw_optional_location_nation','err','Invalid Nation setting.');
            return $output;
        }

        public function bw_optional_location_sub_province_sanitize_callback($input)
        {
            $output = get_option('bw_optional_location_sub_province');
            switch ($input) {
                case 'hidden':
                case 'displayrequired':
                case 'display':
                    return $input;
                }
            add_settings_error('bw_optional_location_sub_province','err','Invalid Sub Province setting.');
            return $output;
        }

        public function bw_email_from_address_sanitize_callback($input)
        {
            $output = get_option('bw_email_from_address');
            $sanitized_email = sanitize_email($input);
            if (!is_email($sanitized_email))
            {
                add_settings_error('bw_email_from_address','err','Invalid email from address.');
                return $output;
            }
            return $sanitized_email;
        }

        public function bw_fso_email_address_sanitize_callback($input)
        {
            $output = get_option('bw_fso_email_address');
            $sanitized_email = sanitize_email($input);
            if (!is_email($sanitized_email))
            {
                add_settings_error('bw_fso_email_address','err','Invalid FSO email address.');
                return $output;
            }
            return $sanitized_email;
        }

        public function bw_delete_closed_meetings_sanitize_callback($input)
        {
            $output = get_option('bw_delete_closed_meetings');

            switch ($input) {
                case 'delete':
                case 'unpublish':
                    return $input;
                }
            add_settings_error('bw_delete_closed_meetings','err','Invalid delete closed meetings  setting.');
            return $output;
        }

        public function bw_bmlt_server_address_html()
        {
            echo '<div id="bw_bmlt_test_yes" style="display: none;" ><span class="dashicons dashicons-yes-alt" style="color: cornflowerblue;"></span>Your BMLT details are successfully configured.</div>';
            echo '<div id="bw_bmlt_test_no" style="display: none;" ><span class="dashicons dashicons-no" style="color: red;"></span>Your BMLT details are not configured correctly.</div>';
            echo '<div id="bw_servicebodies_test_yes" style="display: none;" ><span class="dashicons dashicons-yes-alt" style="color: cornflowerblue;"></span>Your service bodies are successfully configured.</div>';
            echo '<div id="bw_servicebodies_test_no" style="display: none;" ><span class="dashicons dashicons-no" style="color: red;"></span>Your service bodies are not configured and saved correctly. <a href="?bw-submissions">Fix</a></div>';
            echo '<br>';
            echo '<button type="button" id="bw_configure_bmlt_server">Update BMLT Configuration</button>';
            echo '<br>';
        }

        public function bw_backup_restore_html()
        {
            echo '<button type="button" id="bw_backup">Backup Configuration</button>   <button type="button" id="bw_restore">Restore Configuration</button><input type="file" id="bw_file_selector" accept=".json,application/json" style="display:none">';
            echo '<span class="spinner" id="bw-backup-spinner"></span><br>';
        }

        public function bw_shortcode_html()
        {
            echo <<<END
    <div class="bw_info_text">
    <br>You can use the shortcode <code>[bw-meeting-update-form]</code> to list the appropriate meetings and service areas in your update form.
    <br><br>
    </div>
    END;
        }

        public function bw_email_from_address_html()
        {

            $from_address = get_option('bw_email_from_address');
            echo <<<END
    <div class="bw_info_text">
    <br>The sender (From:) address of meeting update notification emails. Can contain a display name and email in the form <code>Display Name &lt;example@example.com&gt;</code> or just a standard email address.
    <br><br>
    </div>
    END;

            echo '<br><label for="bw_email_from_address"><b>From Address:</b></label><input id="bw_email_from_address" type="text" size="50" name="bw_email_from_address" value="' . $from_address . '"/>';
            echo '<br><br>';
        }

        public function bw_delete_closed_meetings_html()
        {

            $selection = get_option('bw_delete_closed_meetings');
            $delete = '';
            $unpublish = '';
            if ($selection === 'delete') {
                $delete = 'selected';
            } else {
                $unpublish = 'selected';
            }

            echo <<<END
    <div class="bw_info_text">
    <br>Trusted servants approving a 'Close Meeting' request can choose to either Delete or Unpublish. This option selects the default for all trusted servants.
    <br><br>
    </div>
    END;

            echo '<br><label for="bw_delete_closed_meetings"><b>Close meeting default:</b></label><select id="bw_delete_closed_meetings" name="bw_delete_closed_meetings"><option name="unpublish" value="unpublish" ' . $unpublish . '>Unpublish</option><option name="delete" value="delete" ' . $delete . '>Delete</option>';
            echo '<br><br>';
        }


        public function bw_optional_form_fields_html()
        {
            echo <<<END
    <div class="bw_info_text">
    <br>Optional form fields, available depending on how your service bodies use BMLT. These can be displayed, displayed and required, or hidden from your end users.
    <br><br>
    </div>
    END;

            $this->do_optional_field('bw_optional_location_nation', 'Nation');
            $this->do_optional_field('bw_optional_location_sub_province', 'Sub Province');
            $this->do_optional_field('bw_optional_postcode', 'Post Code');
        }

        private function do_optional_field($option, $friendlyname)
        {

            $value = get_option($option);
            $this->debug_log($value);
            $hidden = '';
            $displayrequired = '';
            $display = '';

            switch ($value) {
                case 'hidden':
                    $hidden = 'selected';
                    break;
                case 'displayrequired':
                    $displayrequired = 'selected';
                    break;
                case 'display':
                    $display = 'selected';
                    break;
            }
            echo <<<END
    <br><label for="${option}"><b>${friendlyname}:</b>
    </label><select id="${option}" name="${option}">
    <option name="hidden" value="hidden" ${hidden}>Hidden</option>
    <option name="displayrequired" value="displayrequired" ${displayrequired}>Display + Required Field</option>
    <option name="display" value="display" ${display}>Display Only</option>
    </select>
    <br><br>
    END;
        }

        public function bw_fso_options_html()
        {
            $hidden = '';
            $display = '';

            echo <<<END
            <div class="bw_info_text">
            <br>Enable this setting to display the starter kit option in the submission form and to configure the email address for your Field Service Office.
            <br><br>
            </div>
            END;

            $fso_enabled = get_option('bw_fso_feature');
            $from_address = get_option('bw_fso_email_address');

            switch ($fso_enabled) {
                case 'hidden':
                    $hidden = 'selected';
                    break;
                case 'display':
                    $display = 'selected';
                    break;
            }
            echo <<<END
            <br><label for="bw_fso_feature"><b>FSO Features:</b>
            </label><select id="bw_fso_feature" name="bw_fso_feature">
            <option name="hidden" value="hidden" ${hidden}>Disabled</option>
            <option name="display" value="display" ${display}>Enabled</option>
            </select>
            <br><br>
            <div id="fso_options">
            <div class="bw_info_text">
            <br>The email address to notify the FSO that starter kits are required.
            <br><br>
            </div>
            END;

            echo '<br><label for="bw_email_from_address"><b>FSO Email Address:</b></label><input type="text" size="50" id="bw_fso_email_address" name="bw_fso_email_address" value="' . $from_address . '"/>';
            echo '<br><br>';

            echo <<<END
            <div class="bw_info_text">
            <br>This template will be used when emailing the FSO about starter kit requests.
            <br><br>
            </div>
            END;
            $content = get_option('bw_fso_email_template');
            $editor_id = 'bw_fso_email_template';

            wp_editor($content, $editor_id, array('media_buttons' => false));
            echo '<button class="clipboard-button" type="button" data-clipboard-target="#' . $editor_id . '_default">Copy default template to clipboard</button>';
            echo '<br><br>';
            echo '</div>';
         }

        public function bw_submitter_email_template_html()
        {

            echo <<<END
    <div class="bw_info_text">
    <br>This template will be used when emailing a submitter about the meeting change they've requested.
    <br><br>
    </div>
    END;
            $content = get_option('bw_submitter_email_template');
            $editor_id = 'bw_submitter_email_template';

            wp_editor($content, $editor_id, array('media_buttons' => false));
            echo '<button class="clipboard-button" type="button" data-clipboard-target="#' . $editor_id . '_default">Copy default template to clipboard</button>';
            echo '<br><br>';
        }


        public function display_bw_admin_options_page()
        {
            $content = '';
            ob_start();
            include('admin/admin_options.php');
            $content = ob_get_clean();
            echo $content;
        }

        public function display_bw_admin_submissions_page()
        {
            $content = '';
            ob_start();
            include('admin/admin_submissions.php');
            $content = ob_get_clean();
            echo $content;
        }

        public function display_bw_admin_service_bodies_page()
        {
            $content = '';
            ob_start();
            include('admin/admin_service_bodies.php');
            $content = ob_get_clean();
            echo $content;
        }

        public function bw_install()
        {

            // install all our default options (if they arent set already)
            add_option('bw_email_from_address','example@example');
            add_option('bw_delete_closed_meetings','unpublish');
            add_option('bw_optional_location_nation','hidden');
            add_option('bw_optional_location_sub_province','hidden');
            add_option('bw_optional_postcode','display');
            add_option('bw_submitter_email_template',file_get_contents(BW_PLUGIN_DIR . 'templates/default_submitter_email_template.html'));
            add_option('bw_fso_email_template',file_get_contents(BW_PLUGIN_DIR . 'templates/default_fso_email_template.html'));
            add_option('bw_fso_email_address','example@example.example');
            add_option('bw_fso_feature','display');

            $this->BW_Database->bw_db_upgrade($this->BW_Database->bw_db_version, false);

            // give all 'manage_options" users the capability so they are able to see the submission menu
            $users = get_users();
            foreach ($users as $user) {
                if($user->has_cap('manage_options'))
                {
                    $user->add_cap($this->BW_WP_Options->bw_capability_manage_submissions);
                }
            }
            // add a custom role just for trusted servants
            add_role('bw_trusted_servant', 'BMLT Workflow Trusted Servant');
        }

        public function bw_add_capability( $user_id ) {

            // give all 'manage_options" users the capability on create so they are able to see the submission menu
            $user = get_user_by('id',$user_id);
                if($user->has_cap('manage_options'))
                {
                    $user->add_cap($this->BW_WP_Options->bw_capability_manage_submissions);
                    $this->debug_log("adding capabilities to new user");
                }           
        }

    }

    $start_plugin = new bw_plugin();
}
