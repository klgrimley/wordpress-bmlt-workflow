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

import { as } from "./models/admin_submissions";
import { ao } from "./models/admin_options";

import {
  restore_from_backup, 
  reset_bmlt3x,
  select_dropdown_by_text, 
  click_table_row_column, 
  click_dt_button_by_index, 
  click_dialog_button_by_index, 
  bmltwf_admin, 
   } from "./helpers/helper.js";

import { userVariables } from "../../.testcaferc";

fixture`bmlt3x_admin_submissions_fixture`
.before(async (t) => {
  await reset_bmlt3x(t);
})
.beforeEach(async (t) => {

  await restore_from_backup(bmltwf_admin, userVariables.admin_settings_page_single,userVariables.admin_restore_json,"bmlt3x","8001");

  await t.useRole(bmltwf_admin).navigateTo(userVariables.admin_submissions_page_single);
});

test("Approve_New_Meeting", async (t) => {
  // new meeting = row 2
  var row = 2;
  await click_table_row_column(as.dt_submission, row, 0);
  // approve
  await click_dt_button_by_index(as.dt_submission_wrapper, 0);

  await t.expect(as.approve_dialog_parent.visible).eql(true);

  await t.typeText(as.approve_dialog_textarea, "I approve this request");
  // press ok button
  await click_dialog_button_by_index(as.approve_dialog_parent, 1);
  // dialog closes after ok button
  await t.expect(as.approve_dialog_parent.visible).eql(false);

  var column = 8;
  await t.expect(as.dt_submission.child("tbody").child(row).child(column).innerText).notContains('None', { timeout: 10000 })
  .expect(as.dt_submission.child("tbody").child(row).child(column).innerText).eql("Approved", {timeout: 10000});
});

test("Approve_Modify_Meeting", async (t) => {
  // modify meeting = row 1
  var row = 1;
  await click_table_row_column(as.dt_submission, row, 0);
  // approve
  await click_dt_button_by_index(as.dt_submission_wrapper, 0);

  await t.expect(as.approve_dialog_parent.visible).eql(true);

  await t.typeText(as.approve_dialog_textarea, "I approve this request");
  // press ok button
  await click_dialog_button_by_index(as.approve_dialog_parent, 1);
  // dialog closes after ok button
  await t.expect(as.approve_dialog_parent.visible).eql(false);

  // const s = Selector("#dt-submission tr:nth-child(1) td:nth-child(9)");
  var column = 8;
  await t.expect(as.dt_submission.child("tbody").child(row).child(column).innerText).eql("Approved", {timeout: 10000});
});

test("Approve_Close_Meeting_With_Unpublish", async (t) => {

  // set it to unpublish
  await t.navigateTo(userVariables.admin_settings_page_single);
  await select_dropdown_by_text(ao.bmltwf_delete_closed_meetings, "Unpublish");
  await t.click(ao.submit);
  await ao.settings_updated();
  await t.navigateTo(userVariables.admin_submissions_page_single);

  // close meeting = row 0
  var row = 0;
  await click_table_row_column(as.dt_submission, row, 0);
  // approve
  await click_dt_button_by_index(as.dt_submission_wrapper, 0);

  await t.expect(as.approve_close_dialog_parent.visible).eql(true);

  await t.typeText(as.approve_close_dialog_textarea, "I approve this request");
  // press ok button
  await click_dialog_button_by_index(as.approve_close_dialog_parent, 1);
  // dialog closes after ok button
  await t.expect(as.approve_close_dialog_parent.visible).eql(false);
  var column = 8;
  await t.expect(as.dt_submission.child("tbody").child(row).child(column).innerText).eql("Approved", {timeout: 10000});
});

test("Approve_Close_Meeting_With_Delete", async (t) => {

  // set it to delete
  await t.navigateTo(userVariables.admin_settings_page_single);
  await select_dropdown_by_text(ao.bmltwf_delete_closed_meetings, "Delete");
  await t.click(ao.submit);
  await ao.settings_updated();
  await t.navigateTo(userVariables.admin_submissions_page_single);

  // close meeting = row 0
  var row = 0;
  await click_table_row_column(as.dt_submission, row, 0);
  // approve
  await click_dt_button_by_index(as.dt_submission_wrapper, 0);

  await t.expect(as.approve_close_dialog_parent.visible).eql(true);

  await t.typeText(as.approve_close_dialog_textarea, "I approve this request");
  // press ok button
  await click_dialog_button_by_index(as.approve_close_dialog_parent, 1);
  // dialog closes after ok button
  await t.expect(as.approve_close_dialog_parent.visible).eql(false);

  var column = 8;
  await t.expect(as.dt_submission.child("tbody").child(row).child(column).innerText).eql("Approved", {timeout: 10000});
});

test("Reject_New_Meeting", async (t) => {
  // new meeting = row 2
  var row = 2;
  await click_table_row_column(as.dt_submission, row, 0);
  // reject
  await click_dt_button_by_index(as.dt_submission_wrapper, 1);

  await t.expect(as.reject_dialog_parent.visible).eql(true);

  await t.typeText(as.reject_dialog_textarea, "I reject this request");
  // press ok button
  await click_dialog_button_by_index(as.reject_dialog_parent, 1);
  // dialog closes after ok button
  await t.expect(as.reject_dialog_parent.visible).eql(false);

  var column = 8;
  await t.expect(as.dt_submission.child("tbody").child(row).child(column).innerText).eql("Rejected");
});

