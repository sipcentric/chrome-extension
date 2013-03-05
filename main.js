// Show the welcome block and hide menu
function showWelcome() {
  hide();
  hideMenu();
  $('#blockWelcome').fadeIn(400);

  // This stops any forms from being submitted
  return false;
}

// Show the dialer block
function showDialer() {
  hide();
  showMenu();
  numbersAutoComplete("#dialerNumber", true, true);
  $('#blockDialer').fadeIn(400);
  $("#menuDialer").addClass("active");

  // Make the number text field focused
  $("input:text:visible:first").focus();
  $("#dialerNumber").attr('maxlength','15');

  // Remove any error classes that may there
  $('#dialerNumberGroup').removeClass('error');

  // Add some useful info for the user
  $('#dialerInfo').text('This will dial from extension ' + localStorage[localStorage['loginUsername'] + '_prefMainExtensionShort'] +'.');

  // Lets see if we have any URL params
  // As the dialer screen is the default one we also use it to catch URL params for other blocks!
  // This would be best placed somewhere else, but for now it works here
  var getNumber = getUrlParams();
  if (getNumber.number) {
    // If we get a number then we put it in the text field
    $('#dialerNumber').val(getNumber.number);
  } else if (getNumber.sms) {
    // If we got a sms number we do the same as above but send the user to the messages block
    $('#smsNumber').val(getNumber.sms);
    showMessages();
  } else if (getNumber.contact) {
    // This will pull up a edit contact modal in the contacts block
    showBook();
    showContact(getNumber.contact);
  }

  return false;
}

function numbersAutoComplete(element, extensions, contacts) {
  var autoComplete = [];

  if (extensions == true) { try {
    autoComplete = JSON.parse(localStorage[localStorage['loginUsername'] + '_localExtensions']);
  } catch (err) { console.log('No extensions'); }}

  if (contacts == true) { try {
    var contacts = JSON.parse(localStorage[localStorage['loginUsername'] + '_contacts']);
    for (var item in contacts) {
      var obj = { label: contacts[item].name + ' - ' + contacts[item].phoneNumber, value: contacts[item].phoneNumber, category: "Company Contacts" };
      autoComplete.push(obj);
    }} catch (err) { console.log('No contacts'); }}

  $(element).catcomplete({ source: autoComplete });
}

function showMessages() {
  hide();
  showMenu();
  numbersAutoComplete("#smsNumber", false, true);

  $('#blockMessages').fadeIn(400);
  $("#menuMessages").addClass("active");

  // Setup some block attributes
  $("#smsMessage").attr('maxlength','140');
  $("#smsNumber").attr('maxlength','15');
  $("#smsFrom").attr('maxlength','11');

  // Remove any CSS classes that may be left over
  $('#smsNumberGroup').removeClass('error');
  $('#smsFromGroup').removeClass('error');
  $('#smsMessageGroup').removeClass('error');

  // Set the default SMS from text, we use the company name, limited to 10 chars
  if (localStorage[localStorage['loginUsername'] + '_smsFrom'] != null) {
    $("#smsFrom").val(localStorage[localStorage['loginUsername'] + '_smsFrom']);
  } else {
    var company = localStorage[localStorage['loginUsername'] + '_companyName'];
    company = company.replace(/[^\w]/gi, '').substring(0, 10);
    $("#smsFrom").val(company);
  }

  // At some point we will allow the user to send multiple messages which will increase the counter, for now this is fixed to one
  var smsCount = "1";
  $('#smsCost').text('This will send ' + smsCount + ' message.');

  return false;
}

function showLogin() {
  hide();
  hideMenu();
  $('#blockLogin').fadeIn(400);

  // If there is already a saved username we fill in the field with the username and then set the focus on the password field
  if ( localStorage["loginUsername"] != null ) {
    $('#username').val(localStorage["loginUsername"]);
    $('#password').focus();
  } else {
    $('input:visible:enabled:first').focus();
  }
  return false;
}

function showBook() {
  hide();
  showMenu();
  $("#menuBook").addClass("active");
  $('#blockBook').fadeIn(400);
  // This will fetch the contacts if we don't already have them
  displayContacts();
  return false; 
}

function showRecent() {
  hide();
  showMenu();
  $('#blockRecent').fadeIn(400);

  displayRecent();
  return false; 
}


function hideMenu() {
  $('#mainMenu').hide();
  $('#subMenu').hide();
  return false;
}

