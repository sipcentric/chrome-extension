// Copyright (c) 2013 Sipcentric Ltd. Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
// content.js

var urlBlackList = ["mail.google.com", "www.google.com", "www.google.co.uk", "google.com", "google.co.uk"];

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
  $('body').find(':not(textarea,input,a)').replaceText( pattern, '<a title="Click to call this number" href="' + extension + '?number=$1" target="_blank">$1<\/a>' );
}

$(document).ready(function() {
  chrome.extension.sendMessage({clickableEnabled: 1}, function(response) {
    if (response == true) {
      checkBlocked();
    }
  });
});
