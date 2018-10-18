if (window.WebSocket) {
    var serviceUrl = "ws://127.0.0.1:3337/streamlabs";
    socket = null;

    var themeLanguage = "";

    if (typeof API_Key === "undefined") {
        content = document.getElementById('themeBody');
        content.innerHTML = "<div class='error'>Error: No API Key was found in the directory!<br>Rightclick on the Script in Chatbot and select 'Insert API Key'.<br>Afterwards refresh this page.</div>";
    }

    function Connect() {
        socket = new WebSocket(serviceUrl);

        socket.onopen = function() {
            var auth = {
                author: "Brain",
                website: "http://www.brains-world.eu",
                api_key: API_Key,
                events: [
                    "EVENT_INIT_THEME"
                ]
            };
            socket.send(JSON.stringify(auth));
            console.log("Theme Loader connected");
        };

        socket.onmessage = function(message) {
            var jsonObject = JSON.parse(message.data);
            if (jsonObject.event == "EVENT_CONNECTED") {
                return;
            }
            if (jsonObject.event == "EVENT_INIT_THEME") {
                SetThemeForOverlay(JSON.parse(jsonObject.data).themeName, JSON.parse(jsonObject.data).themeLanguage);
            } else {
                console.log("No theme selected. Load default 'Streamlabs'.");
                SetThemeForOverlay("Streamlabs", "English");
            } 
        };

        socket.onerror = function(error) {
            console.log("Error: " + error);
        };

        socket.onclose = function() {
            console.log("Connection closed");
            socket = null;
            setTimeout(function() { connectWebSocket() }, 5000);
        };
    }

    Connect();

    function SetThemeForOverlay(name, language) {
        console.log("Selected Theme: " + name);
        console.log("Selected Language: " + language);
        if (themeLanguage === "" && language != "" || themeLanguage != language) {
            themeLanguage = language;
        }
        document.getElementById('themeBody').innerHTML = "<iframe src='" + name + "/index.html' width='100%' height='100%' frameborder='0' scrolling='no'></iframe>";
    }
}