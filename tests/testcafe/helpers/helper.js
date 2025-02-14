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

import { t, Role, Selector } from "testcafe";
import { wordpress_login } from "../models/wordpress_login";
import { userVariables } from "../../../.testcaferc";

const execSync = require("child_process").execSync;

export function randstr() {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, "")
    .substr(0, 9);
}

export const bmltwf_admin = Role(userVariables.admin_logon_page_single, async (t) => {
  // console.log("trying to log on to "+userVariables.admin_logon_page_single+" using username "+userVariables.admin_password_single+" password "+userVariables.admin_password_single);
  await t.typeText(wordpress_login.user_login, userVariables.admin_logon_single).typeText(wordpress_login.user_pass, userVariables.admin_password_single).click(wordpress_login.wp_submit);
  // await t.expect(wordpress_login.user_login.value).eql(userVariables.admin_logon_single);
});

export const bmltwf_submission_reviewer = Role(userVariables.admin_logon_page_single, async (t) => {
  await t.typeText(wordpress_login.user_login, userVariables.submission_reviewer_user).typeText(wordpress_login.user_pass, userVariables.submission_reviewer_pass).click(wordpress_login.wp_submit);
});

export const bmltwf_submission_nopriv = Role(userVariables.admin_logon_page_single, async (t) => {
  await t
    .typeText(wordpress_login.user_login, userVariables.submission_reviewer_nopriv_user)
    .typeText(wordpress_login.user_pass, userVariables.submission_reviewer_nopriv_pass)
    .click(wordpress_login.wp_submit);
});

export const bmltwf_admin_multisingle = Role(userVariables.admin_logon_page_multisingle, async (t) => {
  await t.typeText(wordpress_login.user_login, userVariables.admin_logon_multisingle).typeText(wordpress_login.user_pass, userVariables.admin_password_multisingle).click(wordpress_login.wp_submit);
});

export const bmltwf_admin_multinetwork = Role(userVariables.admin_logon_page_multinetwork, async (t) => {
  await t.typeText(wordpress_login.user_login, userVariables.admin_logon_multinetwork).typeText(wordpress_login.user_pass, userVariables.admin_password_multinetwork).click(wordpress_login.wp_submit);
});

export async function select_dropdown_by_id(element, id) {
  await t.click(element).click(element.find("option").withAttribute("id", id));
}

export async function select_dropdown_by_text(element, text) {
  await t.click(element).click(element.find("option").withText(text));
}

export async function select_dropdown_by_value(element, value) {
  await t.click(element).click(element.find("option").withAttribute("value", value));
}

export async function select_select2_dropdown_by_value(element, value) {
  await t.click(element).click(element.find("option").withAttribute("value", value));
}

export async function click_table_row_column(element, row, column) {
  const g = element.child("tbody").child(row).child(column);

  await t.click(g);
}

export async function click_dt_button_by_index(element, index) {
  const g = element.find("button").nth(index);

  await t.click(g);
}

export async function get_table_row_col(element, row, column) {
  return element.child("tbody").child(row).child(column);
}

export async function click_dialog_button_by_index(element, index) {
  const g = element.find("button").nth(index);

  await t.click(g);
}

export async function waitfor(site) {
  // console.log("waiting for "+site);
  execSync(userVariables.waitfor + " " + site);
}

export async function reset_bmlt2x(t) {
  console.log("resetting bmlt");
  let options = {stdio : 'pipe' };
  execSync(userVariables.blank_bmlt,options);
  waitfor(userVariables.bmlt2x_login_page)
  console.log("reset");
}

export async function reset_bmlt3x(t) {
  console.log("resetting bmlt3x");
  let options = {stdio : 'pipe' };
  execSync(userVariables.blank_bmlt3x,options);
  waitfor(userVariables.bmlt3x_login_page);
  console.log("reset");
}


export async function reset_bmlt2x_with_auto_geocoding_off(t) {
  console.log("turning geocode off");
  let options = {stdio : 'pipe' };
  execSync(userVariables.auto_geocoding_off,options);
  waitfor(userVariables.bmlt2x_login_page);
  console.log("geocode off");
}

