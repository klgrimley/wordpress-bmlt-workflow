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

// function dismiss_notice(element) {
//   jQuery(element)
//     .parent()
//     .slideUp("normal", function () {
//       jQuery(this).remove();
//     });
//   return false;
// }

function mysql2localdate(data) {
  var t = data.split(/[- :]/);
  var d = new Date(Date.UTC(t[0], t[1] - 1, t[2], t[3], t[4], t[5]));
  var ds = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2) + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  return ds;
}

var bmltwf_changedata = {};

var venue_types = {
  1: "Face to face",
  2: "Virtual Meeting",
  3: "Hybrid Meeting",
  4: "Temporarily Closed",
};

jQuery(document).ready(function ($) {
  weekdays = ["Error", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  if (!bmltwf_auto_geocoding_enabled) {
    $("#optional_auto_geocode_enabled").hide();
  } else {
    $("#optional_auto_geocode_enabled").show();
  }

  // hide / show / required our optional fields
  switch (bmltwf_optional_location_nation) {
    case "hidden":
    case "":
      $("#optional_location_nation").hide();
      break;
    case "display":
      $("#optional_location_nation").show();
      break;
    case "displayrequired":
      $("#optional_location_nation").show();
      $("#location_nation_label").append('<span class="bmltwf-required-field"> *</span>');
      break;
  }

  switch (bmltwf_optional_location_sub_province) {
    case "hidden":
    case "":
      $("#optional_location_sub_province").hide();
      break;
    case "display":
      $("#optional_location_sub_province").show();
      break;
    case "displayrequired":
      $("#optional_location_sub_province").show();
      $("#location_sub_province_label").append('<span class="bmltwf-required-field"> *</span>');
      break;
  }

  switch (bmltwf_optional_location_province) {
    case "hidden":
    case "":
      $("#optional_location_province").hide();
      break;
    case "display":
      $("#optional_location_province").show();
      break;
    case "displayrequired":
      $("#optional_location_province").show();
      $("#location_province_label").append('<span class="bmltwf-required-field"> *</span>');
      break;
  }

  // fill in counties and sub provinces
  if (bmltwf_counties_and_sub_provinces === false) {
    $("#optional_location_sub_province").append('<input class="meeting-input" type="text" name="quickedit_location_sub_province" size="50" id="quickedit_location_sub_province">');
  } else {
    var appendstr = '<select class="meeting-input" id="quickedit_location_sub_province" name="quickedit_location_sub_province">';
    bmltwf_counties_and_sub_provinces.forEach(function (item, index) {
      appendstr += '<option value="' + item + '">' + item + "</option>";
    });
    appendstr += "</select>";
    $("#optional_location_sub_province").append(appendstr);
  }

  if (bmltwf_do_states_and_provinces === false) {
    $("#optional_location_province").append('<input class="meeting-input" type="text" name="quickedit_location_province" size="50" id="quickedit_location_province">');
  } else {
    var appendstr = '<select class="meeting-input" id="quickedit_location_province" name="quickedit_location_province">';
    bmltwf_do_states_and_provinces.forEach(function (item, index) {
      appendstr += '<option value="' + item + '">' + item + "</option>";
    });
    appendstr += "</select>";
    $("#optional_location_province").append(appendstr);
  }

  function add_highlighted_changes_to_quickedit(bmltwf_requested) {
    // fill in and highlight the changes - use extend to clone
    changes_requested = $.extend(true, {}, bmltwf_requested);

    if ("format_shared_id_list" in changes_requested) {
      changes_requested["format_shared_id_list"] = changes_requested["format_shared_id_list"].split(",");
    }

    if ("duration_time" in changes_requested) {
      var durationarr = changes_requested["duration_time"].split(":");
      // hoping we got hours, minutes and seconds here
      if (durationarr.length == 3) {
        changes_requested["duration_hours"] = durationarr[0];
        changes_requested["duration_minutes"] = durationarr[1];
        delete changes_requested["duration_time"];
      }
    }

    // some special handling for deletion of fields
    for (var key in changes_requested) {
      switch (key) {
        case "original_virtual_meeting_additional_info":
          if (
            (!("virtual_meeting_additional_info" in changes_requested) || changes_requested["virtual_meeting_additional_info"] === "") &&
            bmltwf_remove_virtual_meeting_details_on_venue_change === "true"
          ) {
            changes_requested["virtual_meeting_additional_info"] = "(deleted)";
          }
          break;
        case "original_phone_meeting_number":
          if ((!("phone_meeting_number" in changes_requested) || changes_requested["phone_meeting_number"] === "") && bmltwf_remove_virtual_meeting_details_on_venue_change === "true") {
            changes_requested["phone_meeting_number"] = "(deleted)";
          }
          break;
        case "original_virtual_meeting_link":
          if ((!("virtual_meeting_link" in changes_requested) || changes_requested["virtual_meeting_link"] === "") && bmltwf_remove_virtual_meeting_details_on_venue_change === "true") {
            changes_requested["virtual_meeting_link"] = "(deleted)";
          }
          break;
      }
    }

    Object.keys(changes_requested).forEach((element) => {
      if ($("#quickedit_" + element).length) {
        if (element === "format_shared_id_list") {
          $(".quickedit_format_shared_id_list-select2").addClass("bmltwf-changed");
        } else {
          $("#quickedit_" + element).addClass("bmltwf-changed");
        }
        $("#quickedit_" + element).val(changes_requested[element]);
        $("#quickedit_" + element).trigger("change");
      }
    });
    // trigger adding of highlights when input changes
    $(".quickedit-input").on("input.bmltwf-highlight", function () {
      $(this).addClass("bmltwf-changed");
    });
    $("#quickedit_format_shared_id_list").on("change.bmltwf-highlight", function () {
      $(".quickedit_format_shared_id_list-select2").addClass("bmltwf-changed");
    });
  }

  function populate_and_open_quickedit(id) {
    // clear quickedit

    // remove our change handler
    $(".quickedit-input").off("input.bmltwf-highlight");
    $("#quickedit_format_shared_id_list").off("change.bmltwf-highlight");
    // remove the highlighting
    $(".quickedit-input").removeClass("bmltwf-changed");
    $(".quickedit_format_shared_id_list-select2").removeClass("bmltwf-changed");

    // remove any content from the input fields
    $(".quickedit-input").val("");

    // fill quickedit

    // if it's a meeting change, fill from bmlt first
    if (bmltwf_changedata[id].submission_type == "reason_change") {
      var meeting_id = bmltwf_changedata[id]["meeting_id"];
      var search_results_address =
        bmltwf_bmlt_server_address + "client_interface/jsonp/?switcher=GetSearchResults&meeting_key=id_bigint&meeting_key_value=" + meeting_id + "&lang_enum=en&&recursive=1&sort_keys=start_time";

      fetchJsonp(search_results_address)
        .then((response) => response.json())
        .then((data) => {
          // fill in all the bmlt stuff
          var item = data[0];
          if (!Object.keys(data).length) {
            var a = {};
            a["responseJSON"] = {};
            a["responseJSON"]["message"] = "Error retrieving BMLT data - meeting possibly removed";
            notice_error(a, "bmltwf-error-message");
          } else {
            // split up the duration so we can use it in the select
            if ("duration_time" in item) {
              var durationarr = item["duration_time"].split(":");
              // hoping we got hours, minutes and seconds here
              if (durationarr.length == 3) {
                $("#quickedit_duration_hours").val(durationarr[0]);
                $("#quickedit_duration_minutes").val(durationarr[1]);
              }
            }

            // split up the format list so we can use it in the select
            if ("format_shared_id_list" in item) {
              item["format_shared_id_list"] = item["format_shared_id_list"].split(",");
            }

            Object.keys(item).forEach((element) => {
              if ($("#quickedit_" + element).length) {
                $("#quickedit_" + element).val(item[element]);
                $("#quickedit_" + element).trigger("change");
              }
            });
            add_highlighted_changes_to_quickedit(bmltwf_changedata[id].changes_requested);
            $("#bmltwf_submission_quickedit_dialog").data("id", id).dialog("open");
          }
        });
    } else if (bmltwf_changedata[id].submission_type == "reason_new") {
      add_highlighted_changes_to_quickedit(bmltwf_changedata[id].changes_requested);
      $("#bmltwf_submission_quickedit_dialog").data("id", id).dialog("open");
    }
  }

  // function clear_notices() {
  //   jQuery(".notice-dismiss").each(function (i, e) {
  //     dismiss_notice(e);
  //   });
  // }

  // default close meeting radio button
  if (bmltwf_default_closed_meetings === "delete") {
    $("#close_delete").prop("checked", true);
  } else {
    $("#close_unpublish").prop("checked", true);
  }

  var formatdata = [];

  // delete hybrid/TC etc
  Object.keys(bmltwf_bmlt_formats).forEach((key) => {
    var key_string = bmltwf_bmlt_formats[key]["key_string"];
    if (!(key_string === "HY" || key_string === "VM" || key_string === "TC")) {
      formatdata.push({ text: "(" + bmltwf_bmlt_formats[key]["key_string"] + ")-" + bmltwf_bmlt_formats[key]["name_string"], id: key });
    }
  });

  $("#quickedit_format_shared_id_list").select2({
    placeholder: "Select from available formats",
    multiple: true,
    width: "100%",
    data: formatdata,
    selectionCssClass: ":all:",
    dropdownParent: $("#bmltwf_submission_quickedit_dialog"),
  });
  $("#quickedit_format_shared_id_list").trigger("change");

  var datatable = $("#dt-submission").DataTable({
    dom: "Bfrtip",
    select: true,
    searching: true,
    order: [[5, "desc"]],
    buttons: [
      {
        name: "approve",
        text: "Approve",
        enabled: false,
        action: function (e, dt, button, config) {
          var id = dt.row(".selected").data()["id"];
          var reason = dt.row(".selected").data()["submission_type"];
          if (reason === "reason_close") {
            // clear text area from before
            $("#bmltwf_submission_approve_close_dialog_textarea").val("");
            $("#bmltwf_submission_approve_close_dialog").data("id", id).dialog("open");
          } else {
            // clear text area from before
            $("#bmltwf_submission_approve_dialog_textarea").val("");
            $("#bmltwf_submission_approve_dialog").data("id", id).dialog("open");
          }
        },
      },
      {
        name: "reject",
        text: "Reject",
        enabled: false,
        action: function (e, dt, button, config) {
          var id = dt.row(".selected").data()["id"];
          // clear text area from before
          $("#bmltwf_submission_reject_dialog_textarea").val("");
          $("#bmltwf_submission_reject_dialog").data("id", id).dialog("open");
        },
      },
      {
        name: "quickedit",
        text: "QuickEdit",
        extend: "selected",
        action: function (e, dt, button, config) {
          var id = dt.row(".selected").data()["id"];
          populate_and_open_quickedit(id);
        },
      },
      {
        name: "delete",
        text: "Delete",
        enabled: bmltwf_datatables_delete_enabled,
        extend: "selected",
        action: function (e, dt, button, config) {
          var id = dt.row(".selected").data()["id"];
          $("#bmltwf_submission_delete_dialog").data("id", id).dialog("open");
        },
      },
    ],
    ajax: {
      url: bmltwf_admin_submissions_rest_url,
      beforeSend: function (xhr) {
        xhr.setRequestHeader("X-WP-Nonce", $("#_wprestnonce").val());
      },
      dataSrc: function (json) {
        bmltwf_changedata = {};
        for (var i = 0, ien = json.length; i < ien; i++) {
          json[i]["changes_requested"]["submission_type"] = json[i]["submission_type"];
          // store the json for us to use in quick editor
          bmltwf_changedata[json[i]["id"]] = json[i];
        }
        return json;
      },
    },
    columns: [
      {
        name: "id",
        data: "id",
      },
      {
        name: "submitter_name",
        data: "submitter_name",
      },
      {
        name: "submitter_email",
        data: "submitter_email",
      },
      {
        name: "service_body_bigint",
        data: "service_body_bigint",
        render: function (data, type, row) {
          return bmltwf_admin_bmltwf_service_bodies[data]["name"];
        },
      },
      {
        name: "changes_requested",
        data: "changes_requested",
        render: function (data, type, row) {
          var summary = "";
          var submission_type = "";
          var namestr = "";
          var original = "";
          switch (data["submission_type"]) {
            case "reason_new":
              submission_type = "New Meeting";
              namestr = data["meeting_name"];
              meeting_day = weekdays[data["weekday_tinyint"]];
              meeting_time = data["start_time"];
              break;
            case "reason_close":
              submission_type = "Close Meeting";
              // console.log(data);
              namestr = data["meeting_name"];
              meeting_day = weekdays[data["weekday_tinyint"]];
              meeting_time = data["start_time"];
              break;
            case "reason_change":
              submission_type = "Modify Meeting";
              namestr = data["original_meeting_name"];
              meeting_day = weekdays[data["original_weekday_tinyint"]];
              meeting_time = data["original_start_time"];
              original = "Original ";
              break;
            default:
              submission_type = data["submission_type"];
          }
          summary = "Submission Type: " + submission_type + "<br>";
          if (namestr !== "") {
            summary += "Meeting Name: " + namestr + "<br>";
          }
          if (meeting_day !== "" && meeting_time != "") {
            summary += original + "Time: " + meeting_day + " " + meeting_time;
          }
          return summary;
        },
      },
      {
        name: "submission_time",
        data: "submission_time",
        render: function (data, type, row) {
          return mysql2localdate(data);
        },
      },
      {
        name: "change_time",
        data: "change_time",
        render: function (data, type, row) {
          if (data === "0000-00-00 00:00:00") {
            return "(no change made)";
          }
          return mysql2localdate(data);
        },
      },
      {
        name: "changed_by",
        data: "changed_by",
      },
      {
        name: "change_made",
        data: "change_made",
        defaultContent: "",
        render: function (data, type, row) {
          if (data === null) {
            return "None - Pending";
          }
          switch (data) {
            case "approved":
              return "Approved";
            case "rejected":
              return "Rejected";
            case "updated":
              return "Updated";
          }
          return data;
        },
      },
      {
        className: "dt-control",
        orderable: false,
        data: null,
        defaultContent: "",
      },
    ],
  });

  $("#dt-submission_wrapper .dt-buttons").append(
    "Filter: <select id='dt-submission-filters'><option value='all'>All</option><option value='pending'>Pending</option><option value='approved'>Approved</option><option value='rejected'>Rejected</option></select>"
  );
  $("#dt-submission-filters").change(function (e) {
    $("#dt-submission").DataTable().draw();
  });

  // filter on column 8
  $.fn.dataTable.ext.search.push(
    function (settings, data, dataIndex) {
      var selectedItem = $('#dt-submission-filters').val()
      var category = data[8];
      if(selectedItem === "all")
      {
        return true;
      }
      if(selectedItem === "pending" &&  category.includes("Pending"))
      {
        return true;
      }
      if(selectedItem === "approved" &&  category.includes("Approved"))
      {
        return true;
      }
      if(selectedItem === "rejected" &&  category.includes("Rejects"))
      {
        return true;
      }
      return false;
    }
  );

  $("#dt-submission")
    .DataTable()
    .on("select deselect", function () {
      var actioned = true;
      // handle optional delete
      $("#dt-submission").DataTable().button("delete:name").enable(bmltwf_datatables_delete_enabled);

      if ($("#dt-submission").DataTable().row({ selected: true }).count()) {
        var change_made = $("#dt-submission").DataTable().row({ selected: true }).data()["change_made"];
        var submission_type = $("#dt-submission").DataTable().row({ selected: true }).data()["submission_type"];
        var actioned = change_made === "approved" || change_made === "rejected";
        var cantquickedit = change_made === "approved" || change_made === "rejected" || submission_type === "reason_close";
        $("#dt-submission").DataTable().button("approve:name").enable(!actioned);
        $("#dt-submission").DataTable().button("reject:name").enable(!actioned);
        $("#dt-submission").DataTable().button("quickedit:name").enable(!cantquickedit);
      } else {
        $("#dt-submission").DataTable().button("approve:name").enable(false);
        $("#dt-submission").DataTable().button("reject:name").enable(false);
        $("#dt-submission").DataTable().button("quickedit:name").enable(false);
      }
    });

  function column(col, key, value) {
    output = '<div class="c' + col + 'k">';
    output += key;
    output += ":</div>";
    output += '<div class="c' + col + 'v">';
    output += value;
    output += "</div>";
    return output;
  }

  // child rows
  function format(rows) {
    // clone the requested info
    d = $.extend(true, {}, rows);

    col_meeting_details = 1;
    col_personal_details = 2;
    col_virtual_meeting_details = 3;
    col_fso_other = 4;

    table = '<div class="header">';
    table += '<div class="cell-hdr h' + col_personal_details + '">Personal Details</div>';
    table += '<div class="cell-hdr h' + col_meeting_details + '">Updated Meeting Details</div>';
    table += '<div class="cell-hdr h' + col_virtual_meeting_details + '">Updated Virtual Meeting Details</div>';
    table += '<div class="cell-hdr h' + col_fso_other + '">FSO Request and Other Info</div>';
    table += '</div><div class="gridbody">';

    for (var key in d) {
      switch (key) {
        case "action_message":
          if (d["action_message"] != "" && d["action_message"] != null) {
            table += column(col_fso_other, "Message to submitter", d[key]);
          }
          break;
        case "submitter_email":
          table += column(col_personal_details, "Submitter Email", d[key]);
          break;
        case "submitter_name":
          table += column(col_personal_details, "Submitter Name", d[key]);
          break;
      }
    }

    c = d["changes_requested"];

    // some special handling for deletion of fields
    for (var key in c) {
      switch (key) {
        case "original_virtual_meeting_additional_info":
          if ((!("virtual_meeting_additional_info" in c) || c["virtual_meeting_additional_info"] === "") && bmltwf_remove_virtual_meeting_details_on_venue_change === "true") {
            d["changes_requested"]["virtual_meeting_additional_info"] = "(deleted)";
          }
          break;
        case "original_phone_meeting_number":
          if ((!("phone_meeting_number" in c) || c["phone_meeting_number"] === "") && bmltwf_remove_virtual_meeting_details_on_venue_change === "true") {
            d["changes_requested"]["phone_meeting_number"] = "(deleted)";
          }
          break;
        case "original_virtual_meeting_link":
          if ((!("virtual_meeting_link" in c) || c["virtual_meeting_link"] === "") && bmltwf_remove_virtual_meeting_details_on_venue_change === "true") {
            d["changes_requested"]["virtual_meeting_link"] = "(deleted)";
          }
          break;
      }
    }

    // fill in the sub menu

    for (var key in c) {
      switch (key) {
        case "meeting_name":
          mname = "Meeting Name (new)";
          if (d["submission_type"] === "reason_close") {
            mname = "Meeting Name";
          }
          table += column(col_meeting_details, mname, c[key]);
          break;
        case "venue_type":
          vtype = venue_types[c[key]];
          if ("original_venue_type" in c) {
            ovtype = venue_types[c["original_venue_type"]];
            table += column(col_meeting_details, "Venue Type", ovtype + " → " + vtype);
          } else {
            table += column(col_meeting_details, "Venue Type", vtype);
          }
          break;
        case "start_time":
          table += column(col_meeting_details, "Start Time", c[key]);
          break;
        case "duration_time":
          var durationarr = d["changes_requested"].duration_time.split(":");
          table += column(col_meeting_details, "Duration", durationarr[0] + "h" + durationarr[1] + "m");
          break;
        case "location_text":
          table += column(col_meeting_details, "Location", c[key]);
          break;
        case "location_street":
          table += column(col_meeting_details, "Street", c[key]);
          break;
        case "location_info":
          table += column(col_meeting_details, "Location Info", c[key]);
          break;
        case "location_municipality":
          table += column(col_meeting_details, "Municipality", c[key]);
          break;
        case "location_province":
          table += column(col_meeting_details, bmltwf_optional_location_province_displayname, c[key]);
          break;
        case "location_sub_province":
          table += column(col_meeting_details, bmltwf_optional_location_sub_province_displayname, c[key]);
          break;
        case "location_nation":
          table += column(col_meeting_details, bmltwf_optional_location_nation_displayname, c[key]);
          break;
        case "location_postal_code_1":
          table += column(col_meeting_details, bmltwf_optional_postcode_displayname, c[key]);
          break;
        case "group_relationship":
          table += column(col_personal_details, "Relationship to Group", c[key]);
          break;
        case "weekday_tinyint":
          table += column(col_meeting_details, "Meeting Day", weekdays[c[key]]);
          break;
        case "starter_kit_postal_address":
          if (c["starter_kit_required"] === "yes") {
            // table += column(col_fso_other, "Starter Kit Postal Address", '<div class="grow-wrap"><textarea disabled onInput="this.parentNode.dataset.replicatedValue = this.value">' + c[key] + '</textarea></div>');
            table += column(col_fso_other, "Starter Kit Postal Address", c[key]);
          }
          break;
        case "additional_info":
          // table += column(col_fso_other, "Additional Info", '<div class="grow-wrap"><textarea disabled onInput="this.parentNode.dataset.replicatedValue = this.value">' + c[key] + '</textarea></div>');
          table += column(col_fso_other, "Additional Info", c[key]);
          break;
        case "other_reason":
          // table += column(col_fso_other, "Other Reason", '<div class="grow-wrap"><textarea disabled onInput="this.parentNode.dataset.replicatedValue = this.value">' + c[key] + '</textarea></div>');
          table += column(col_fso_other, "Other Reason", c[key]);
          break;
        case "contact_number":
          table += column(col_personal_details, "Contact number (confidential)", c[key]);
          break;
        case "add_contact":
          table += column(col_personal_details, "Add contact details to meeting", d["changes_requested"].add_contact === "yes" ? "Yes" : "No");
          break;
        case "virtual_meeting_additional_info":
          table += column(col_virtual_meeting_details, "Virtual Meeting Additional Info", c[key]);
          break;
        case "phone_meeting_number":
          table += column(col_virtual_meeting_details, "Virtual Meeting Phone Details", c[key]);
          break;
        case "virtual_meeting_link":
          table += column(col_virtual_meeting_details, "Virtual Meeting Link", c[key]);
          break;

        case "format_shared_id_list":
          friendlyname = "Meeting Formats";
          // convert the meeting formats to human readable
          friendlydata = "";
          strarr = d["changes_requested"]["format_shared_id_list"].split(",");
          strarr.forEach((element) => {
            friendlydata += "(" + bmltwf_bmlt_formats[element]["key_string"] + ")-" + bmltwf_bmlt_formats[element]["name_string"] + " ";
          });
          table += column(col_meeting_details, "Meeting Formats", friendlydata);

          break;
      }
    }

    table += "</div>";
    return table;
  }

  $("#dt-submission tbody").on("click", "td.dt-control", function () {
    var tr = $(this).closest("tr");
    var row = datatable.row(tr);

    if (row.child.isShown()) {
      // This row is already open - close it
      row.child.hide();
      tr.removeClass("shown");
    } else {
      // Open this row
      row.child(format(row.data())).show();
      tr.addClass("shown");
    }
  });

  function bmltwf_create_generic_modal(dialogid, title, width, maxwidth) {
    $("#" + dialogid).dialog({
      title: title,
      autoOpen: false,
      draggable: false,
      width: width,
      maxWidth: maxwidth,
      modal: true,
      resizable: false,
      closeOnEscape: true,
      position: {
        my: "center",
        at: "center",
        of: window,
      },
      buttons: {
        Ok: function () {
          fn = window[this.id + "_ok"];
          if (typeof fn === "function") fn($(this).data("id"));
        },
        Cancel: function () {
          $(this).dialog("close");
        },
      },
      open: function () {
        var $this = $(this);
        // close dialog by clicking the overlay behind it
        $(".ui-widget-overlay").on("click", function () {
          $this.dialog("close");
        });
      },
      create: function () {
        $(".ui-dialog-titlebar-close").addClass("ui-button");
      },
    });
  }

  function bmltwf_create_quickedit_modal(dialogid, title, width, maxwidth) {
    $("#" + dialogid).dialog({
      title: title,
      classes: { "ui-dialog-content": "quickedit" },
      autoOpen: false,
      draggable: false,
      width: width,
      maxWidth: maxwidth,
      modal: true,
      resizable: false,
      closeOnEscape: true,
      position: {
        my: "center",
        at: "center",
        of: window,
      },
      buttons: [
        {
          text: "Check Geolocate",
          click: function () {
            geolocate_handler($(this).data("id"));
          },
          disabled: !bmltwf_auto_geocoding_enabled,
        },
        {
          text: "Save",
          click: function () {
            save_handler($(this).data("id"));
          },
        },
        {
          text: "Cancel",
          click: function () {
            $(this).dialog("close");
          },
        },
      ],
      open: function () {
        var $this = $(this);
        // close dialog by clicking the overlay behind it
        $(".ui-widget-overlay").on("click", function () {
          $this.dialog("close");
        });
      },
      create: function () {
        $(".ui-dialog-titlebar-close").addClass("ui-button");
      },
    });
  }

  bmltwf_create_generic_modal("bmltwf_submission_delete_dialog", "Delete Submission", "auto", "auto");
  bmltwf_create_generic_modal("bmltwf_submission_approve_dialog", "Approve Submission", "auto", "auto");
  bmltwf_create_generic_modal("bmltwf_submission_approve_close_dialog", "Approve Submission", "auto", "auto");
  bmltwf_create_generic_modal("bmltwf_submission_reject_dialog", "Reject Submission", "auto", "auto");
  bmltwf_create_quickedit_modal("bmltwf_submission_quickedit_dialog", "Submission QuickEdit", "auto", "auto");

  bmltwf_submission_approve_dialog_ok = function (id) {
    clear_notices();
    generic_approve_handler(id, "POST", "/approve", "bmltwf_submission_approve");
  };

  bmltwf_submission_approve_close_dialog_ok = function (id) {
    clear_notices();
    generic_approve_handler(id, "POST", "/approve", "bmltwf_submission_approve_close");
  };

  bmltwf_submission_reject_dialog_ok = function (id) {
    clear_notices();
    generic_approve_handler(id, "POST", "/reject", "bmltwf_submission_reject");
  };
  bmltwf_submission_delete_dialog_ok = function (id) {
    clear_notices();
    generic_approve_handler(id, "DELETE", "", "bmltwf_submission_delete");
  };

  function generic_approve_handler(id, action, url, slug) {
    parameters = {};
    if ($("#" + slug + "_dialog_textarea").length) {
      var action_message = $("#" + slug + "_dialog_textarea")
        .val()
        .trim();
      if (action_message !== "") {
        parameters["action_message"] = action_message;
      }
    }

    // delete/unpublish handling on the approve+close dialog
    if (slug === "bmltwf_submission_approve_close") {
      option = $("#" + slug + '_dialog input[name="close_action"]:checked').attr("id");
      if (option === "close_delete") {
        parameters["delete"] = true;
      } else {
        parameters["delete"] = false;
      }
    }

    $.ajax({
      url: bmltwf_admin_submissions_rest_url + id + url,
      type: action,
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(parameters),
      beforeSend: function (xhr) {
        xhr.setRequestHeader("X-WP-Nonce", $("#_wprestnonce").val());
      },
    })
      .done(function (response) {
        notice_success(response, "bmltwf-error-message");
        // reload the table to pick up any changes
        $("#dt-submission").DataTable().ajax.reload();
        // reset the buttons correctly
        $("#dt-submission").DataTable().rows().deselect();
      })
      .fail(function (xhr) {
        notice_error(xhr, "bmltwf-error-message");
      });
    $("#" + slug + "_dialog").dialog("close");
  }

  function geolocate_handler(id) {
    var locfields = ["location_street", "location_municipality", "location_province", "location_postal_code_1", "location_sub_province", "location_nation"];
    var locdata = [];

    locfields.forEach((item, i) => {
      var el = "#quickedit_" + item;
      var val = $(el).val();
      if (val != "") {
        locdata.push(val);
      }
    });

    var address = "address=" + locdata.join(",");

    $.ajax({
      url: bmltwf_bmltserver_geolocate_rest_url,
      type: "GET",
      dataType: "json",
      contentType: "application/json",
      data: encodeURI(address),
      beforeSend: function (xhr) {
        xhr.setRequestHeader("X-WP-Nonce", $("#_wprestnonce").val());
      },
    })
      .done(function (response) {
        $("#quickedit_latitude").val(response["latitude"]);
        $("#quickedit_longitude").val(response["longitude"]);
        notice_success(response, "bmltwf-quickedit-error-message");
      })
      .fail(function (xhr) {
        notice_error(xhr, "bmltwf-quickedit-error-message");
      });
  }

  function save_handler(id) {
    parameters = {};
    changes_requested = {};
    quickedit_changes_requested = {};

    clear_notices();

    // pull out all the changed elements
    $(".bmltwf-changed").each(function () {
      if ($(this).is("textarea,select,input")) {
        var short_id = $(this).attr("id").replace("quickedit_", "");
        // turn the format list into a comma seperated array
        if (short_id === "format_shared_id_list") {
          quickedit_changes_requested[short_id] = $(this).val().join(",");
        }
        // reconstruct our duration from the select list
        else if ((short_id === "duration_hours")||(short_id === "duration_minutes")) {
          // add duration entirely if either minutes or hours have changed
          quickedit_changes_requested["duration_time"] = $("#quickedit_duration_hours").val() + ":" + $("#quickedit_duration_minutes").val() + ":00";
        } else if (short_id === "virtual_meeting_additional_info" || short_id === "phone_meeting_number" || short_id === "virtual_meeting_link") {
          if ($(this).val() === "(deleted)") {
            delete quickedit_changes_requested[short_id];
          }
        } else {
          quickedit_changes_requested[short_id] = $(this).val();
        }
      }
    });

    parameters["changes_requested"] = quickedit_changes_requested;

    $.ajax({
      url: bmltwf_admin_submissions_rest_url + id,
      type: "PATCH",
      dataType: "json",
      contentType: "application/json",
      data: JSON.stringify(parameters),
      beforeSend: function (xhr) {
        xhr.setRequestHeader("X-WP-Nonce", $("#_wprestnonce").val());
      },
    })
      .done(function (response) {
        notice_success(response, "bmltwf-error-message");

        // reload the table to pick up any changes
        $("#dt-submission").DataTable().ajax.reload();
        // reset the buttons correctly
        $("#dt-submission").DataTable().rows().deselect();
      })
      .fail(function (xhr) {
        notice_error(xhr, "bmltwf-error-message");
      });
    $("#bmltwf_submission_quickedit_dialog").dialog("close");
  }
});