function showMenu() {
  $('#mainMenu').show();
  $('#subMenu').show();
  setBanner();
}

function showSettings(settings) {
  hide();
  showMenu();

  // If you pass a 0 to this function we will only show the user prefs and not the global settings
  // This is used on the inital setup to force users to pick an extension
  if (settings === 0) {
    $('#settings').hide();
  } else {
    $('#settings').show();
  }

  // Show the block and update the menu
  $('#blockSettings').fadeIn(400);
  $("#menuSettings").addClass("active");
  
  // Get all extensions on account
  getExtensions();
  // Get account infomation like company name etc
  getInfo();
  // Lets restore all the user settings
  restoreSettings();
  return false;
}

// Function used to get params from the URL
function getUrlParams() {
    var params = {};
    window.location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi,
function (str, key, value) {
    params[key] = value;
});
    return params;
}

// This function hides eveything, ready for new blocks to be displayed
function hide() {
  $('#blockLogin').hide();
  $('#blockSettings').hide();
  $('#blockDialer').hide();
  $('#blockMessages').hide();
  $('#blockWelcome').hide();
  $('#blockBook').hide();
  $('#blockRecent').hide();

  // Reset menu active classes
  $("#menuDialer").removeClass("active");
  $("#menuMessages").removeClass("active");
  $("#menuSettings").removeClass("active");
  $("#menuBook").removeClass("active");
  return false;
}

// Gets settings from local storage and displays the values back to the user in the settings block
function restoreSettings() {
  // Set the current extension if one is set
  if ( localStorage[localStorage['loginUsername'] + '_prefMainExtension'] != null) {
  	$("select option[value='" + localStorage[localStorage['loginUsername'] + '_prefMainExtension'] + "']").attr("selected","selected");
  }

  // Check if the clicable numbers feature is enabled, then set the relevent buttons
  if ( localStorage[localStorage['loginUsername'] + '_prefEnableClickable'] == 1 ) {
    $('#clickableOn').addClass('btn-info');
    $('#clickableOff').removeClass('btn-info');
  } else {
    $('#clickableOff').addClass('btn-info');
    $('#clickableOn').removeClass('btn-info');
  }
}

// Saves users settings on the settings block
function saveSettings() {
  // User must set an extension before they can save.
	if ( $('#extensions').val() != "notset" ) {
    localStorage[localStorage['loginUsername'] + '_prefMainExtension'] = $('#extensions').val();
    localStorage[localStorage['loginUsername'] + '_prefMainExtensionShort'] = localStorage[localStorage['loginUsername'] + '_' + $('#extensions').val()]
    // Set up is done, so we set the _loginSetup value to done
    localStorage[localStorage['loginUsername'] + "_loginSetup"] = 'done';
    showAlert("alert-info", "Settings Saved!", "1000");
    // This takes the user back to dialer after they have saved there settings
    setTimeout(function(){ showDialer(); },1500);
	} else {
    showAlert("alert-error", "Please select an extension!");
  }
  return false;
}

// Lets try and login the user on the login block
function login() {
  // We won't try and do the login if the login button is set to disabled
  if ($('#login.disabled').length == false) {
    // Get values from form
    var username = $('#username').val();
    var password = $('#password').val();
    // Add the disabled state to stop users from loging in again while we are checking them
    $("#login").addClass("disabled");

    // Start http request
    // We can use this URL to check if the auth is valid
    var url = 'http://pbx.sipcentric.com/api/v1/customers/me';
    var xmlhttp = new XMLHttpRequest();
    // This opens the request with username and password
    xmlhttp.open("HEAD", url, false, username, password);

    // We wait untill something happens
    xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState==4) {
        console.log(xmlhttp.getAllResponseHeaders())
        // If we get a 200 that means the credentials are correct
        if (xmlhttp.status === 200) {
          console.log("Password OK! :D");
          // So we save the username and password as they are correct
          storeLogin(username, password);

          // If they have completed the inital setup for that user we take them directly to the dialer block
          if ( localStorage[localStorage['loginUsername'] + "_loginSetup"] == "done") {
            showDialer();
            getContacts(1);
          } else {
            // If they have not we force them to setup their settings
            localStorage[localStorage['loginUsername'] + '_prefEnableClickable'] = 1;
            showSettings(0);
            // We hide the menu to prevent the user from clicking off
            hideMenu();
            getContacts(1);
          }
        } else {
          // If we get anything apart from a 200 we assume the login was incorrect
          console.log("Auth error! (Or some other error)");
          showAlert("alert-error", "Check username and password!");
          // As they need to try again we remove the diabled class on the login button
          setTimeout(function(){ $("#login").removeClass("disabled"); },1000);
          $("#login").bind('click');
        }
      }
    }
    // This sends the actuall request to the server, but we are not posting any data so we send null
    xmlhttp.send(null);
  }
  return false;
}