export async function reset_bmlt3x_with_auto_geocoding_off(t) {
  console.log("bmlt3x turning geocode off");
  let options = {stdio : 'pipe' };
  execSync(userVariables.bmlt3x_auto_geocoding_off,options);
  waitfor(userVariables.bmlt3x_login_page);
  console.log("geocode off");
}

export async function restore_from_backup(role, settings_page, restore_json, host, port) {
  // console.log("settings page "+settings_page);
  // console.log("restore_json "+restore_json);
  
  // pre fill the submissions
  const restorebody = {
    options: {
      bmltwf_email_from_address: "example@example",
      bmltwf_delete_closed_meetings: "unpublish",
      bmltwf_optional_location_nation: "hidden",
      bmltwf_optional_location_nation_displayname: "Nation",
      bmltwf_optional_location_sub_province: "hidden",
      bmltwf_optional_location_sub_province_displayname: "Sub Province",
      bmltwf_optional_location_province: "display",
      bmltwf_optional_location_province_displayname: "Province",
      bmltwf_optional_postcode: "display",
      bmltwf_optional_postcode_displayname: "Postcode",
      bmltwf_required_meeting_formats: "true",
      bmltwf_trusted_servants_can_delete_submissions: "true",
      bmltwf_submitter_email_template:
        '<p><br>Thank you for submitting the online meeting update.<br>We will usually be able action your\n    request within 48 hours.<br>Our process also updates NA websites around Australia and at NA World Services.<br>\n</p>\n<hr>What was submitted: <br><br>\n<table class="blueTable" style="border: 1px solid #1C6EA4;background-color: #EEEEEE;text-align: left;border-collapse: collapse;">\n    <thead style="background: #1C6EA4;border-bottom: 2px solid #444444;">\n        <tr>\n            <th style="border: 1px solid #AAAAAA;padding: 3px 2px;font-size: 14px;font-weight: bold;color: #FFFFFF;border-left: none;">\n                <br>Field Name\n            </th>\n            <th style="border: 1px solid #AAAAAA;padding: 3px 2px;font-size: 14px;font-weight: bold;color: #FFFFFF;border-left: 2px solid #D0E4F5;">\n                <br>Value\n            </th>\n        </tr>\n    </thead>\n    <tbody>\n        {field:submission}\n    </tbody>\n</table>\n\n',
      bmltwf_fso_email_template:
        '<p>Attn: FSO.<br>\nPlease send a starter kit to the following meeting:\n</p>\n<hr><br>\n<table class="blueTable" style="border: 1px solid #1C6EA4;background-color: #EEEEEE;text-align: left;border-collapse: collapse;">\n    <thead style="background: #1C6EA4;border-bottom: 2px solid #444444;">\n        <tr>\n            <th style="border: 1px solid #AAAAAA;padding: 3px 2px;font-size: 14px;font-weight: bold;color: #FFFFFF;border-left: none;">\n                <br>Field Name\n            </th>\n            <th style="border: 1px solid #AAAAAA;padding: 3px 2px;font-size: 14px;font-weight: bold;color: #FFFFFF;border-left: 2px solid #D0E4F5;">\n                <br>Value\n            </th>\n        </tr>\n    </thead>\n    <tbody>\n        <tr>\n            <td style="border: 1px solid #AAAAAA;padding: 3px 2px;font-size: 13px;">Group Name</td>\n            <td style="border: 1px solid #AAAAAA;padding: 3px 2px;font-size: 13px;">{field:meeting_name}</td>\n        </tr>\n        <tr>\n            <td style="border: 1px solid #AAAAAA;padding: 3px 2px;font-size: 13px;">Requester First Name</td>\n            <td style="border: 1px solid #AAAAAA;padding: 3px 2px;font-size: 13px;">{field:first_name}</td>\n        </tr>\n        <tr>\n            <td style="border: 1px solid #AAAAAA;padding: 3px 2px;font-size: 13px;">Requester Last Name</td>\n            <td style="border: 1px solid #AAAAAA;padding: 3px 2px;font-size: 13px;">{field:last_name}</td>\n        </tr>\n        <tr>\n            <td style="border: 1px solid #AAAAAA;padding: 3px 2px;font-size: 13px;">Starter Kit Postal Address</td>\n            <td style="border: 1px solid #AAAAAA;padding: 3px 2px;font-size: 13px;">{field:starter_kit_postal_address}\n            </td>\n        </tr>\n    </tbody>\n</table>\n',
      bmltwf_fso_email_address: "example@example.example",
      bmltwf_fso_feature: "display",
      bmltwf_db_version: "0.4.0",
      bmltwf_bmlt_server_address: "http://" + host + ":" + port + "/main_server/",
      bmltwf_bmlt_username: "bmlt-workflow-bot",
      bmltwf_bmlt_test_status: "success",
      bmltwf_bmlt_password:
        'a:2:{s:6:"config";a:6:{s:4:"size";s:4:"MzI=";s:4:"salt";s:24:"/5ObzNuYZ/Y5aoYTsr0sZw==";s:9:"limit_ops";s:4:"OA==";s:9:"limit_mem";s:12:"NTM2ODcwOTEy";s:3:"alg";s:4:"Mg==";s:5:"nonce";s:16:"VukDVzDkAaex/jfB";}s:9:"encrypted";s:44:"fertj+qRqQrs9tC+Cc32GrXGImHMfiLyAW7sV6Xojw==";}',
    },
    submissions: [
      {
        id: "93",
        submission_time: "2022-05-15 12:32:38",
        change_time: "0000-00-00 00:00:00",
        changed_by: null,
        change_made: null,
        submitter_name: "first last",
        submission_type: "reason_new",
        submitter_email: "test@test.com.zz",
        meeting_id: "0",
        service_body_bigint: "1047",
        changes_requested:
          '{"meeting_name":"my test meeting","start_time":"10:40:00","duration_time":"04:30:00","location_text":"my location","location_street":"110 Avoca Street","location_info":"info","location_municipality":"Randwick","location_province":"NSW","location_postal_code_1":2031,"weekday_tinyint":"2","service_body_bigint":1047,"format_shared_id_list":"1,2,56","contact_number":"12345","group_relationship":"Group Member","add_contact":"yes","additional_info":"my additional info","virtual_meeting_additional_info":"Zoom ID 83037287669 Passcode: testing","phone_meeting_number":"+61 1800 253430 code #8303782669","virtual_meeting_link":"https:\\/\\/us02web.zoom.us\\/j\\/83037287669?pwd=OWRRQU52ZC91TUpEUUExUU40eTh2dz09"}',
        action_message: null,
      },
      {
        id: "94",
        submission_time: "2022-05-15 12:33:09",
        change_time: "0000-00-00 00:00:00",
        changed_by: null,
        change_made: null,
        submitter_name: "first last",
        submission_type: "reason_change",
        submitter_email: "test@test.com.zz",
        meeting_id: "1601",
        service_body_bigint: "1009",
        changes_requested:
          '{"meeting_name":"virtualmeeting randwickupdate","contact_number":"12345","group_relationship":"Group Member","add_contact":"yes","additional_info":"my additional info","original_meeting_name":"virtualmeeting randwick","original_weekday_tinyint":"2","original_start_time":"20:30:00"}',
        action_message: null,
      },
      {
        id: "95",
        submission_time: "2022-05-15 12:34:04",
        change_time: "0000-00-00 00:00:00",
        changed_by: null,
        change_made: null,
        submitter_name: "first last",
        submission_type: "reason_close",
        submitter_email: "test@test.com.zz",
        meeting_id: "2560",
        service_body_bigint: "1047",
        changes_requested:
          '{"contact_number":"12345","group_relationship":"Group Member","add_contact":"yes","service_body_bigint":1047,"additional_info":"my additional info","meeting_name":"virtualmeeting randwick","weekday_tinyint":"2","start_time":"20:30:00"}',
        action_message: null,
      },
    ],
    service_bodies: [
      {
        service_body_bigint: "1009",
        service_body_name: "Mid-Hudson Area Service",
        service_body_description: "Area Service Serving Counties North of Westchester.",
        show_on_form: "1",
      },
      {
        service_body_bigint: "1046",
        service_body_name: "ABCD Region",
        service_body_description: "North Hudson Valley Area, including some of Western Mass.",
        show_on_form: "1",
      },
      {
        service_body_bigint: "1047",
        service_body_name: "Albany-Rensselaer Area",
        service_body_description: "",
        show_on_form: "1",
      },
      {
        service_body_bigint: "1048",
        service_body_name: "Berkshire County Area",
        service_body_description: "",
        show_on_form: "0",
      },
      {
        service_body_bigint: "1049",
        service_body_name: "Mohawk River Area",
        service_body_description: "",
        show_on_form: "0",
      },
      {
        service_body_bigint: "1050",
        service_body_name: "Southern Adirondack Mountain Miracles Area",
        service_body_description: "",
        show_on_form: "1",
      },
      {
        service_body_bigint: "1051",
        service_body_name: "Green Mountain Area",
        service_body_description: "",
        show_on_form: "0",
      },
    ],
    service_bodies_access: [
      {
        service_body_bigint: "1009",
        wp_uid: "1",
      },
      {
        service_body_bigint: "1009",
        wp_uid: "2",
      },
      {
        service_body_bigint: "1046",
        wp_uid: "1",
      },
      {
        service_body_bigint: "1046",
        wp_uid: "2",
      },
      {
        service_body_bigint: "1047",
        wp_uid: "1",
      },
      {
        service_body_bigint: "1047",
        wp_uid: "2",
      },
      {
        service_body_bigint: "1050",
        wp_uid: "1",
      },
      {
        service_body_bigint: "1050",
        wp_uid: "2",
      },
    ],
  };

  await t.useRole(role).navigateTo(settings_page);

  const nonce = await Selector("#_wprestnonce").value;
  const resp = await t.request(restore_json, {
    method: "POST",
    body: restorebody,
    headers: {
      "Content-Type": "application/json",
      // "Content-Length":body.length,
      "X-WP-Nonce": nonce,
    },
  });
  // console.log(restore_json);
  // console.log(resp);
}

