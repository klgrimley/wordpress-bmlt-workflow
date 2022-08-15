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



jQuery(document).ready(function ($) {
  // function dismiss_notice(element) {
  //   jQuery(element)
  //     .parent()
  //     .slideUp("normal", function () {
  //       jQuery(this).remove();
  //     });
  //   return false;
  // }

  // function clear_notices() {
  //   jQuery(".notice-dismiss").each(function (i, e) {
  //     dismiss_notice(e);
  //   });
  // }

  function attach_select_options_for_sbid(sblist, userlist, sbid, selectid) {
    Object.keys(userlist).forEach((item) => {
      var wp_uid = userlist[item]["id"];
      var username = userlist[item]["slug"];
      var membership = sblist[sbid]["membership"];
      var selected = false;
      if (membership.includes(wp_uid)) {
        selected = true;
      }
      var opt = new Option(username, wp_uid, false, selected);
      $(selectid).append(opt);
      // console.log(opt);
    });
    $(selectid).trigger("change");
  }

  function create_service_area_permission_post() {
    ret = {};
    $(".bw-userlist").each(function () {
      // console.log("got real id " + $(this).data("id"));
      id = $(this).data("id");
      // console.log("got name " + $(this).data("name"));
      sbname = $(this).data("name");
      // console.log("select vals = "+ $(this).val());
      membership = $(this).val();
      // console.log("got show_on_form = "+ $(this).data("show_on_form"));
      show_on_form = $(this).data("show_on_form");

      ret[id] = { name: sbname, show_on_form: show_on_form, membership: membership };
    });
    return ret;
  }

  $("#bw_submit").on("click", function () {
    $("#bw-userlist-table tbody tr").each(function () {
      tr = $(this);
      checked = $(tr).find("input:checkbox").prop("checked");
      select = $(tr).find("select");
      select.data("show_on_form", checked);
    });
    post = create_service_area_permission_post();

    clear_notices();

    $.ajax({
      url: bw_admin_bw_service_bodies_rest_url,
      method: "POST",
      data: JSON.stringify(post),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      processData: false,
      beforeSend: function (xhr) {
        turn_on_spinner("#bw-submit-spinner");

        xhr.setRequestHeader("X-WP-Nonce", $("#_wprestnonce").val());
      },
    })
      .done(function (response) {
        turn_off_spinner("#bw-submit-spinner");
        notice_success(response, "bw-error-message");
      })
      .fail(function (xhr) {
        turn_off_spinner("#bw-submit-spinner");
        notice_error(xhr, "bw-error-message");
      });
  });

  // get the permissions, and the userlist from wordpress, and create our select lists
  var parameters = { detail: "true" };

  $.ajax({
    url:bw_admin_bw_service_bodies_rest_url,
    dataType: "json",
    data: parameters,
    beforeSend: function (xhr) {
      turn_on_spinner("#bw-form-spinner");
      xhr.setRequestHeader("X-WP-Nonce", $("#_wprestnonce").val());
    },
  }).done(function (response) {
    $.ajax({
      // url: wp_rest_base + "wp/v2/users",
      url: wp_users_url,
      dataType: "json",
      sblist: response,
      beforeSend: function (xhr) {
        xhr.setRequestHeader("X-WP-Nonce", $("#_wprestnonce").val());
      },
    }).done(function (response) {
      var sblist = this.sblist;
      var userlist = response;
      Object.keys(sblist).forEach((item) => {
        var id = "bw_userlist_id_" + item;
        var cbid = "bw_userlist_checkbox_id_" + item;
        var checked = sblist[item]["show_on_form"] ? "checked" : "";
        var appendstr = "<tr>";

        //     <div class="grow-wrap">
        //     <textarea class='dialog_textarea' id="bw_submission_approve_dialog_textarea" onInput="this.parentNode.dataset.replicatedValue = this.value" placeholder='Add a note to this approval for the submitter'></textarea>
        // </div>

        appendstr += "<td>" + sblist[item]["name"] + "</td>";
        appendstr += '<td><div class="grow-wrap"><textarea onInput="this.parentNode.dataset.replicatedValue = this.value">' + sblist[item]["description"] + "</textarea></div></td>";
        appendstr += '<td><select class="bw-userlist" id="' + id + '" style="width: auto"></select></td>';
        appendstr += '<td class="bw-center-checkbox"><input type="checkbox" id="' + cbid + '" ' + checked + "></td>";
        appendstr += "</tr>";
        $("#bw-userlist-table tbody").append(appendstr);
        // store metadata away for later
        $("#" + id).data("id", item);
        $("#" + id).data("name", sblist[item]["name"]);

        $(".bw-userlist").select2({
          multiple: true,
          width: "100%",
        });

        attach_select_options_for_sbid(sblist, userlist, item, "#" + id);
      });
      // update the auto size boxes
      $(".grow-wrap textarea").trigger("input");

      // turn off spinner
      turn_off_spinner("#bw-form-spinner");
      // turn on table
      $("#bw-userlist-table").show();
      $("#bw_submit").show();
    });
  });
});