function storeLogin(username, password) {
  // Store login credentials
  localStorage['loginUsername'] = username;
  localStorage['loginPassword'] = password;

  // Update valid login
  localStorage['loginValid'] = 'true';
}

function logout() {
  // Change login valid to null to force the user to login when they next load the extension
  localStorage['loginValid'] = null;
  // Wipe the password from the localstorage, but we keep the username as we need it when they login again
  localStorage['loginPassword'] = null;

  // We send another request to force Chrome to not cache the username and password otherwise it remembers it after logoff!
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("HEAD", "http://pbx.sipcentric.com/api/v1/", false, localStorage["loginUsername"], null);
  xmlhttp.send(null);

  // Let the user know and force the window to close or things will go wrong!
  showAlert("alert-info", "Logged Out!");
  // Set time out is used so the user sees the logged out message
  setTimeout(function(){ window.close(); },2000);

}

// This is called when the user clicks the reset button on the settings block
function resetSettings() {
  // We first change the button to btn-danger and change the text to make sure the user wants to do this
  if ($('#reset.btn-danger').length) {
    // Clears localstorage
    localStorage.clear();
    // Quit the window as we don't need it anymore
    setTimeout(function(){ window.close(); },500);
  } else {
    $('#reset').addClass('btn-danger');
    $('#resetInfo').addClass('text-error');
    $('#resetInfo').text('Are you sure!?');

    // If they don't click the button within 4 seconds we reset back to normal state
    setTimeout(function(){
      $('#reset').removeClass('btn-danger');
      $('#resetInfo').removeClass('text-error');
      $('#resetInfo').text('This will reset all data!');
    },4000);
  }
}

function showAlert(type, message, time) {
  if (time == null) {
    // If message time is not set we set a default of 2 seconds
    time = 2000;
  }
  $('#notification').text("");
  $('#notification').fadeIn(400);
  $('#notification').append($("<div class='alert " + type + " fade in'>" + message + "</div>"));
  setTimeout(function(){ $('#notification').fadeOut(400); },time);
}

// This alert function is the same as above but only for the edit contact modal
function showContactAlert(type, message, time) {
  if (time == null) {
    time = 2000;
  }
  $('#contactModalNotification').text("");
  $('#contactModalNotification').fadeIn(400);
  $('#contactModalNotification').append($("<div class='alert " + type + " fade in'>" + message + "</div>"));
  setTimeout(function(){ $('#contactModalNotification').fadeOut(400); },time);
  return false;
}

// This is called when the user clicks on the dial button in the dial block
function dial() {
  // We check the diabled status of the button first to stop lots of requests to api and extension
  if ($('#dial.disabled').length == false) {
    $("#dial").addClass("disabled");
    // We let the user click the button again after 3 seconds
    setTimeout(function(){ $("#dial").removeClass("disabled"); },3000);
    // Get number from form
    var call = $('#dialerNumber').val();

    // We send the number to the background page (background.js) as we use this in some other places as well
    chrome.extension.sendMessage({number: call}, function(response) {
      // Status is the numeric code of the request
      status = response[0];
      // The mesage contains any validation errors etc
      message = response[1];

      // Remove the error class on the number field just in case it was left over
      $('#dialerNumberGroup').removeClass('error');

      // Call was successful if we get a 200, a 201 status is if something was created as well like a live call status, at the moment the API does not have this
      if (status == 200 || status == 201) {
        // Tell the user they should pick up there phone
        showAlert("alert-info", "Pickup your extension...", "6000");
      } else if (status == 401) {
        // We get a 401 if there was a problem with auth, and force the user to login again
        showAlert("alert-error", "<small><strong>401!</strong> Auth Denied!</small>");
        setTimeout(function(){ showLogin(); },3000);
      } else if (status == 400) {
        // If we get a 400 it is most likely a validation error so we display a message to the user
        showAlert("alert-error", "<small><strong>Error!</strong> " + message.message + "</small>");

        // If we have validation errors, select the field that contains the error to alert the user
        for (var i = 0; i < message.validationErrors.length; i++) {
          var item = message.validationErrors[i].field;
          if (item == 'to') {
            $('#dialerNumberGroup').addClass('error');
          }
        }

      } else {
        // A catch all to handle any other problems
        showAlert("alert-error", "<small><strong>Oh snap!</strong>" + status + " Something went wrong!</small>");
      }
    });
  }
  return false;
}

