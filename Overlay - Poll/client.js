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

    //  Vote Storage Variables
    var showVotes = true; // Set to false if you don't want the right Entries Menu //

    var amountOfVotesToShow = 0; // Gets calculated based on amount of options //
    var totalVotes = 0; // Current total votes that is being tracked // 
    var activeOptions = {}; // Active vote options tracked //

    var createdPollOptions = []; // Tracks all created Options //
    var voteQueue = []; // Vote Entry Animation Queue //
    var isAnimating = false; // Determines whether the Vote Queue is being animated //

    var userVoteAnimSpeed = 500; // UserVote Animation Speed //
    var voteOptionAnimSpeed = 1000; // Vote Percentage Animation Speed //

    var pollStarted = false; 

    //  Hide Options
    var hideOverlayOnceDone = true;
    var hideAfterMilisecs = 2500;
    var hideTimeout = null;

	function Connect() {
		socket = new WebSocket(serviceUrl);
		
		socket.onopen = function () {
			var auth = {
				author: "Brain",
				website: "https://brains-world.eu",
				api_key: API_Key,
				events: [
					"EVENT_POLL_START",
					"EVENT_POLL_VOTE",
					"EVENT_POLL_END",
					"EVENT_POLL_WIN",
					"EVENT_POLL_TIE"
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
	
			if (jsonObject.event == "EVENT_POLL_START") {
				Start(jsonObject.data);
			}
			else if (jsonObject.event == "EVENT_POLL_VOTE") {
				Vote(jsonObject.data);
			}
			else if (jsonObject.event == "EVENT_POLL_END") {
				Stop(jsonObject.data);
			}
			else if (jsonObject.event == "EVENT_POLL_WIN") {
				Win(jsonObject.data);
			}
			else if (jsonObject.event == "EVENT_POLL_TIE") {
				Tie(jsonObject.data);
			}
		}
		
		socket.onclose = function () {
			//------------------------------------
			//  Connection has been closed by you or the server
			//------------------------------------
			console.log("Connection Closed!");
			
			//	Attempt to reconnect
			setTimeout(Connect,reconnectIntervalMs);
		}
	}

	Connect();

    function Start(data) {
        if(pollStarted) return;
        pollStarted = true;
        var jsonObject = JSON.parse(data);
        clearTimeout(hideTimeout);

        //------------------------------------
        //  Remove Elements when Options have been removed
        //------------------------------------
        $('#optionContainer ul li').slice(-jsonObject.options.length).remove();

        activeOptions = [];
        createdPollOptions = [];

        $("h1").html(`${jsonObject.voting_on}`);
        $("#costs").html(`<span>Costs:</span> ${jsonObject.cost} <span>${jsonObject.currency_name}</span>`);
        if (jsonObject.is_multi_vote == true) {
            $("#multivote").html(`<span>Multivote:</span> Yes <span>(Max ${jsonObject.max_votes_per_user} Votes)</span>`);
        } else {
            $("#multivote").html(`<span>Multivote:</span> No <span>(Max ${jsonObject.max_votes_per_user} Votes)</span>`);
        }

        jsonObject.cost == 0 ? $("#cost").hide() : $("#cost").show();

        //------------------------------------
        //  Create all Bars
        //------------------------------------
        for (var i in jsonObject.options) {
            activeOptions[i] = jsonObject.options[i].Value;

            var percentage = (activeOptions[i] * 100 / (jsonObject.total_votes == 0 ? 1 : jsonObject.total_votes)).toFixed(2);

            if (i > createdPollOptions.length - 1)
                createdPollOptions[i] = new VoteOption(i, percentage, jsonObject, voteOptionAnimSpeed);
            else
                createdPollOptions[i].update(i, percentage, jsonObject);

            $("#optionContainer ul").append(createdPollOptions[i].newUserObject);
        }

        if (showVotes) {
            $("#entryContainer").css("max-height", $("#optionContainer").height()-2);
            $("#entryContainer").css("min-height", $("#optionContainer").height()-2);
            $("#entryContainer").show();

            // OptionListItem = height 87px
            // EntryListItem = height 37px
            // OptionContainer / EntryListItem (37px) = Amount of Votes
            amountOfVotesToShow = Math.floor(($("#optionContainer li").length*87)/40);
            console.log("Amount of max. Votes: " +amountOfVotesToShow);
        } else {
            $("#entryContainer").hide();
        }

        totalVotes = jsonObject.total_votes;
        $("#votes").html(`<span>Total Votes:</span> ${jsonObject.total_votes}`);

        //------------------------------------
        //  Start Background Timer if used
        //------------------------------------
        if (jsonObject.is_timed) {
            timeLeft = jsonObject.timer;
            timer = setInterval(runTimer, 1000);
            $("#timer").show();
        }
        else {
            $("#timer").hide();
        }

        showPoll();
    }

    function Vote(data) {
        if(!pollStarted) return;
        var jsonObject = JSON.parse(data);

        totalVotes++;
        activeOptions[jsonObject.option]++;

        console.log("ShowVotes: " + showVotes);

        if (showVotes) {
            var obj = new UserVote(jsonObject.name, jsonObject.option, userVoteAnimSpeed);
            voteQueue.push(obj);
            obj.display(setIsAnimating, animDone, false);
            $("#entryContainer ul").append(obj.newVoteObject);
        }

        for (var i in activeOptions) {
            var animPercent = (activeOptions[i] * 100 / totalVotes).valueOf();

            if (animPercent > 0) {
                createdPollOptions[i].animate(i, animPercent);
            }
        }
        $("#votes").html(`<span>Total Votes:</span> ${totalVotes}`);
    }

    function Stop(data) {
        var jsonObject = JSON.parse(data);
        timeLeft = 0;
        clearInterval(timer);
        runTimer();
        pollStarted = false;
    }

    function Win(data) {

        //  Convert to Object
        var jsonObject = JSON.parse(data);

        for (var i in activeOptions) {
            $(`#${i}`).animate({opacity: `0`}, {duration: 250,queue: true,complete: function () {
                        
                        $(`#${this.id}`).hide();
                        
                        //---------------------------
                        //   Unhide Winning Option after last Active Option has finished hiding
                        //---------------------------
                        if (this.id == activeOptions.length - 1) {
                            $("#optionsTitle").html(`Winning Option`);
                            $(`#${jsonObject.option_id}`).show();

                            $(`#${jsonObject.option_id}`).animate({opacity: `1`}, {duration: 1000,queue: true,complete: function()
                                    {
                                        if(hideAfterMilisecs)
                                        {
                                            hideTimeout = setTimeout(function(){
                                                hidePoll();
                                            },hideAfterMilisecs);
                                        }
                                    }
                                }
                                );
                        }
                    }
                });
        }

    }
    function Tie(data) {

        //  Convert to Object
        var jsonObject = JSON.parse(data);
       
       for (var i in activeOptions) {
           $(`#${i}`).animate({opacity: `0`}, {duration: 500,queue: true,complete: function () 
               {
                       $(`#${this.id}`).hide();

                       //---------------------------
                       //   Unhide Tie Option after last Active Option has finished hiding
                       //---------------------------
                        if (this.id == activeOptions.length - 1) {
                            $("#optionsTitle").html(`Tie`);

                            console.log(jsonObject.options);
                            // Result: [2,3,4]
                            for(var tie of jsonObject.options)
                            {
                                // Tie: [0,1,2]
                                console.log(tie);

                                $(`#${tie}`).show();

                                $(`#${tie}`).animate({opacity: `1`}, {duration: 2000,queue: true,complete: function()
                                        {
                                            if(hideAfterMilisecs && tie == jsonObject.options[jsonObject.options.length-1])
                                            {
                                                hideTimeout = setTimeout(function(){
                                                    hidePoll();
                                                },hideAfterMilisecs);
                                            }   
                                        }
                                    }
                                    );
                            }
                        }
                    }
                });
        }
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

        $("#timer").html("<span>Time left:</span> " + output);
    }

    function setIsAnimating(isAnim) {
        isAnimating = isAnim;
    }

    function animDone() {
        if (voteQueue.length > amountOfVotesToShow) {
            voteQueue[0].destroy();
            $("#votesOutput").append(voteQueue[amountOfVotesToShow].newVoteObject);
            voteQueue[amountOfVotesToShow].display(setIsAnimating, animDone, true);
            voteQueue.shift();
        }
        else {
            $("#votesOutput").append(voteQueue[voteQueue.length - 1].newVoteObject);
            voteQueue[voteQueue.length - 1].display(setIsAnimating, animDone, false);
        }
    }

    function showPoll() {
        var tl = new TimelineLite();

        tl.to("#container", 2, { opacity: 1});
        tl.to("#header", 2, {left: 0});

        $("#optionContainer li").each(function(index, element) {
          tl.to(element, 1.3, { left: 0 }, "-=.6");
        }); 
        tl.to("#entryContainer", 2, {opacity: 1});
    }

    function hidePoll() {
        var tl = new TimelineLite();
        tl.to("#header", 2, {left: -1000});
        tl.to("#entryContainer", 2, {opacity: 0});   
        $("#optionContainer li").each(function(index, element) {
          tl.to(element, 1, { left: -1000 }, "-=.6");
        }); 
        tl.to("#container", 2, {opacity: 0});
    }
}
