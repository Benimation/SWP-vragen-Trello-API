// SWP Vragen Trello API

jQuery(document).ready(function() {
	"use strict";
	
	var intervalspeed = 10000;
	
	var thelists = [];
	var updater = null;
	var getting = false;
	var setting = false;
	var choosingfile = false;
	var theinputs = [];
	
	
	// if succesfully authenticated
	var authenticationSuccess = function() {
		getTrelloInfo();
		
	};
	
	// check the current state of Trello lists, cards, comments and files
	function getTrelloInfo() {
		getting = true;
		Trello.get("/boards/" + boardid + "/lists", function(lists) {
			var listsprocessed = 0;
			
			jQuery.each(lists, function(index1, list) {
				Trello.get("/lists/" + list.id + "/cards", {attachments: true}, function(cards) {
					thelists[index1] = {header: "", questions: [], skip: false};
					thelists[index1].header = makeListString(list.name);
					thelists[index1].skip = cards.length === 0;
					
					if (cards.length === 0) { listsprocessed++; } else {
						var cardsprocessed = 0;
						
						jQuery.each(cards, function(index2, card) {
							Trello.get("/cards/" + card.id + "/actions", function(comments) {
								var thecomment = "";
								var thecommentid = "";
								if (comments[0] !== undefined) { thecomment = comments[0].data.text; thecommentid = comments[0].id; }
								
								if (card.labels.length > 0) {
									if (card.labels[0].name === "bestand") {
										// if file request
										if (card.attachments.length === 0) { 
											var filename = "";
											var fileid = "";
											
										} else {
											var filename = card.attachments[card.attachments.length-1].name;
											var fileid = card.attachments[card.attachments.length-1].id;
											
										}
										thelists[index1].questions[index2] = makeFileString(card.id, card.name, card.desc, filename, fileid);
										
										
									} else if (card.labels[0].name === "groot invoerveld") {
										// if long answer
										thelists[index1].questions[index2] = makeLongQuestionString(card.id, card.name, card.desc, thecomment, thecommentid);
										
										
									}
									
								} else {
									// if question
									thelists[index1].questions[index2] = makeQuestionString(card.id, card.name, card.desc, thecomment, thecommentid);
								
								}
								
								cardsprocessed++;
								if (cardsprocessed === cards.length) {
									listsprocessed++;
									if (listsprocessed === lists.length && updater === null) {
										updateQuestions();
										updater = setInterval(updateQuestions, intervalspeed);
										
									}
									
									if (listsprocessed === lists.length) {
										getting = false;
										buildTheContent();
										
									}
								
								}
								
							}, function(error) {
								console.log(error);
								jQuery(".status").html('<strong class="error">Er is een fout opgetreden!</strong> - <em>' + error.statusText + '</em> - <em>' + error.responseText + '</em>');
								
							});
						
						});
						
					}
					
					if (listsprocessed === lists.length && updater === null) {
						updateQuestions();
						updater = setInterval(updateQuestions, intervalspeed);
						
					}
					
					if (listsprocessed === lists.length) {
						getting = false;
						buildTheContent();
						
					}
					
				}, function(error) {
					console.log(error);
					jQuery(".status").html('<strong class="error">Er is een fout opgetreden!</strong> - <em>' + error.statusText + '</em> - <em>' + error.responseText + '</em>');
					
				});
				
			});
			
		}, function(error) {
			console.log(error);
			jQuery(".status").html('<strong class="error">Er is een fout opgetreden!</strong> - <em>' + error.statusText + '</em> - <em>' + error.responseText + '</em>');
			
		});
		
	}
	
	
	
	// update Trello according to user input
	function updateQuestions() {
		var currentinputs = [];
		jQuery.each(jQuery("#vragen-container input[type='text'], #vragen-container textarea"), function() {
			currentinputs.push(jQuery(this).val());
			
		});
		
		// if something changed: save the new data, else update the displayed content
		if (!currentinputs.equals(theinputs) || theinputs === []) {
			// Set Trello data
			jQuery.each(jQuery(".vraag"), function(index, element) {
				var thenewcomment = jQuery("input, textarea", this).val();
				if (thenewcomment) { // check if the answer isn't empty
					jQuery(".status").html("Bezig met opslaan...");
					
					setting = true;
					// if the question has been answered before + answer isn't deleted this time:
					if (jQuery("input, textarea", this).attr("data-id")) {
						Trello.put("/cards/" + jQuery(this).attr("data-id") + "/actions/" + jQuery("input, textarea", this).attr("data-id") + "/comments", { text: thenewcomment }, function(response) {
							jQuery(".status").html("Alle antwoorden zijn opgeslagen.");
							updateTheInputs();
							setting = false;
							
						}, function(error) {
							console.log(error);
							jQuery(".status").html('<strong class="error">Er is een fout opgetreden!</strong> - <em>' + error.statusText + '</em> - <em>' + error.responseText + '</em>');
							
						});
						
					} else { // no comment exists yet, so we create one:
						var thisparticularquestionelement = jQuery(this);
						Trello.post("/cards/" + jQuery(this).attr("data-id") + "/actions/comments", { text: jQuery("input, textarea", this).val() }, function(response) {
							jQuery(".status").html("Alle antwoorden zijn opgeslagen.");
							var thenewcommentid = response.id.toString();
							jQuery("input, textarea", thisparticularquestionelement).attr("data-id", thenewcommentid);
							updateTheInputs();
							setting = false;
							
						}, function(error) {
							console.log(error);
							jQuery(".status").html('<strong class="error">Er is een fout opgetreden!</strong> - <em>' + error.statusText + '</em> - <em>' + error.responseText + '</em>');
							
						});
						
					}
						
				} else if (jQuery("input, textarea", this).attr("data-id")) { // if the answer is removed (input is empty)
					setting = true;
					Trello.delete("/cards/" + jQuery(this).attr("data-id") + "/actions/" + jQuery("input, textarea", this).attr("data-id") + "/comments", function(response) {
						jQuery(".status").html("Alle antwoorden zijn opgeslagen.");
						updateTheInputs();
						setting = false;
						
					}, function(error) {
						console.log(error);
						jQuery(".status").html('<strong class="error">Er is een fout opgetreden!</strong> - <em>' + error.statusText + '</em> - <em>' + error.responseText + '</em>');
						
					});
					
				}
				
			});
			
		} else if (setting === false && choosingfile === false && jQuery("input:focus, textarea:focus").length === 0) {
			// Get Trello data
			getTrelloInfo();
			
		}
		
	}
	
	
	
	// build the content to be displayed
	function buildTheContent() {
		jQuery("#vragen-container").empty();
		var thenewvragen = '<ol>';
		jQuery.each(thelists, function(index, list) {
			if (!list.skip) {
				thenewvragen += "<li>" + list.header;
				jQuery.each(list.questions, function(index, question) {
					thenewvragen += question;
					
				});
				
				thenewvragen += "</li>";
				
			}
			
		});
		
		thenewvragen += "</ol>";
		
		// add the content
		jQuery("#vragen-container").append(thenewvragen);
		
		// init file upload via ajax
		jQuery("form.trello-upload").ajaxForm(function() { 
			console.log("File uploaded.");
			
		});
		
		// as soon as a user tries to edit a field, empty the status bar
		jQuery("#vragen-container input, #vragen-container textarea").focus(function() {
			jQuery(".status").html("");
			
		});
		
		// Check if the user is choosing a file
		jQuery("form.trello-upload").click(function() {
			choosingfile = true;
			
			jQuery(this).change(function() {
				jQuery(this).submit();
				jQuery(this).addClass("trello-uploading");
				choosingfile = false;
				
			});
			
		});
		
		updateTheInputs();
		
	}
	
	
	
	// the HTML contents of a Trello list
	function makeListString(title) {
		return '<div class="row vraag-categorie"><div class="text-center col-md-12"><div class="well"><strong>' + title + '</strong></div></div></div>';
		
	}
	
	
	
	// the HTML contents of a standard question
	function makeQuestionString(id, title, description, answer, commentid) {
		if (answer === "" || answer === undefined) { answer = ""; commentid = ""; }
		return '<div data-id="' + id + '" class="vraag"><h2 class="vraag-titel">' + title + '</h2><p class="vraag-beschrijving">' + description + '</p><div class="input-group input-group-lg"><span class="input-group-addon">Antwoord:</span><input type="text" class="form-control" value="' + answer + '" data-id="' + commentid + '" /></div><hr></div>';
		
	}
	
	
	
	// the HTML contents of a long question
	function makeLongQuestionString(id, title, description, answer, commentid) {
		if (answer === "" || answer === undefined) { answer = ""; commentid = ""; }
		return '<div data-id="' + id + '" class="vraag"><h2 class="vraag-titel">' + title + '</h2><p class="vraag-beschrijving">' + description + '</p><div class="form-group"><label>Antwoord:</label><textarea class="form-control" rows="5" data-id="' + commentid + '">' + answer + '</textarea></div><hr></div>';
		
	}
	
	
	
	// the HTML contents of a question that asks for a file
	function makeFileString(id, title, description, filename, fileid) {
		var thereturn = '<div data-id="' + id + '" class="bestand"><h2 class="vraag-titel">' + title + '</h2><p class="vraag-beschrijving">' + description + '</p>';
		
		if (filename === "" || filename === undefined) {
			filename = ""; fileid = "";
			
		} else {
			thereturn += '<p>We hebben het volgende bestand ontvangen: <strong id="bestandsnaam">' + filename + "</strong><br />Hieronder kunt u eventueel nog een bestand uploaden.</p>";
		}
		
		thereturn += '<form class="trello-upload" action="https://api.trello.com/1/cards/' + id + '/attachments" method="POST" enctype="multipart/form-data"><input type="hidden" name="key" value="08f1acd15d19e7f8e824bf38770ff481" /><input type="hidden" name="token" value="dcde2897f93cdf045a46b30ce1b9ee2b89e053c307458280d84266309da1bc98" /><input type="file" name="file" value="' + filename + '" data-id="' + fileid + '" /></form><hr></div>';
		
		
		return thereturn;
		
	}
	
	
	
	// check and save the contents of all the input elements
	function updateTheInputs() {
		theinputs = [];
		
		jQuery.each(jQuery("#vragen-container input[type='text'], #vragen-container textarea"), function() {
			theinputs.push(jQuery(this).val());
		});
		
		updateProgressBar();
		
	}
	
	// if authentication fails
	var authenticationFailure = function() { console.log("Failed authentication"); };
	
	
	
	
	
	
	// start the Trello connection
	Trello.setToken(trellotoken);
	if (Trello.token()) {
		authenticationSuccess();
	} else {
		authenticationFailure();
	}
	
	
	
	// if user tries to leave when not everything is saved yet
	window.onbeforeunload = function() {
        if (jQuery(".status")[0].html() === "Bezig met opslaan...") {
			return "Antwoorden worden nog opgeslagen...";
		}
		
    };
	
	
	
	
	
	
	// Progress bar
	function updateProgressBar() {
		var total = jQuery(".vraag").length;
		var answered = jQuery.grep(theinputs,function(n){ return n === 0 || n; }).length + jQuery(".vraag.bestand #bestandsnaam").length;
		var percentage = Math.round(answered / total * 100);
		var percentagetext = percentage + "%";
		
		jQuery("#progress-bar").css("width", percentagetext);
		jQuery("#progress-bar").html(percentagetext);
		
		if (percentage !== 0) {
			jQuery("#progress-bar").removeClass("empty");
			
		} else {
			jQuery("#progress-bar").addClass("empty");
			
		}
		
		if (percentage === 100) {
			jQuery("#honderd-procent").slideDown(200);
			
		} else {
			jQuery("#honderd-procent").slideUp();
			
		}
		
	}
	
	
    
});



// Array compare function
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array) {
        return false;
		
	}

    // compare lengths - can save a lot of time 
    if (this.length !== array.length) {
        return false;
		
	}

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i])) {
                return false;
				
			}
        }           
        else if (this[i] !== array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
};
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});