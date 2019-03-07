var axios = require('axios');
var moment = require('moment');
var io = require("socket.io-client");
var schedule = require("node-schedule");
var _ = require("underscore");

var BASE_URL = "http://localhost";
var API_URL = BASE_URL + ":8001";
var GUI_URL = BASE_URL;

var SLACK_KEY = "<slack_key_goes_here>";
var DO_ANNOUNCE = false;

var socket = io(BASE_URL + ":3000/active");

function postToSlack(json) {
    console.log(json);
    if (DO_ANNOUNCE) {
        axios.post('https://hooks.slack.com/services/' + SLACK_KEY, json)
            .then(response => {
                console.log("Successfully announced to Slack!");
            }).catch(error => {
                console.log(error);
            });
    }
}

function getMatchStartText(match, players) {
    var homePlayer = players[0];
    var awayPlayer = players[1];

    return `{
            "text": "",
            "attachments": [
                {
                    "fallback": "Official Match",
                    "author_name": "Official Match Started :trophy:",
                    "title": "${match.tournament.tournament_group_name}",
                    "text": ":dart: <${GUI_URL}/players/${homePlayer.player_id}/statistics|${homePlayer.player_name}> vs. <${GUI_URL}/players/${awayPlayer.player_id}/statistics|${awayPlayer.player_name}> is about to start",
                    "mrkdwn_in": [ "text" ],
                    "actions": [
                        {
                            "name": "action",
                            "type": "button",
                            "style": "primary",
                            "text": "Spectate :eyeglasses:",
                            "url": "${GUI_URL}/matches/${match.id}/spectate"
                        },
                        {
                            "name": "action",
                            "type": "button",
                            "text": "Preview :star:",
                            "url": "${GUI_URL}/matches/${match.id}/preview"
                        }                
                    ]
                }
            ]
        }
    `;
}

function getMatchEndText(match, players) {
    var homePlayer = players[0];
    var awayPlayer = players[1];
    
    var homePlayerWins = homePlayer.wins ? homePlayer.wins : 0;
    var awayPlayerWins = awayPlayer.wins ? awayPlayer.wins : 0;
    
    return `{
        "text": "",
        "attachments": [
            {
                "fallback": "Official Match",
                "author_name": "Official Match Finished :trophy:",
                "title": "${match.tournament.tournament_group_name}",
                "text": ":checkered_flag: <${GUI_URL}/players/${homePlayer.player_id}/statistics|${homePlayer.player_name}> ${homePlayerWins} - ${awayPlayerWins} <${GUI_URL}/players/${awayPlayer.player_id}/statistics|${awayPlayer.player_name}>",
                "mrkdwn_in": [ "text" ],
                "actions": [
                    {
                        "name": "action",
                        "type": "button",
                        "style": "primary",
                        "text": "Results",
                        "url": "${GUI_URL}/matches/${match.id}/result"
                    }
                ]
            }
        ]
    }`;
}

socket.on('new_match', function (data) {
    var match = data.match;
    axios.get(API_URL + "/leg/" + match.current_leg_id + "/players")
        .then(response => {
            var players = response.data;
            //postToSlack(getMatchStartText(match, players));
        }).catch(error => {
            console.log(error);
        });
});

socket.on('first_throw', function (data) {
    var leg = data.leg;
    var players = data.players;
    axios.get(API_URL + "/match/" + leg.match_id)
        .then(response => {
            var match = response.data;
            if (match.tournament_id !== null) {
                //postToSlack(getMatchStartText(match, players));
            } else {
                console.log("Skipping announcement of unofficial match...");
            }
        }).catch(error => {
            console.log(error);
        });
});

socket.on('warmup_started', function (data) {
    var legId = data.leg.id;
    var matchId = data.leg.match_id;
    axios.all([
        axios.get(API_URL + "/leg/" + legId + "/players"),
        axios.get(API_URL + "/match/" + matchId)
    ]).then(axios.spread((playersResponse, matchResponse) => {
        var players = playersResponse.data;
        var match = matchResponse.data;
        if (match.tournament_id !== null) {
            //postToSlack(text);
        } else {
            console.log("Skipping announcement of unofficial match...");
        }
    })).catch(error => {
        console.log(error);
    });
});

