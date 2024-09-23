// learnt with tutorials,guides and videos and had some clarifications to some local storage elements with gpt regarding website wide storage
//which didnt work out so went back to original with some changes. https://www.w3schools.com/html/html5_webstorage.asp

// Function to show the terms pop-up and gets the html elements for the overlay and modal
function showTermsPopup() {
  document.getElementById("terms-overlay").style.display = "block";
  document.getElementById("terms-popup").style.display = "block";
}

// Function to hide the terms pop-up and overlay
function hideTermsPopup() {
  document.getElementById("terms-overlay").style.display = "none";
  document.getElementById("terms-popup").style.display = "none";
}

// Function to block page interactions if terms are declined so users cant do anything without agreement to the terms
function blockPageInteractions() {
  document.getElementById("terms-overlay").style.display = "block";
}

// Check if the user has already accepted the terms checking the local storage, ! for pop up as need to check if item exists in local storage
function checkTermsAccepted() {
  if (!localStorage.getItem("termsAccepted")) {
      showTermsPopup();
  }
}

// Call checkTermsAccepted function when the page has finished loading
document.addEventListener("DOMContentLoaded", function() {
  checkTermsAccepted();
});
// Add event listeners to the accept button
document.getElementById("accept-button").addEventListener("click", function() {
  localStorage.setItem("termsAccepted", "true"); // Store acceptance in localStorage
  hideTermsPopup(); // Hide the popup and overlay
});
// Add event listeners to the decline button
document.getElementById("decline-button").addEventListener("click", function() {
  alert("You have declined the terms of use. You cannot use the site.");
  blockPageInteractions(); // Keep the overlay active to block page interactions
});
