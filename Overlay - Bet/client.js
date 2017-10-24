if (window.WebSocket) {
    //---------------------------------
    //  Variables
    //---------------------------------
	//  Connection Information
	var serviceUrl = "ws://127.0.0.1:3337/AnkhBot"
	socket = null;
	var reconnectIntervalMs = 10000;
	
    //  Timer Variables
    var timeLeft = 0;
    var isTiming = false;   
    var timer = null;
    var payout = 0;

    var showBets = true;

    var amountOfBetsToShow = 0;
    var totalBets = 0;
    var betStarted = false; 
    var betsAllowed = true;

    var hideAfterMilisecs = 3500;
    var hideTimeout = null;

	function Connect() {
		socket = new WebSocket(serviceUrl);
		
		socket.onopen = function () {
			var auth = {
				author: "Brain",
				website: "https://brains-world.eu",
				api_key: API_Key,
				events: [
					"EVENT_BET_START",
					"EVENT_BET_ABORT",
					"EVENT_BET_END",
                    "EVENT_BET_ENTER",
					"EVENT_BET_WINNER"
				]
			}
			socket.send(JSON.stringify(auth));
			console.log("Connected");
		};
		socket.onerror = function (error) {
			console.log("Error: " + error);
		}
	
		socket.onmessage = function (message) {
			var jsonObject = JSON.parse(message.data);
	
			if (jsonObject.event == "EVENT_BET_START") {
				Start(jsonObject.data);
			}
			else if (jsonObject.event == "EVENT_BET_ENTER") {
				Enter(jsonObject.data);
			}
			else if (jsonObject.event == "EVENT_BET_WINNER") {
				Winner(jsonObject.data);
			}
            else if (jsonObject.event == "EVENT_BET_END") {
                StopBets();
            }
			else if (jsonObject.event == "EVENT_BET_ABORT") {
				EndBet();
			}
		}
		
		socket.onclose = function () {
			console.log("Connection Closed!");
			setTimeout(Connect,reconnectIntervalMs);
		}
	}

	Connect();

    function Start(data) {
        if(betStarted) return;
        betStarted = true;
        betsAllowed = true;

        console.log("Start Bet");
        var jsonObject = JSON.parse(data);
        clearTimeout(hideTimeout);

        $("h1").html(`${jsonObject.betting_on}`);
        if (jsonObject.is_multi_bet == true) {
            $("#isMultiBet").html(`MultiBets: <span>Yes</span>`);
        } else {
            $("#isMultiBet").html(`MultiBets: <span>No</span>`);
        }
        $("#minBet").html(`Min: <span>${jsonObject.min_bet}</span>`);
        $("#maxBet").html(`Max: <span>${jsonObject.max_bet}</span>`);
        $("#totalBets").html(`Total Bets: <span>${jsonObject.total_bets}</span>`);
        $("#payoutPercentage").html(`Payout: <span>${jsonObject.payout_percent}%</span>`);
        if (jsonObject.timer == true) {
            $("#timer").html(`Time remaining: <span>${jsonObject.timer}</span>`);   d
        }

        for (var i in jsonObject.options) {
            var newBet =    `<li id="${i}" class="option">
                                <div class="optionName">${jsonObject.options[i].Key}</div>
                                <div class="optionInfo">!bet ${i} [amount]</div>
                            </li>`;

            $("#optionContainer ul").append(newBet);
        }

        if (showBets) {
            $("#entryContainer").css("max-height", $("#optionContainer").height()-3);
            $("#entryContainer").css("min-height", $("#optionContainer").height()-3);
        } else {
            $("#entryContainer").hide();
            $("#optionContainer").css("width", "100%");
        }

        totalBets = jsonObject.total_bets;
        $("#totalBets").html(`Total Bets: <span>${jsonObject.total_bets}`);

        if (jsonObject.is_timed) {
            timeLeft = jsonObject.timer;
            timer = setInterval(runTimer, 1000);
            $("#timer").show();
        } else {
            $("#timer").hide();
        }

        ShowBet();
        console.log("Show Bet Event triggered.");
    }


    function Enter(data) {
        if (!betsAllowed) return;

        var jsonObject = JSON.parse(data);
        console.log("Enter data: " + jsonObject);
        var optContainerHeight = 0;

        if (showBets) {
            optContainerHeight = $("#optionContainer").height();
            $("#entryContainer").css("max-height", optContainerHeight-3);
            $("#entryContainer").css("min-height", optContainerHeight-3);

            amountOfBetsToShow = Math.floor((optContainerHeight-22)/33);
            if ($("#entryContainer li").length == amountOfBetsToShow) {
                $("#entryContainer").find('li:first').remove();
            }

            var newEntry = `<li class="entry">
                                <div class="entryName">${jsonObject.name}</div> 
                                <div class="entryOption">#${jsonObject.option}</div>
                                <div class="entryAmount">${jsonObject.amount}</div>
                            </li>`;
            $("#entryContainer ul").append(newEntry);
        }
        totalBets++;
        $("#totalBets").html(`Total Bets: <span>${totalBets}</span>`);
    }

    function Winner(data) {
        var jsonObject = JSON.parse(data);

        /*
        jsonObject - 1) gewinner, id
        linke liste leeren
        rechte liste leeren
        linke liste den gewinner + ID hinzufügen
        */
        $("#optionContainer ul").empty();
        var newBet =    `<li id="${jsonObject.option_id}" class="option">
                                <div class="optionName">${jsonObject.option}</div>
                                <div class="optionInfo">!bet ${jsonObject.option_id} [amount]</div>
                            </li>`;
        $("#optionContainer ul").append(newBet);
        $("#optionContainer li").css("opacity", "1");
        
        $("#optionContainer li").addClass("animated infinite pulse");
        setTimeout(function() {
            EndBet();
        }, hideAfterMilisecs);
        
    }

    function StopBets() {
        betsAllowed = false;
        timeLeft = 0;
        clearInterval(timer);
        runTimer();
    }

    function ShowBet() {
        var tl = new TimelineLite();
        $("#container").css("opacity", "1");

        tl.to("#header", 2, {left: 0});

        $("#optionContainer li").each(function(index, element) {
          tl.to(element, 1.3, { left: 0 , opacity: 1 }, "-=.6");
        }); 
        tl.fromTo("#entryContainer", 2, {opacity: 0}, {opacity: 1});
    }

    function EndBet() {
        $("#container").css("opacity", "0");

        var tl = new TimelineLite();
        tl.fromTo("#entryContainer", 2, {opacity: 1}, {opacity: 0});
        tl.fromTo("#header", 2, {left: 0}, {left: -1000});
        $("#optionContainer li").each(function(index, element) {
          tl.to(element, 1, { left: -1000 , opacity: 0 }, "-=.6");
        }); 

        setTimeout(function() {
            $("#optionContainer ul").empty();
            $("#entryContainer ul").empty();
        }, 1500);
        
        timeLeft = 0;
        clearInterval(timer);
        runTimer();
        betStarted = false;
    }

    function runTimer() {
        //------------------------------------
        //  Calculate Timer
        //------------------------------------
        timeLeft = Math.max(0, timeLeft - 1);

        var days = Math.floor(timeLeft / (60 * 60 * 24));
        var hours = Math.floor((timeLeft % (60 * 60 * 24)) / (60 * 60));
        var minutes = Math.floor((timeLeft % (60 * 60)) / (60));
        var seconds = Math.floor((timeLeft % (60)));

        //------------------------------------
        //  Add Zeros
        //------------------------------------
        if (days < 10) { days = "0" + days; }
        if (hours < 10) { hours = "0" + hours; }
        if (minutes < 10) { minutes = "0" + minutes; }
        if (seconds < 10) { seconds = "0" + seconds; }

        //------------------------------------
        //  Create Display String
        //------------------------------------
        var output = "";

        if (days != 0) output += days + ":";
        if (hours != 0) output += hours + ":";
        output += minutes + ":";
        output += seconds;

        $("#timer").html('Time remaining: <span>' + output + '</span>');
    }
}