function smsSend() {
  // We check the diabled status of the button first to stop lots of requests to api and extra sent SMS's
  if ($('#smsSend.disabled').length == false) {
    $("#smsSend").addClass("disabled");
    setTimeout(function(){ $("#smsSend").removeClass("disabled"); },4000);

    // Get values from form
    var to = $('#smsNumber').val();
    var message = $('#smsMessage').val();
    var from = $('#smsFrom').val();

    error = null;

    $('#smsNumberGroup').removeClass('error');
    $('#smsFromGroup').removeClass('error');
    $('#smsMessageGroup').removeClass('error');

    if (to == "") {
      $('#smsNumberGroup').addClass('error');
      showAlert("alert-error", "To empty!");
      error = true;
    } else if (from == "") {
      $('#smsFromGroup').addClass('error');
      showAlert("alert-error", "From empty!");
      error = true;
    } else if (message == "") {
      $('#smsMessageGroup').addClass('error');
      showAlert("alert-error", "Message empty!");
      error = true;
    }
    
    // Send request to background page, just like the dial request, but with more values
    if (error != true) {
      chrome.extension.sendMessage({sms: to, message: message, from: from}, function(response) {
        status = response[0];
        message = response[1];

        if (status == 200 || status == 201) {
          showAlert("alert-info", "SMS Message sent");
          $('#smsNumber').val("");
          $('#smsMessage').val("");
          $('#smsNumber').focus();

          localStorage[localStorage['loginUsername'] + '_smsFrom'] = from;

          // _gaq.push(['_trackEvent', 'SMS', 'Successful', localStorage[localStorage['loginUsername'] + '_companyName']]);

        } else if (status == 401) {
          showAlert("alert-error", "<strong>401!</strong> Auth Denied!");
          setTimeout(function(){ showLogin(); },3000);
        } else if (status == 400) {
          showAlert("alert-error", "<small><strong>Error!</strong> " + message.message + "</small>");
          // _gaq.push(['_trackEvent', 'SMS', '400', localStorage[localStorage['loginUsername'] + '_companyName']]);

          for (var i = 0; i < message.validationErrors.length; i++) {
            var item = message.validationErrors[i].field;
            console.log(item);
            if (item == 'to') {
              $('#smsNumberGroup').addClass('error');
            }
            if (item == 'from') {
              $('#smsFromGroup').addClass('error');
            }
            if (item == 'message') {
              $('#smsMessageGroup').addClass('error');
            }
          }
        } else {
          showAlert("alert-error", "<strong>Oh snap!</strong> Something went wrong!");
          // _gaq.push(['_trackEvent', 'SMS', 'Error', localStorage[localStorage['loginUsername'] + '_companyName']]);
        }
      });
    }
  }
  return false;
}

// Lets get all extensions the user can set
function getExtensions() {
  // Set up a new array to store the extensions
  var localExtensions = [];

  // Remove any existing options
  $('#extensions').find('option').remove();
  // Add the default "Extension" option
  $('#extensions').append($("<option></option>").attr("value","notset").text("Extension"));

  // Set up request the get extensions
  var endpoint = 'http://pbx.sipcentric.com/api/v1/customers/me/endpoints?type=phone';
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", endpoint, false, localStorage["loginUsername"], localStorage["loginPassword"]);
  
  xmlhttp.onreadystatechange=function() {
    if (xmlhttp.readyState==4) {
      console.log(xmlhttp.getAllResponseHeaders())
      if (xmlhttp.status === 200) {
 				obj = JSON.parse(xmlhttp.responseText);
        // Cycle the items and add them as options
 				for (var item in obj.items) {
          // Add the shortnumber and name to localExtensions
          lable = obj.items[item].name + ' - ' + obj.items[item].shortNumber;
          value = obj.items[item].shortNumber;
          localExtensions.push({label: lable, value: value, category: "Extensions"});

          localStorage[localStorage['loginUsername'] + '_' + obj.items[item].uri] = obj.items[item].shortNumber;
					$('#extensions')
        	.append($("<option></option>")
        	.attr("value",obj.items[item].uri)
        	.text(obj.items[item].shortNumber + " - " + obj.items[item].name));
				}
        // Store the names and short numbers in localstorage
        localStorage[localStorage['loginUsername'] + '_localExtensions'] = JSON.stringify(localExtensions);
      } else {
        // Something went wrong
        console.log("Getting extensions failed :(");
      }
    }
  }
  xmlhttp.send(null);

  return false;
}

