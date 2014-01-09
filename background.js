// Copyright (c) 2013 Sipcentric Ltd. Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
// background.js

// Globals
var stream = null;
var socket = null;
var attempts = 0;
var streamCheck = 0;
var streamSuspended = false;

// Add listener for messages passed from the content.js script
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.number != null) { sendResponse(tryCall(request.number, request.numberHold)); }
    if (request.sms != null) { sendResponse(sendSMS(request.sms, request.message, request.from)); }
    if (request.clickableEnabled != null) { sendResponse(clickableEnabled()); }
    if (request.connectStream != null) { attempts = 0; setupNotifications(); }
    if (request == 'killStream') { socket.unsubscribe(); }
  }
);

function getRandomArbitary (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setupNotifications() {

  username = localStorage['loginUsername'];
  password = localStorage['loginPassword'];

  try {
    socket.unsubscribe();
  } catch (e) {
    //console.log("Can't unsubscribe");
  }

  if (localStorage['loginValid'] == "true") {

    streamSuspended = false;
    var auth = window.btoa(localStorage["loginUsername"] + ":" + localStorage["loginPassword"]);
    authHeaders = {};
    authHeaders["Authorization"] = "Basic " + auth;

    socket = $.atmosphere;

    stream = { url : localStorage['baseURL'] + '/stream',
                    contentType : 'application/json',
                    logLevel : 'info',
                    headers : authHeaders,
                    attachHeadersAsQueryString: false,
                    maxReconnectOnClose : 0,
                    enableXDR : true,
                    transport : 'streaming' };

    stream.onOpen = function(response) {
      console.log('[SCCE] Stream flowing.');
      localStorage[localStorage['loginUsername'] + '_notificationConnection'] = true;
    };

    // stream.onClose = function(response) {
    // }
    
    stream.onError = function(response) {
      console.log('[SCCE] Stream has dried up. (Error)');
      localStorage[localStorage['loginUsername'] + '_notificationConnection'] = false;

      if (attempts < 5) {
        console.log('[SCCE] Going to reconnect in 20 secconds. Try: ' + attempts)
        attempts += 1;
        setTimeout(function(){ if (!streamSuspended) {setupNotifications()}; },20000);
      } else if (!streamSuspended) {
        console.log('[SCCE] Max attempts reached.');
        var errorNotification = webkitNotifications.createNotification('images/icon48.png', 'Connection Error', "Can't connect to the notifications server. Click here to reconnect.");
        streamSuspended = true;
        errorNotification.onclick = function(){
          attempts = 0;
          errorNotification.cancel();
          setupNotifications();
        }
        
        errorNotification.show();
      }
    };

    stream.onMessage = function (response) {
      var message = response.responseBody;
      localStorage[localStorage['loginUsername'] + '_streamFlow'] = new Date().getTime();

      //console.log(response);

      try {
        var json = jQuery.parseJSON(message);

        // For debug
        //console.log(json);

        if (json.event == "smsreceived") {

          console.log('[SCCE] SMS Received. From: ' + json.values['from'] + ' Message: ' + json.values['excerpt']);
          if ( notificationSmsEnabled() == true ) {          
            time = localStorage[localStorage['loginUsername'] + '_notifyTime'] * 1000;

            var pop = webkitNotifications.createNotification('images/icon48.png', 'New SMS from ' + json.values['from'], json.values['excerpt'] );
            pop.onclick = function(){ pop.cancel(); }
            pop.show();
            setTimeout(function(){ pop.cancel(); },time);
          }

        } else if (json.event == "incomingcall") {

          if (localStorage['baseURL'] + json.values['endpoint'] == localStorage[localStorage['loginUsername'] + '_prefMainExtension']) {
          
            console.log('[SCCE] Incoming Call. From: ' + json.values['callerIdNumber']);

            if ( popCallEnabled() == true ) {

              time = localStorage[localStorage['loginUsername'] + '_notifyTime'] * 1000;
              if (json.values['callerIdNumber'] != null) {
                message = json.values['callerIdNumber'] + " - Click here to open.";
                if (json.values['callerIdName'] != '' && json.values['callerIdName'] != null) {
                  title = 'Incoming Call from "' + json.values['callerIdName'] + '"';
                } else {
                  title = "Incoming Call from " + json.values['callerIdNumber'];
                }
              } else {
                title = "Incoming Call";
                message = "Click here to close.";
              }

              var pop = webkitNotifications.createNotification('images/icon48.png', title, message );

              if (json.values['callerIdNumber'] != null || json.values['callerIdNumber'] != '') {
                number = json.values['callerIdNumber'];
                url = localStorage[localStorage['loginUsername'] + '_prefCallPopURL'];
                open = url.replace("[callerid]",number);
                pop.onclick = function(){ chrome.tabs.create({'url':open}); pop.cancel(); }
              } else {
                pop.onclick = function(){ pop.cancel(); }
              }

              pop.show();
              setTimeout(function(){ pop.cancel(); },time);

            } else if ( notificationCallEnabled() == true ) {
              time = localStorage[localStorage['loginUsername'] + '_notifyTime'] * 1000;
              if (json.values['callerIdNumber'] != null) {

                message = json.values['callerIdNumber'] + " - Click here to close.";
                if (json.values['callerIdName'] != '' && json.values['callerIdName'] != null) {
                  title = 'Incoming Call from "' + json.values['callerIdName'] + '"';
                } else {
                  title = "Incoming Call from " + json.values['callerIdNumber'];
                }

              } else {

              	if (json.values['callerIdName'] != '' && json.values['callerIdName'] != null) {
                  title = 'Incoming Call from "' + json.values['callerIdName'] + '"';
                } else {
                  title = "Incoming Call";
                }

                message = "Click here to close.";
              }

              var pop = webkitNotifications.createNotification('images/icon48.png', title, message );
              pop.onclick = function(){ pop.cancel(); }
              pop.show();
              setTimeout(function(){ pop.cancel(); },time);

            }

          }
        }
        
      } catch (e) {
        return;
      }
    };

    if (navigator.onLine) {
      var subSocket = socket.subscribe(stream);
    }
  }
}

function notificationCallEnabled() { if (localStorage[localStorage['loginUsername'] + '_prefCallNotify'] == 1) { return true; } else { return false; } }

function notificationSmsEnabled() { if (localStorage[localStorage['loginUsername'] + '_prefSmsNotify'] == 1) { return true; } else { return false; } }

function clickableEnabled() { if (localStorage[localStorage['loginUsername'] + '_prefEnableClickable'] == 1) { return true; } else { return false; } }

function popCallEnabled() { if (localStorage[localStorage['loginUsername'] + '_prefCallPop'] == 1 && localStorage[localStorage['loginUsername'] + '_prefCallPopURL'] != false) { return true; } else { return false; } }

function sendSMS(number, message, from) {

  console.log('[SCCE] Send SMS. Number: ' + number + ' From: ' + from + ' Message: ' + message);

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("POST", localStorage['baseURL'] + "/customers/me/sms", false);
  var auth = window.btoa(localStorage["loginUsername"] + ":" + localStorage["loginPassword"]);
  xmlhttp.setRequestHeader('Authorization', 'Basic ' + auth);
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

function tryCall(number, numberHold) { 

  console.log('makeCall - Number: ' + number);
  console.log('[SCCE] Call number. Number: ' + number);

  if (numberHold == 1) {
    number = '*67' + number;
  }

  var realNumber = fixNumber(number);
  return makeCall(realNumber);
}

function fixNumber(number) {

  return number.replace(/(?:\+44|\(|\)|-|\s)/g, "");
}

function makeCall(number) {

  var endpoint = localStorage[localStorage['loginUsername'] + '_prefMainExtension'];
  var username = localStorage["loginUsername"];
  var password = localStorage["loginPassword"];

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("POST", localStorage['baseURL'] + "/customers/me/calls", false);
  var auth = window.btoa(localStorage["loginUsername"] + ":" + localStorage["loginPassword"]);
  xmlhttp.setRequestHeader('Authorization', 'Basic ' + auth);
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

function setupCheck() {
  streamCheck = window.setInterval(function(){ checkStream(); },120000);
}

function checkStream() {
  if (streamSuspended == false) {
    last = localStorage[localStorage['loginUsername'] + '_streamFlow'];
    now = new Date().getTime();

    if ( now - parseInt(last) > 70000 ) {
      console.log('[SCCE] Stream connection timed out.');
      setupNotifications();
    } else {
      //console.log('[SCCE] No timeout.');
    }
  }
}

function checkVersion() {
  // The updateCode is NOT the version number, just a string we have to match!

  // WARNING THIS WILL CLEAR THE LOCALSTORAGE IF THE UPDATE CODE DOES NOT MATCH!
  var updateCode = '30a04cf33ee91a3ecf4b75c71268f316'; // Code for V1.1.0
  
  var url = 'http://www.sipcentric.com/2013/06/google-chrome-extension-1-1-is-here';
  var updateMessage = 'New features include call notifications, screen popping and a new SMS messaging design. Click here to find out more.';

  if (localStorage['updateWelcome'] != updateCode) {
    if (localStorage[localStorage['loginUsername'] + '_loginSetup'] == 'done') {
      var pop = webkitNotifications.createNotification('images/icon48.png', 'Sipcentric for Chrome Updated!', updateMessage);
      pop.onclick = function(){ chrome.tabs.create({'url':url}); pop.cancel(); }
      pop.show();
      setTimeout(function(){ pop.cancel(); },'40000');
    }
    // WARNING THIS WILL CLEAR THE LOCALSTORAGE IF THE UPDATE CODE DOES NOT MATCH!
    localStorage.clear();
    localStorage['updateWelcome'] = updateCode;
  }
}

function contextDial(){
  var dialWindow = chrome.extension.getURL("call.html");
  chrome.contextMenus.create({
    "type":"normal",
    "title":"Dial Selected Number...",
    "contexts":["all", "page", "frame", "selection", "link", "editable"],
    "onclick": function (info, tab) {
      if (info.selectionText != null) {
        if (info.selectionText.length < 20) {
          chrome.tabs.create({ url: dialWindow + '?number=' + info.selectionText });
        } else {
          alert('Not a valid number.');
        }
      } else {
        alert('Highlight a number to dial first.');
      }
    }
  });
}

$(document).ready(function() {
  setupNotifications();
  contextDial();
  setupCheck();
  checkVersion();
});
