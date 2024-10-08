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
// Helper function to introduce a delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function for checking if CSV file and image exist in S3 bucket with results/product info
async function checkForCSVAndImage(binLocation) {
    const s3 = new AWS.S3();
    const csvFileName = `${binLocation}.csv`;
    const imageFileName = `${binLocation}.jpg`; // Assuming the image is a jpg, adjust if needed.

    const csvParams = {
        Bucket: 'countresults',
        Key: csvFileName
    };
    const imageParams = {
        Bucket: 'countresults',
        Key: imageFileName
    };

    try {
        // Check if CSV file exists
        await s3.headObject(csvParams).promise();
        const csvUrl = s3.getSignedUrl('getObject', csvParams);

        // Check if Image file exists
        await s3.headObject(imageParams).promise();
        const imageUrl = s3.getSignedUrl('getObject', imageParams);

        // Display CSV and image download links if they exist
        if (!document.getElementById('csvMessage')) {
            document.getElementById('result').innerHTML += `
                <p id="csvMessage">CSV file is ready: <a href="${csvUrl}" download>Download CSV</a></p>`;
        }
        if (!document.getElementById('imageMessage')) {
            document.getElementById('result').innerHTML += `
                <p id="imageMessage">Image file is ready: <a href="${imageUrl}" download>Download Image</a></p>`;
        }
        
        document.getElementById('loader').style.display = 'none'; // Hide loader
        return true; // Indicate success
    } catch (error) {
        if (error.code === 'NotFound' || error.statusCode === 403) {
            return false; // Indicate failure
        } else {
            console.error('Error checking for CSV and image:', error);
            document.getElementById('loader').style.display = 'none'; // Hide loader on error
            return false; // Indicate failure
        }
    }
}

// Start polling for the CSV and image files after a delay
async function startChecking(binLocation) {
    // Show loader
    document.getElementById('loader').style.display = 'block';
    
    // Wait for 20 seconds before starting to check
    await delay(20000);
    
    let fileFound = false;
    while (!fileFound) {
        fileFound = await checkForCSVAndImage(binLocation);
        if (!fileFound) {
            await delay(5000); // Wait for 5 seconds before retrying
        }
    }
}

// Function to upload data, authenticate with AWS, and start polling for CSV and image files
async function uploadData() {
    try {
        await authenticateUser();

        const binLocation = document.getElementById('binLocation').value;
        const imageFile = document.getElementById('inputFile').files[0];

        if (!binLocation || !imageFile) {
            alert('Please fill all fields and select an image or video file.');
            return;
        }

        // Create XML data
        const xmlData = `
            <Location>
            <Name>${binLocation}</Name>
            </Location>
        `;
        const xmlBlob = new Blob([xmlData], { type: 'application/xml' });
        const xmlFileName = `${binLocation}.xml`;

        // Upload XML file to S3 bucket (aiascount)
        const s3 = new AWS.S3();
        const xmlParams = {
            Bucket: 'aiascount',
            Key: xmlFileName,
            Body: xmlBlob,
            ContentType: 'application/xml'
        };
        await s3.upload(xmlParams).promise();
        console.log('Successfully uploaded XML');

        // Upload image or video file to S3 bucket (aiascount)
        const imageFileName = `${binLocation}.${imageFile.name.split('.').pop()}`;
        const imageParams = {
            Bucket: 'aiascount',
            Key: imageFileName,
            Body: imageFile,
            ContentType: imageFile.type
        };

        const imageUploadResult = await s3.upload(imageParams).promise();
        console.log('Successfully uploaded image/video', imageUploadResult);

        document.getElementById('result').innerHTML = `<p>Successfully uploaded form! Please wait for results!</p>`;

        // Start polling for the CSV and image file after a 20-second delay
        startChecking(binLocation);
    } catch (error) {
        console.error('Error in uploadData:', error);
        document.getElementById('result').innerHTML = `<p>Error: ${error.message}</p>`;
    } finally {
        document.getElementById('submitButton').disabled = false;
        document.getElementById('loader').style.display = 'none';
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
 
/* Function to upload image... Kept video in case it used later */ 
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