// Not used anywhere yet, will allow a loading to display on slow http requests
function httpLoading(state) {
  if (state == true) {
    timeout = setTimeout(function(){ $('#loading').modal('show'); },1000);
  } else if (state == false) {
    clearTimeout(timeout);
    setTimeout(function(){ $('#loading').modal('hide'); },1000);
  }
}

function displayRecent() {
  console.log('Display recent');
  getRecent();
}

function getRecent() {

  // Currently gets the last 20 COMPANY calls then filters down to ones relevant to the extension only.

  url = "http://pbx.sipcentric.com/api/v1/customers/me/calls?includeLocal=true&pageSize=20";
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", url, true, localStorage["loginUsername"], localStorage["loginPassword"]);
  xmlhttp.onreadystatechange=function() {
    if (xmlhttp.readyState == 4) {
      if (xmlhttp.status === 200) {
        obj = JSON.parse(xmlhttp.responseText);
        console.log(obj);

        $("#tableRecent tr").remove();
        for (var item in obj.items) {
          date = new Date(obj.items[item].callStarted);
          from = obj.items[item].from.replace(/.*\<|\>/gi,'');;
          to = obj.items[item].to.replace(/.*\<|\>/gi,'');;
          status = obj.items[item].outcome;
          
          if ( obj.items[item].links.recordings ) {
            recording = obj.items[item].links.recordings;
            console.log(recording);
          } else {
            console.log('No recording');
          }          

          if (status == "answered") {
            status = '<span class="label label-info right">Answered</span>';
          } else if (status == "busy") {
            status = '<span class="label right">Busy</span>';
          } else if (status == "no-answer") {
            status = '<span class="label right">No Answer</span>';
          } else if (status == "failed") {
            status = '<span class="label label-important right">Failed</span>';
          } else {
            status = '<span class="label right">' + status + '</span>';
          }

          if (from != localStorage[localStorage['loginUsername'] + '_prefMainExtensionShort']) {
            from = '<a class="mutedLink" href="?number=' + from + '">' + from + '</a>';
          }
          if (to != localStorage[localStorage['loginUsername'] + '_prefMainExtensionShort']) {
            to = '<a class="mutedLink" href="?number=' + to + '">' + to + '</a>';
          }

          if (to == localStorage[localStorage['loginUsername'] + '_prefMainExtensionShort'] || from == localStorage[localStorage['loginUsername'] + '_prefMainExtensionShort']) {
            $('#tableRecent').append('<tr><td><small>' + from + ' <i class="icon-arrow-right"></i> ' + to + '<br /><span class="muted">' + moment(date).format('HH:mm ddd Do') + '</span>' + status + '</small></td></tr>');

          }
        }
      }
    }
  }
  xmlhttp.send(null);

}