export async function crouton3x(t) {
  const resp = await t.request(userVariables.crouton3x);
}

export async function crouton2x(t) {
  const resp = await t.request(userVariables.crouton2x);

}

export async function reset_bmlt2x_with_states_off(t) {
  // disable state dropdown
  //console.log("turning states off");
  let options = {stdio : 'pipe' };
  execSync(userVariables.reset_bmlt2x_with_states_off,options);
  waitfor(userVariables.bmlt2x_login_page);
  //console.log("states off");
}

export async function reset_bmlt2x_with_states_on(t) {
  // enable state dropdown
  //console.log("turning states on");
  let options = {stdio : 'pipe' };
  execSync(userVariables.reset_bmlt2x_with_states_on,options);
  waitfor(userVariables.bmlt2x_login_page);
  //console.log("states on");
}

export async function reset_bmlt3x_with_states_off(t) {
  // disable state dropdown
  //console.log("turning states off");
  let options = {stdio : 'pipe' };
  execSync(userVariables.reset_bmlt3x_with_states_off,options);
  waitfor(userVariables.bmlt3x_login_page);
  //console.log("states off");
}

export async function reset_bmlt3x_with_states_on(t) {
  // enable state dropdown
  //console.log("turning states on");
  let options = {stdio : 'pipe' };
  execSync(userVariables.reset_bmlt3x_with_states_on,options);
  waitfor(userVariables.bmlt3x_login_page);
  //console.log("states on");
}

export async function check_checkbox(t, s) {
  var state = await s();
  if (!state.checked) {
    await t.click(s);
  }
}

export async function uncheck_checkbox(t, s) {
  var state = await s();
  if (state.checked) {
    await t.click(s);
  }
}