test("Reject_Modify_Meeting", async (t) => {
  // modify meeting = row 1
  var row = 1;
  await click_table_row_column(as.dt_submission, row, 0);
  // reject
  await click_dt_button_by_index(as.dt_submission_wrapper, 1);

  await t.expect(as.reject_dialog_parent.visible).eql(true);

  await t.typeText(as.reject_dialog_textarea, "I reject this request");
  // press ok button
  await click_dialog_button_by_index(as.reject_dialog_parent, 1);
  // dialog closes after ok button
  await t.expect(as.reject_dialog_parent.visible).eql(false);

  // const s = Selector("#dt-submission tr:nth-child(1) td:nth-child(9)");
  var column = 8;
  await t.expect(as.dt_submission.child("tbody").child(row).child(column).innerText).eql("Rejected");
});

test("Reject_Close_Meeting", async (t) => {
  // close meeting = row 0
  var row = 0;
  await click_table_row_column(as.dt_submission, row, 0);
  // reject
  await click_dt_button_by_index(as.dt_submission_wrapper, 1);

  await t.expect(as.reject_dialog_parent.visible).eql(true);

  await t.typeText(as.reject_dialog_textarea, "I reject this request");
  // press ok button
  await click_dialog_button_by_index(as.reject_dialog_parent, 1);
  // dialog closes after ok button
  await t.expect(as.reject_dialog_parent.visible).eql(false);

  var column = 8;
  await t.expect(as.dt_submission.child("tbody").child(row).child(column).innerText).eql("Rejected");
});

test("Submission_Buttons_Active_correctly", async (t) => {
  // new meeting = row 2
  var row = 2;
  await click_table_row_column(as.dt_submission, row, 0);
  // approve
  var g = as.dt_submission_wrapper.find("button").nth(0);
  await t.expect(g.hasAttribute("disabled")).notOk();
  // reject
  g = as.dt_submission_wrapper.find("button").nth(1);
  await t.expect(g.hasAttribute("disabled")).notOk();
  // quickedit
  g = as.dt_submission_wrapper.find("button").nth(2);
  await t.expect(g.hasAttribute("disabled")).notOk();

  // change meeting = row 1
  var row = 1;
  await click_table_row_column(as.dt_submission, row, 0);
  // approve
  g = as.dt_submission_wrapper.find("button").nth(0);
  await t.expect(g.hasAttribute("disabled")).notOk();
  // reject
  g = as.dt_submission_wrapper.find("button").nth(1);
  await t.expect(g.hasAttribute("disabled")).notOk();
  // quickedit
  g = as.dt_submission_wrapper.find("button").nth(2);
  await t.expect(g.hasAttribute("disabled")).notOk();

  // close meeting = row 0
  var row = 0;
  await click_table_row_column(as.dt_submission, row, 0);
  // approve
  g = as.dt_submission_wrapper.find("button").nth(0);
  await t.expect(g.hasAttribute("disabled")).notOk();
  // reject
  g = as.dt_submission_wrapper.find("button").nth(1);
  await t.expect(g.hasAttribute("disabled")).notOk();
  // quickedit
  g = as.dt_submission_wrapper.find("button").nth(2);
  await t.expect(g.hasAttribute("disabled")).ok();

  // reject a request then we check the buttons again
  var row = 0;
  await click_table_row_column(as.dt_submission, row, 0);
  await click_table_row_column(as.dt_submission, row, 0);
  // reject
  await click_dt_button_by_index(as.dt_submission_wrapper, 1);

  await t.expect(as.reject_dialog_parent.visible).eql(true);

  await t.typeText(as.reject_dialog_textarea, "I reject this request");
  // press ok button
  await click_dialog_button_by_index(as.reject_dialog_parent, 1);
  // dialog closes after ok button
  await t.expect(as.reject_dialog_parent.visible).eql(false);

  var column = 8;
  await t.expect(as.dt_submission.child("tbody").child(row).child(column).innerText).eql("Rejected");

  // rejected request has no approve, reject, quickedit
  // close meeting = row 0
  var row = 0;
  await click_table_row_column(as.dt_submission, row, 0);
  // approve
  g = as.dt_submission_wrapper.find("button").nth(0);
  await t.expect(g.hasAttribute("disabled")).ok();
  // reject
  g = as.dt_submission_wrapper.find("button").nth(1);
  await t.expect(g.hasAttribute("disabled")).ok();
  // quickedit
  g = as.dt_submission_wrapper.find("button").nth(2);
  await t.expect(g.hasAttribute("disabled")).ok();
});

// test('Quickedit_New_Meeting', async t => {

// await t.useRole(bmltwf_admin);

//     // new meeting = row 0
//     var row = 0;
//     await click_table_row_column(as.dt_submission,row,0);
//     // quickedit
//     await click_dt_button_by_index(as.dt_submission_wrapper,2);

//     await t
//     .expect(as.approve_dialog_parent.visible).eql(true);

//     await t
//     .typeText(as.approve_dialog_textarea, 'I approve this request');
//     // press ok button
//     await click_dialog_button_by_index(as.approve_dialog_parent,1);
//     // dialog closes after ok button
//     await t
//     .expect(as.approve_dialog_parent.visible).eql(false);

//     var column = 8;
//     await t .expect((as.dt_submission.child('tbody').child(row).child(column)).innerText).eql('Approved');

// });


test("Approve_New_Meeting_Geocoding", async (t) => {

  // new meeting = row 2
  var row = 2;
  await click_table_row_column(as.dt_submission, row, 0);

  // quickedit
  await click_dt_button_by_index(as.dt_submission_wrapper,2);
  // geocode div should be visible
  await t.expect(as.optional_auto_geocode_enabled.visible).eql(true)

  // check the geocode button is enabled
  await t.expect((as.quickedit_dialog_parent).find("button").nth(2).hasAttribute("disabled")).notOk();
});