function displayContacts(force) {

  getContacts(force);
  $("#tableContacts tr").remove();

  if (localStorage[localStorage['loginUsername'] + '_contactsTotal'] != null) {
    $('#contactCount').text(localStorage[localStorage['loginUsername'] + '_contactsTotal']);
  }

  if (localStorage[localStorage['loginUsername'] + '_contacts'] != "") {
    contacts = JSON.parse(localStorage[localStorage['loginUsername'] + '_contacts']);
    for (i=0; i < contacts.length; i++) {
      var name = contacts[i].name;
      var phoneNumber = contacts[i].phoneNumber;
      var speedDial = contacts[i].speedDial;
      var uri = contacts[i].uri;

      if (speedDial != null) {
        $('#tableContacts').append('<tr><td><small>' + name + '<br /><a href="?number=' + phoneNumber + '">' + phoneNumber + '</a><span class="muted"> *0' + speedDial + '</span></small></td><td><a href="?contact=' + uri + '" class="btn btn-mini pull-right" type="button"><i class="icon-pencil"></i></a><a id="smsSpacer" href="?sms=' + phoneNumber + '" class="btn btn-mini pull-right" type="button"><i class="icon-envelope"></i></a></td></tr>');
      } else {
        $('#tableContacts').append('<tr><td><small>' + name + '<br /><a href="?number=' + phoneNumber + '">' + phoneNumber + '</a></small></td><td><a href="?contact=' + uri + '" class="btn btn-mini pull-right" type="button"><i class="icon-pencil"></i></a><a id="smsSpacer" href="?sms=' + phoneNumber + '" class="btn btn-mini pull-right" type="button"><i class="icon-envelope"></i></a></td></tr>');
      }
    }
  } else {
    name = 'Sipcentric';
    phoneNumber = '01212854400';
    $('#tableContacts').append('<tr><td><small>' + name + '<br /><a href="?number=' + phoneNumber + '">' + phoneNumber + '</a></small></td><td><a href="?sms=' + phoneNumber + '" class="btn btn-mini pull-right" type="button"><i class="icon-envelope"></i></a></td></tr>');
  }
}

function getContacts(force) {

  var contactsLastUpdate = localStorage[localStorage['loginUsername'] + '_contactsLastUpdate'];
  var epoc = new Date().getTime() / 1000;
  if (contactsLastUpdate == null) { contactsLastUpdate = 0; }
  var limit = parseFloat(contactsLastUpdate) + 150;

  if (limit == null) {
    limit = 0;
  }
  if (limit < epoc || force == 1) {
    $('#contactsRefresh').addClass('disabled');



    setTimeout(function(){ $('#contactsRefresh').removeClass('disabled'); },4000);
    contacts = [];
    url = "http://pbx.sipcentric.com/api/v1/customers/me/phonebook?pageSize=200&page=1";
    getContactsPage(url);
    storeContacts();
  }
}

function getContactsPage(url) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", url, false, localStorage["loginUsername"], localStorage["loginPassword"]);
  xmlhttp.onreadystatechange=function() {
    if (xmlhttp.readyState == 4) {
      if (xmlhttp.status === 200) {
        obj = JSON.parse(xmlhttp.responseText);
        localStorage[localStorage['loginUsername'] + '_contactsTotal'] = obj.totalItems;
        contacts.push.apply(contacts, obj.items);
        
        if (obj.nextPage) {
          url = obj.nextPage;
          getContactsPage(url);
        }
      }
    }
  }
  xmlhttp.send(null);
}

function storeContacts() {
  if (JSON.stringify(contacts) == "[]") {
    localStorage[localStorage['loginUsername'] + '_contacts'] = "";
  } else {
    localStorage[localStorage['loginUsername'] + '_contacts'] = JSON.stringify(contacts);
  }
  localStorage[localStorage['loginUsername'] + '_contactsLastUpdate'] = new Date().getTime() / 1000;
}

function showContact(uri) {
  localStorage['currentContactUri'] = uri;

  $('#contactModalBanner').text('Add Contact');
  $('#contactModal').modal('show');

  $('#contactModalSave').show();
  $('#contactModalDelete').hide();
  $('#contactModalUpdate').hide();

  $('#contactEditNameGroup').removeClass('error');
  $('#contactEditNumberGroup').removeClass('error');
  $('#contactEditSpeedDialGroup').removeClass('error');
  $('#contactEditName').val('');
  $('#contactEditNumber').val('');
  $('#contactEditSpeedDial').val('');

  if (uri != "new") {
    
    $('#contactModalBanner').text('Edit Contact');

    $('#contactModalSave').hide();
    $('#contactModalDelete').show();
    $('#contactModalUpdate').show();

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", uri, true, localStorage["loginUsername"], localStorage["loginPassword"]);
    xmlhttp.onreadystatechange=function() {
      if (xmlhttp.readyState == 4) {
        if (xmlhttp.status === 200) {
          obj = JSON.parse(xmlhttp.responseText);
          $('#contactEditName').val(obj.name);
          $('#contactEditNumber').val(obj.phoneNumber);
          $('#contactEditSpeedDial').val(obj.speedDial);
        }
      }
    }
    xmlhttp.send(null);
  }
}

function hideContact() {
  $('#contactModal').modal('hide');
}

function isNumber (o) {
  return ! isNaN (o-0);
}

