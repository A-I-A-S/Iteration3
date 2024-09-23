// Configuration for Cognito Identity Pool and AWS
AWS.config.region = 'ap-southeast-2'; // Region
const identityPoolId = 'ap-southeast-2:5e6d21f1-af0d-45d7-9e2d-84556a44a947'; // AWS Identity pool ID
 
// Initialize the Amazon Cognito credentials provider
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId
});
 
// Function to authenticate user with aws credentials, had gpt help with the error checking and explanation to understand roles to be added to the identity pool
function authenticateUser() {
    return new Promise((resolve, reject) => {
        AWS.config.credentials.get(function(err) {
            if (err) {
                console.error('Error retrieving credentials', err);
                reject(err);
            } else {
                console.log('Successfully retrieved credentials');
                console.log('Cognito Identity Id:', AWS.config.credentials.identityId);
                resolve();
            }
        });
    });
}
 
// Function to upload data, with authentication, and error handling to format and creation of xml and video files that are sent to s3
async function uploadData() {
    try {
        await authenticateUser();
 
        const productName = document.getElementById('productName').value;
        const productDescription = document.getElementById('productDescription').value;
        const productCost = document.getElementById('productCost').value;
        const videoFile = document.getElementById('inputFile').files[0];
 
        if (!productName || !productDescription || !productCost || !videoFile) {
            alert('Please fill all fields and select a video file.');
            return;
        }
 
        // Create XML data
        const xmlData = `
            <Product>
            <Name>${productName}</Name>
            <Description>${productDescription}</Description>
            <Cost>${productCost}</Cost>
            </Product>
        `;
        const xmlBlob = new Blob([xmlData], { type: 'application/xml' });
        const xmlFileName = `${productName}.xml`;
 
        // Upload XML file to S3 bucket (aiasimg)
        const s3 = new AWS.S3();
        const xmlParams = {
            Bucket: 'aiasimg',
            Key: xmlFileName,
            Body: xmlBlob,
            ContentType: 'application/xml'
        };
        await s3.upload(xmlParams).promise();
        console.log('Successfully uploaded XML');
 
        // Upload video file to S3 bucket (aiasscan)
        const videoFileName = `${productName}.${videoFile.name.split('.').pop()}`;
        const videoParams = {
            Bucket: 'aiasscan',
            Key: videoFileName,
            Body: videoFile,
            ContentType: videoFile.type
        };
 
        // Shows the result of the upload of information so when successful, a success alert is shown and if an error occurs it will show it. Had GPT help with capturing and udnerstanding the errors and ensuring that correct roles/authentication of AWS systems were used ie. Cognito, identiy pool, roles. 
        const videoUploadResult = await s3.upload(videoParams).promise();
        console.log('Successfully uploaded video', videoUploadResult);
        document.getElementById('result').innerHTML = `<p>Successfully uploaded video and product information! </p>`;
    } catch (error) {
        console.error('Error in uploadData:', error);
        document.getElementById('result').innerHTML = `<p>Error: ${error.message}</p>`;
    } finally {
        // Re-enable the submit button and hide the loader once the upload is complete: learnt loader using https://www.w3schools.com/howto/howto_css_loader.asp
        document.getElementById('submitButton').disabled = false;
        document.getElementById('loader').style.display = 'none'; /* Hides the loader */
    }
}
 
// Drag and Drop for uploading image/video. learnt and adapted from https://www.youtube.com/watch?v=5Fws9daTtIs
const dropArea = document.getElementById("drop-area");
const inputFile = document.getElementById("inputFile");
const imageView = document.getElementById("image-view");
 
inputFile.addEventListener("change", uploadImage); // Event listener for input file to change the file after 1 is uploaded already
// Event listener for drag and drop
dropArea.addEventListener("dragover", function(e) {
    e.preventDefault();
});
// Event listener for dropping in of file
dropArea.addEventListener("drop", function(e) {
    e.preventDefault();
    inputFile.files = e.dataTransfer.files;
    uploadImage();
});
 
// Event listener for form submission
document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();
    // Disable the submit button and show the loader
    document.getElementById('submitButton').disabled = true;
    document.getElementById('loader').style.display = 'block';
    uploadData();
});
 
/* Function to upload video */ 
function uploadImage() {
    const file = inputFile.files[0];
    if (file.type.startsWith('video/')) { // checks if the file is a video
        let videoLink = URL.createObjectURL(file); //creates a link to the video file
        // creates the inner html for the video preview element, used this resource as a guide for preview/controls. https://blog.teamtreehouse.com/building-custom-controls-for-html5-videos
        imageView.innerHTML = `
            <div class="video-preview">
            <video width="100%" height="auto">
            <source src="${videoLink}" type="${file.type}">
            </video>
            <div class="video-options">
            <button type="button" onclick="playVideo(event)">Play</button>
            <button type="button" onclick="changeUpload(event)">Change Upload</button>
            </div>
            </div>`;
        imageView.style.border = 0; // removes the border from the image view element
    } else if (file.type.startsWith('image/')) { // checks if the file is an image
        let imgLink = URL.createObjectURL(file);
        imageView.innerHTML = `<img src="${imgLink}" alt="Uploaded Image" style="max-width: 100%; height: auto;">`;
        imageView.style.border = 0;
    } else {
        alert('Please select a video or image file'); // alerts if the file is not a video or image
    }
}
 
// Function to play the video when it is in upload area, used this resource as a guide of video playing: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Video_and_audio_APIs
function playVideo(event) {
    event.preventDefault();
    const video = document.querySelector('.video-preview video');
    if (video) {
        video.play();
    }
}
 
// Function to change the upload file when file is already in upload area
function changeUpload(event) {
    event.preventDefault();
    inputFile.click();
}
