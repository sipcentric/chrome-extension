// Sipcentric 2013
// Background script for Sipcentric Chrome Extension
// background.js

// Add listener for messages passed from the content.js script
chrome.extension.onMessage.addListener(

  function(request, sender, sendResponse) {

    console.log('We got a message from our extension!');

    if (request.number != null) {
        sendResponse(tryCall(request.number));
    }

    if (request.sms != null) {
        sendResponse(sendSMS(request.sms, request.message, request.from));
    }

    if (request.clickableEnabled != null) {
        sendResponse(clickableEnabled());
    }
  }
);

function clickableEnabled() {
  if (localStorage['loginValid'] == "true") {
      if (localStorage[localStorage['loginUsername'] + '_prefEnableClickable'] == 1) {
          return true;
      } else {
          return false;
      }
  } else {
      return false;
  }
}

function sendSMS(number, message, from) {

  console.log('sendSMS - Number: ' + number + ' From: ' + from + ' Message: ' + message);

  var username = localStorage["loginUsername"];
  var password = localStorage["loginPassword"];

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("POST", "http://pbx.sipcentric.com/api/v1/customers/me/sms", false, username, password);
  xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xmlhttp.send(JSON.stringify({   type: "smsmessage",
                                  to: number,
                                  from: from,
                                  body: message
                              }));

  var status = xmlhttp.status;

  var message;
  if (xmlhttp.responseText != null) { 
      message = JSON.parse(xmlhttp.responseText);
  }

  return [status, message];
}

function tryCall(number) {

  console.log('makeCall - Number: ' + number);

  var realNumber = fixNumber(number);
  //callNotification(realNumber);
  return makeCall(realNumber);
}

function fixNumber(number) {

  return number.replace(/(?:\+44|\(|\)|-|\s)/g, "");
}

function callNotification(number) {

  var title = 'Calling ' + number;
  var message = 'Pick up your phone to dial.';
  var notification = webkitNotifications.createNotification('images/icon48.png', title, message);
  notification.show();
  setTimeout(function(){notification.cancel();},6000);
}

function makeCall(number) {

  var endpoint = localStorage[localStorage['loginUsername'] + '_prefMainExtension'];
  var username = localStorage["loginUsername"];
  var password = localStorage["loginPassword"];

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("POST", "http://pbx.sipcentric.com/api/v1/customers/me/calls", false, username, password);
  xmlhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  xmlhttp.send(JSON.stringify({   type: "call",
                                  endpoint: endpoint,
                                  to: number
                              }));

  var status = xmlhttp.status;

  if (status == 401) {
    return [status, "Not logged in!"];
  } else {
    var message;
    if (xmlhttp.responseText) { 
        message = JSON.parse(xmlhttp.responseText);
    }
    return [status, message];
  }
}