socket.on('order_changed', function (data) {
    var legId = data.leg_id;
    axios.get(API_URL + "/leg/" + legId)
        .then(response => {
            var leg = response.data;
            axios.get(API_URL + "/leg/" + legId + "/players")
                .then(response => {
                    var players = response.data;
                    axios.get(API_URL + "/match/" + leg.match_id)
                        .then(response => {
                            var match = response.data;
                            if (match.tournament_id !== null) {
                                postToSlack(getMatchStartText(match, players));
                            } else {
                                console.log("Skipping announcement of unofficial match...");
                            }
                        }).catch(error => {
                            console.log(error);
                        });
                }).catch(error => {
                    console.log(error);
                });
        }).catch(error => {
            console.log(error);
        });
});

socket.on('leg_finished', function (data) {
    var match = data.match;
    var leg = data.leg;

    if (match.is_finished && match.tournament_id !== null) {
        axios.get(API_URL + "/leg/" + match.current_leg_id + "/players")
            .then(response => {
                var players = response.data;
                postToSlack(getMatchEndText(match, players));
            })
            .catch(error => {
                console.log(error);
            });
    }
});

// Post schedule of overdue matches every weekday at 09:00 CEST
schedule.scheduleJob('0 8 * * 1-5', () => {
    axios.all([
        axios.get(API_URL + "/player"),
        axios.get(API_URL + "/tournament/groups"),
        axios.get(API_URL + "/tournament/current")
    ]).then(axios.spread((playersResponse, groupResponse, tournamentResponse) => {
        var players = playersResponse.data;
        var groups = groupResponse.data;
        var tournament = tournamentResponse.data;
        axios.get(API_URL + "/tournament/" + tournament.id + "/matches")
            .then(response => {
                var matches = response.data;
    
                var text = `{ "text": "Pending Official Matches :trophy:", "attachments": [`
                for (var groupId in matches) {
                    var group = matches[groupId];
                    
                    var newMatches = _.filter(group, (match) => {
                        return !match.is_finished && moment(match.created_at).isBefore();
                    });
                    if (newMatches.length === 0) {
                        continue;
                    }
                    
                    var groupMatches = "";
                    for (var i = newMatches.length - 1; i >= 0; i--) {
                        var match = newMatches[i];
    
                        var home = players[match.players[0]];
                        var homePlayerName = home.slack_handle ? `<${home.slack_handle}>` : home.name;
                        var away = players[match.players[1]];
                        var awayPlayerName = away.slack_handle ? `<${away.slack_handle}>` : away.name;
                        var week = moment(match.created_at).diff(moment(tournament.start_time), "weeks") + 1;
                        groupMatches += `*Week ${week}*: ${homePlayerName} - ${awayPlayerName}\n`;
                    }
    
                    text += `{
                            "fallback": "${groups[groupId].name} Pending Matches",
                            "author_name": "",
                            "title": "${groups[groupId].name}",
                            "text": "${groupMatches}",
                            "mrkdwn_in": [ "text" ],
                            "actions": [
                                {
                                    "name": "action",
                                    "type": "button",
                                    "style": "primary",
                                    "text": "Standings",
                                    "url": "${GUI_URL}/tournaments/${tournament.id}"
                                },                            
                                {
                                    "name": "action",
                                    "type": "button",
                                    "text": "Matches",
                                    "url": "${GUI_URL}/tournaments/${tournament.id}#unplayed"
                                }
                            ]
                        },`
                }
                text = text.substring(0, text.length - 1);
                text += `] }`;
    
                if (text !== `{ "text": "Pending Official Matches :trophy:", "attachments": ] }`) {
                    postToSlack(text);
                }
            })
            .catch(error => {
                console.log(error);
            });
    })).catch(error => {
        console.log(error);
    });
});

console.log("Waiting for events to announce...");