function saveContact() {
  editContact("POST");
}

function updateContact() {
  var uri = localStorage['currentContactUri'];
  editContact("PUT", uri);
}

function deleteContact() {
  var uri = localStorage['currentContactUri'];
  editContact("DELETE", uri);
}

function editContact(method, uri) {
  var name = $('#contactEditName').val();
  var number = $('#contactEditNumber').val();
  var speedDialRaw = $('#contactEditSpeedDial').val();
  
  if (method == "POST") {
    uri = 'http://pbx.sipcentric.com/api/v1/customers/me/phonebook';
  }

  if (speedDialRaw != null) {
    if (isNumber(speedDialRaw)) {
      var speedDial = parseInt(speedDialRaw);
    } else {
      showContactAlert("alert-error", "<small><strong>Error!</strong> " + "Speed dial must be three digits or less!" + "</small>", 4000);
      return false;
    }
  }

  if (method == "POST") {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open(method, uri, false, localStorage["loginUsername"], localStorage["loginPassword"]);
    xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlhttp.send(JSON.stringify({"type": "phonebookentry","name": name,"phoneNumber": number,"speedDial": speedDial}));

    var status = xmlhttp.status;

    if (status == 200 || status == 201) {
        hideContact();
        showAlert("alert-info", "<small>Contact saved!</small>");
        displayContacts(1);
      } else if (status == 401) {
        hideContact();
        showAlert("alert-error", "<small><strong>401!</strong> Auth Denied!</small>");
        setTimeout(function(){ showLogin(); },3000);
      } else if (status == 400) {
        if (xmlhttp.responseText) { 
          var message;
          message = JSON.parse(xmlhttp.responseText);

          showContactAlert("alert-error", "<small><strong>Error!</strong> " + message.message + "</small>", 4000);

          for (var i = 0; i < message.validationErrors.length; i++) {
            var item = message.validationErrors[i].field;
            if (item == 'phoneNumber') {
              $('#contactEditNumberGroup').addClass('error');
            }
            if (item == 'speedDial') {
              $('#contactSpeedDialGroup').addClass('error');
            }
          }
        }

      } else {
        showContactAlert("alert-error", "<small><strong>Oh snap!</strong>" + status + " Something went wrong!</small>");
      }

  } else if (method == "PUT") {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open(method, uri, false, localStorage["loginUsername"], localStorage["loginPassword"]);
    xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlhttp.send(JSON.stringify({"type": "phonebookentry","name": name,"phoneNumber": number,"speedDial": speedDial}));

    var status = xmlhttp.status;

    if (status == 200 || status == 201) {
        hideContact();
        showAlert("alert-info", "<small>Contact updated!</small>");
        displayContacts(1);
      } else if (status == 401) {
        hideContact();
        showAlert("alert-error", "<small><strong>401!</strong> Auth Denied!</small>");
        setTimeout(function(){ showLogin(); },3000);
      } else if (status == 400) {
        if (xmlhttp.responseText) { 
          var message;
          message = JSON.parse(xmlhttp.responseText);

          showContactAlert("alert-error", "<small><strong>Error!</strong> " + message.message + "</small>", 4000);

          for (var i = 0; i < message.validationErrors.length; i++) {
            var item = message.validationErrors[i].field;
            if (item == 'phoneNumber') {
              $('#contactEditNumberGroup').addClass('error');
            }
            if (item == 'speedDial') {
              $('#contactSpeedDialGroup').addClass('error');
            }
          }
        }

      } else {
        showContactAlert("alert-error", "<small><strong>Oh snap!</strong>" + status + " Something went wrong!</small>");
      }

  } else if (method == "DELETE") {

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open(method, uri, false, localStorage["loginUsername"], localStorage["loginPassword"]);
    xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlhttp.send(null);

    var status = xmlhttp.status;

    if (status == 204) {
        hideContact();
        showAlert("alert-info", "<small>Contact removed!</small>");
        displayContacts(1);
      } else if (status == 401) {
        hideContact();
        showAlert("alert-error", "<small><strong>401!</strong> Auth Denied!</small>");
        setTimeout(function(){ showLogin(); },3000);
      } else {
        showContactAlert("alert-error", "<small><strong>Oh snap!</strong>" + status + " Something went wrong!</small>");
        displayContacts(1);
      }
  }
}

