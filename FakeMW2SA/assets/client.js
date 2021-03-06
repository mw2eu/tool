
reload()

function block(ip, act) {
    if (act) {
        fetch("/?action=blockadd&ip=" + ip)
    } else {
        fetch("/?action=blockdelete&ip=" + ip)
    }
    reload();
}

function vacban(player) {
    let result = "False"
    if (player.vacbanned == 1) {
        result = "("
        result += player.numberofvacbans
        result += ") "
        result += Math.floor((new Date).getTime() / 86400000 - player.dateoflastban / 86400)
        result += "d"
    }
    return result
}

function playerlocation(player) {
    let result = ""
    if (player.country != null) {
        result += player.country
    }
    return result
}

function copyTextToClipboard(text) {
    var textArea = document.createElement("textarea")
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
}

function populate() {
    while (playertable.firstChild) {
        playertable.removeChild(playertable.firstChild);
    }

    var content = "";

    for (player of playersdata) {
        content += "<tr>";

        // Name (+ link to Steam profile)
        content += "<td><a target='_blank' href='";
        content += player.profileurl;
        content += "'><span>";
        content += escape(player.personaname)
        content += "</span></a>"
        content += "<button style='background-color:mediumpurple'>";
        content += player.host ? "host" : ""
        content += "</button>";
        content += "</td>";

        // Country
        content += "<td>";
        content += playerlocation(player);
        content += "</td>";

        // Time (days since last seen)
        content += "<td>";
        content += Math.round(new Date().valueOf() / 1000) - player.lastseen;
        content += " sec go";
        content += "</td>";

        // VAC (ban)
        if (player.vacbanned == 1) {
            colorvac = "lightsalmon";
        } else {
            colorvac = "lightblue";
        }
        content += "<td><button style='background-color:";
        content += colorvac;
        content += "'>";
        content += vacban(player)
        content += "</button></td>";

        // Info (copy player Steam ID and IP to clipboard)
        content += "<td><button style='background-color:lightgoldenrodyellow' onclick=copyTextToClipboard('";
        content += "https://steamcommunity.com/profiles/";
        content += player.steamid;
        content += "\\n";
        content += player.ip;
        content += "')>Copy</button></td> ";

        // Block
        content += "<td>";
        if ((player.banned == null) || (player.banned == "False")) {
            content += "<button style='background-color:lightgreen' onclick=\"block('"
            content += player.ip
            content += "', true)\">Add</button>"
        } else {
            content += "<button style='background-color:lightcoral' onclick=\"block('"
            content += player.ip
            content += "', false)\">Delete</button>"
        }
        content += "</td>";

        content += "</tr>";
    }

    playertable.innerHTML += content;

    var parties = [];

    for (let i = 0; i < playersdata.length - 1; i++) {
        if (playersdata[i]["partyID"] == playersdata[i + 1]["partyID"] && playersdata[i]["partyID"] != 1) {
            if (parties.indexOf(playersdata[i]["partyID"]) === -1) {
                parties.push(playersdata[i]["partyID"]);
            }
        }
    }
}

function reload() {
    fetch("/?action=players").then(response => response.text()).then(data => {
        playersdata = JSON.parse(data).players
        let partygroups = []

        for (let i = 0; i < playersdata.length; i++) {
            var temp = playersdata.filter(function (a) {
                return (a.partyID == i);
            });

            if (temp[0] != null) {
                lastseens = [];
                temp2 = [];

                temp.forEach(function (item) {
                    lastseens.push(item.lastseen);
                });

                biggest = Math.max(...lastseens);

                temp.forEach(function (item) {
                    if (item.lastseen != biggest) {
                        item.partyID = 0;
                        partygroups.push([item]);
                    } else {
                        temp2.push(item);
                    }
                });

                if (temp2.length > 0) {
                    partygroups.push(temp2);
                }
            }
        }

        function sortem(array) {
            array.sort(function (a, b) {
                return (b.lastseen - a.lastseen);
            });
        }

        partygroups.forEach(sortem);

        partygroups.sort(function (a, b) {
            return (b[0].lastseen - a[0].lastseen);
        })

        newdata = []
        for (let a = 0; a < partygroups.length; a++) {
            for (let i = 0; i < partygroups[a].length; i++) {
                newdata.push(partygroups[a][i]);
            }
        }

        playersdata = newdata;

        populate();
    });
}

function escape(args) {
    if ("string" !== typeof args) {
        return "";
    }
    if ("" == args.replace(/\^[0-9]/g, "").replace(/ /g, "")) {
        return "Unnamed player";
    }
    args = args.replace(/&/g, "&amp;");
    args = args.replace(/>/g, "&gt;");
    args = args.replace(/</g, "&lt;");
    args = args.replace(/'/g, "\&apos;");
    args = args.replace(/"/g, "\&quot;");
    var s = "<span>";
    for (let i = 0; i < args.length; i++) {
        if ("^" == args[i] && args[i + 1]) {
            var checked = args.charCodeAt(i + 1);
            if (48 <= checked && 57 >= checked) {
                s += '</span><span class="color' + args[i + 1] + '">';
                i++;
            } else {
                s += args[i];
            }
        } else {
            s += args[i];
        }
    }
    s = (s + "</span>").replace(/<span><\/span>/g, "");
    return s = s.replace(/<span class=\"color[0-9]\"><\/span>/g, "");
}