let recognition;
let isRecognitionActive = false;
let mediaRecorder;
let recordedChunks = []; 

// Start speech recognition jb button click hoga

document.getElementById('startRecognition').addEventListener('click', function() {
    if (!isRecognitionActive) {
        startVoiceRecognition();
    }
});

// Function to start voice recognition web speech API ka use krke
function startVoiceRecognition() {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true; // Keep listening for commands 
    recognition.interimResults = false;  // only return final results

    recognition.onresult = function(event) {
        const command = event.results[0][0].transcript.toLowerCase();  //listen krke command ko lowercase me convert krke store kr liya .  we use const command because we are not going to change the value of commnd
        // results[0][0] is like a list(arrya) of results, jha 0 ke 0 index pe command store hoga
        document.getElementById('status').innerText = `Command: ${command}`;
        handleCommand(command);
    };

    recognition.onerror = function(event) {
        console.error("Recognition error: ", event.error);
    };

    recognition.onend = function() { // recognition end hua to automatically restart krdo
            // Automatically restart recognition if it ends
        if (isRecognitionActive) {
            recognition.start();
        }
    };

    recognition.start();
    isRecognitionActive = true; // Set the recognition state to active
    document.getElementById('status').innerText = 'Voice recognition started.';
}

// Handle voice commands
function handleCommand(command) {
    const commands = {
        "open google": () => window.open("https://www.google.com"),
        "open youtube": () => window.open("https://www.youtube.com"),
        "open chatgpt": () => window.open("https://chat.openai.com"),
        "play": () => executeScriptOnActiveTab(() => document.querySelector('video').play()),// js Ki DOM API ka use ho ra h 
        "pause": () => executeScriptOnActiveTab(() => document.querySelector('video').pause()),
        "speed up 2x": () => executeScriptOnActiveTab(() => document.querySelector('video').playbackRate = 2),
        "speed up 3x": () => executeScriptOnActiveTab(() => document.querySelector('video').playbackRate = 3),
        "take screenshot": () => takeScreenshot(),
        "scroll up": () => executeScriptOnActiveTab(() => window.scrollBy(0, 200)), // Scroll up
        "scroll down": () => executeScriptOnActiveTab(() => window.scrollBy(0, 200)), // Scroll down
        "click": () => executeScriptOnActiveTab(() => {
            const element = document.querySelector('button, a, [onclick]'); // Click on the first button or link
            if (element) {
                element.click();
            }
        })
    };

    for (const [key, action] of Object.entries(commands)) {
        if (command.includes(key)) {
            action();
            break; // Exit the loop once a command is matched
        }
    }
}

// Execute script on the active tab
function executeScriptOnActiveTab(scriptFunction) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) { // isme function(tabs) ek callback function hai jisme tabs ek array hai jo sabhi active tabs ki list (array) rakhta hai
        if (tabs.length > 0) { // check krta hai ki koi tab khula hai ya nhi jis pr hm script run krta skte hai
            chrome.tabs.update(tabs[0].id, {active: true}, function() { // phle tab ki id leta hai
                chrome.scripting.executeScript({ // Main API hai jo script ko run krne me help krti hai
                    target: {tabId: tabs[0].id},  // Active tab ko target krta hai
                    function: scriptFunction   // ye js funtion hai jo hm active tab pr run krana cahte h jaise document.querySelector('video').play();
                });
            });
        }
    });
}

// Take a screenshot
function takeScreenshot() {
    chrome.tabs.captureVisibleTab(null, {}, function(dataUrl) {  // API hai jo active tab ka schreenshot leti hai..... funtion(dataurl) jb schreenshot liya jata hai to ese Base64 data url ke form me milta hai
        const link = document.createElement('a');
        link.href = dataUrl;  // anchor tag ka href schreen short ka data dataurl se set kiya jata hai
        link.download = 'screenshot.png';
        link.click(); // ek new html anchor element bnaya jisse hm download kr skte hai
    });  // A Base64 Data URL is a long string that represents an image (or other binary data) in text format. 
}

// Start screen recording  Note: This feature not using in this time on the extension
function startRecording() {
    navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = function(event) {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            mediaRecorder.onstop = function() {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'recording.webm';
                link.click();
                recordedChunks = []; // Reset the chunks for the next recording
                document.getElementById('status').innerText = 'Recording stopped and saved.';
            };
            mediaRecorder.start();
            document.getElementById('status').innerText = 'Recording started...';
        })
        .catch(error => {
            console.error('Error accessing display media:', error);
            document.getElementById('status').innerText = 'Failed to start recording.';
        });
}

// Stop screen recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
}