function clickableOn() {
  localStorage[localStorage['loginUsername'] + '_prefEnableClickable'] = 1;
  $('#clickableOn').addClass('btn-info');
  $('#clickableOff').removeClass('btn-info');
}

function clickableOff() {
  localStorage[localStorage['loginUsername'] + '_prefEnableClickable'] = null;
  $('#clickableOff').addClass('btn-info');
  $('#clickableOn').removeClass('btn-info');
}

function getInfo() {
  var endpoint = 'http://pbx.sipcentric.com/api/v1/customers/me/';
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", endpoint, false, localStorage["loginUsername"], localStorage["loginPassword"]);
  
  xmlhttp.onreadystatechange=function() {
    if (xmlhttp.readyState==4) {
      if (xmlhttp.status === 200) {
        obj = JSON.parse(xmlhttp.responseText);
        localStorage[localStorage['loginUsername'] + "_companyName"] = obj.company;
      }
    }
  }
  xmlhttp.send(null);
  return false;
}

function setBanner() {
  if (localStorage[localStorage['loginUsername'] + "_prefMainExtensionShort"] != null) {
    $("#bannerName").text('Extension #' + localStorage[localStorage['loginUsername'] + "_prefMainExtensionShort"]);
  }
}

function getVersion() {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open('GET', 'manifest.json');
  xmlhttp.onload = function (e) {

      var manifest = JSON.parse(xmlhttp.responseText);
      localStorage['version'] = manifest.version;
      $('#version').text('Version: ' + localStorage['version']);
  }
  xmlhttp.send(null);
}

// Google Analytics
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-00000000-0']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

_gaq.push(['_trackEvent', 'username', localStorage['loginUsername']]);

var buttons = document.querySelectorAll('button');
for (var i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener('click', trackButton);
}

function trackButton(e) {
  _gaq.push(['_trackEvent', 'button_' + e.target.id, 'clicked']);
};

$(document).ready(function() {

  // Document has loaded, lets get going...
  console.log("Sipcentric - Hello there!");

  // Lets hide everything after the page has loaded
  hide();

  // Add listeners on buttons using jquery to call various functions
  // Login page listeners
  $('#login').click(login);

  // Settings page listeners
  $('#reset').click(resetSettings);
  $('#save').click(saveSettings);
  $('#clickableOn').click(clickableOn);
  $('#clickableOff').click(clickableOff);

  // Welcome screen listeners
  $('#welcomeNext').click(showLogin);

  // Dialer screen listeners
  $('#dial').click(dial);

  // Recent listeners
  $('#recent').click(showRecent);
  $('#recentBack').click(showDialer);

  // Phone book listeners
  $('#addContact').click(function(){ showContact('new'); });
  $('#contactsRefresh').click(function(){ if ($('#contactsRefresh.disabled').length == 0) { displayContacts(true); } });

  // Messages screen listeners
  $('#smsSend').click(smsSend);

  // Listeners for menu items
  //$('#menuDialer').click(showDialer);
  $('#menuMessages').click(showMessages);
  $('#menuSettings').click(showSettings);
  $('#menuBook').click(showBook);
  $('#logout').click(logout);

  // Edit contact modal listeners
  $('#contactModalSave').click(saveContact);
  $('#contactModalUpdate').click(updateContact);
  $('#contactModalDelete').click(deleteContact);

  // Hide the edit contact modal
  $('#addContactModal').modal('hide');

  // Lets check what we are
  getVersion();

  // We shall set up some varibles here
  var timeout = null;
  var contacts = [];

  // jQuery custom autocomplete
  $.widget( "custom.catcomplete", $.ui.autocomplete, {
    _renderMenu: function( ul, items ) {
      var that = this,
        currentCategory = "";
      $.each( items, function( index, item ) {
        if ( item.category != currentCategory ) {
          ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>" );
          currentCategory = item.category;
        }
        that._renderItemData( ul, item );
      });
    }
  });

  // Setup is done...
  // Check if there is a logged in or show welcome
  if ( localStorage['loginUsername'] == null ) {
    showWelcome();
  } else if ( localStorage["loginValid"] != 'true' ) {
    showLogin();
  } else {
    if ( localStorage[localStorage['loginUsername'] + '_loginSetup'] == 'done' ) {
      showDialer();
    } else {
      // If the user has not completed the setup take them back to the settings page
      showSettings();
      // Hide menu prevents users from clicking off the page
      hideMenu();
    }
  }
});
