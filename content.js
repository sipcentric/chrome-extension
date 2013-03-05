// Sipcentric 2013
// Content script for Sipcentric Chrome Extension
// content.js

var urlBlackList = ["mail.google.com", "google.com", "google.co.uk"];

function checkBlocked() {
  var url = document.location.hostname;
  var check = jQuery.inArray(url, urlBlackList);
  if (check < 0) {
    linkNumbers();
  } else {
    console.log('Sipcentric extension: Domain is in block list, numbers will not be clickable!');
  }
}

function linkNumbers() {
  var extension = chrome.extension.getURL("call.html");
  var pattern = /((?:0|\+44)(?:[0-9]|\(|-|\)|\s(?:[0-9]|\()){8,20})/g;
  $('body').find(':not(textarea)').replaceText( pattern, '<a title="Click to call this number" href="' + extension + '?number=$1" target="_blank">$1<\/a>' );
}

$(document).ready(function() {
  chrome.extension.sendMessage({clickableEnabled: 1}, function(response) {
    if (response == true) {
      checkBlocked();
    }
  });
});
