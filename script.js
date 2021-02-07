"use strict";
var Abgabe3;
(function (Abgabe3) {
    //let ip: string = "http://localhost:8100/";
    let ip = "https://gistwitter2.herokuapp.com/";
    //Werte die Sehr oft genutzt werden und somit global sein müssen
    let currentPage = window.location.pathname.substring(window.location.pathname.lastIndexOf("/") + 1);
    let user = localStorage.getItem("Eingeloggt");
    //Automatisches weiterleiten sofern eine man nicht eingelogt auf die hauptseiten will oder man Eingeloggt auf der singin/register seite ist (Forced login)
    if (user != null && (currentPage == "singin.html" || currentPage == "index.html")) {
        window.open("hauptseite.html", "_self");
    }
    else if (user == null && currentPage != "index.html" && currentPage != "singin.html") {
        window.open("singin.html", "_self");
    }
    //#region Seitenabhängige Automatische Funktionen
    if (currentPage == "hauptseite.html") {
        getSMessage("&getcomment=do");
    }
    if (currentPage == "profil.html") {
        getSMessage("&unsave=do");
        let delAccButton = document.getElementById("DelA");
        let delComButton = document.getElementById("DelC");
        delAccButton.addEventListener("click", function () { getSMessage("&DelAcc=do&DelCom=do"); ausloggen(); });
        delComButton.addEventListener("click", function () { getSMessage("&DelCom=do"); });
    }
    if (currentPage == "loaduser.html") {
        getSMessage("");
    }
    let subButton = document.getElementById("submitData");
    if (subButton != null) {
        subButton.addEventListener("click", setValue);
    }
    let auslogButton = document.getElementById("Auslog");
    if (auslogButton != null) {
        auslogButton.addEventListener("click", ausloggen);
    }
    //#endregion
    //#region Log funktionen
    function ausloggen() {
        localStorage.removeItem("Eingeloggt");
        localStorage.removeItem("PasswortLog");
        window.open("singin.html", "_self");
    }
    function storeSingIn() {
        if (currentPage == "singin.html") {
            let userInput = document.getElementById("user");
            localStorage.setItem("Eingeloggt", userInput.value);
        }
    }
    //#endregion
    //Setzt  Formwerte fest
    function setValue() {
        let inputs;
        let missingBool = false;
        inputs = document.getElementsByClassName("forInput");
        //Tested ob etwas von den Eigaben fehlt
        for (let i = 0; i < inputs.length; i++) {
            if (inputs[i].value == "") {
                inputs[i].style.border = "1px solid rgb(255, 60, 60)";
                inputs[i].style.backgroundColor = "rgb(255, 214, 214)";
                missingBool = true;
            }
            else {
                inputs[i].style.border = "1px solid #ccc";
                inputs[i].style.backgroundColor = "rgb(234, 246, 255)";
            }
        }
        //frägt ab ob alle daten vorhanden sind wenn nicht gibt es einen Text aus 
        let bod = document.getElementById("ErrorText");
        if (missingBool == false) {
            let formData = new FormData(document.forms[0]);
            bod.innerHTML = "<p> Es könnte etwas dauern bis der Server antwortet, also haben sie bitte etwas Geduld </p>";
            bod.style.opacity = "100%";
            getSMessage("", formData);
        }
        else {
            bod.innerHTML = "<p> Eingabe(n) vergessen! Bitte alles rot-markierte eintragen</p>";
            bod.style.opacity = "100%";
        }
    }
    //Sendet eine anfrage an den server und erwartet einen Rückantwort
    async function getSMessage(_extrainfo, _formdata) {
        let url = ip + currentPage;
        let query = "";
        if (_formdata != null) {
            query = new URLSearchParams(_formdata).toString();
        }
        url = url + "?" + query + "&currUser=" + user + _extrainfo;
        console.log(url);
        let response = await fetch(url);
        let message = await response.text();
        //Seitenabhängige Message Bearbeitung
        if (currentPage == "hauptseite.html" && _extrainfo != "&getcomment=do") {
            getSMessage("&getcomment=do");
        }
        else if (currentPage == "hauptseite.html") {
            showComment(message);
        }
        else if (currentPage == "profil.html" && message != "<p> Tweets gelöscht <p>" && message != "<p> Gespeichert </p>") {
            showProfile(message);
        }
        else if (currentPage == "loaduser.html") {
            showFollow(message);
        }
        else {
            showServerMessage2(message);
        }
    }
    //#region Message handeling
    //Zeigt die Error/Server Antwort an
    function showServerMessage2(_message) {
        let bod = document.getElementById("ErrorText");
        bod.innerHTML = _message;
        bod.style.opacity = "100%";
        if (_message == "<p>Erfolgreich Eingelogt</p>") {
            storeSingIn();
            location.reload();
        }
        if (_message == "Nutzerprofil erstellt Log dich <a href='singin.html' id='Hier'>Hier</a> ein") {
            window.open("singin.html", "_self");
        }
    }
    //Zeigt die Kommentare An
    function showComment(_message) {
        let commBody = document.getElementById("KommentarBox");
        commBody.innerHTML = _message;
        let bod = document.getElementById("ErrorText");
        bod.innerHTML = "";
        bod.style.opacity = "0%";
    }
    //Zeigt das Profil an
    function showProfile(_message) {
        let parsedProfile = JSON.parse(_message);
        let inputs;
        inputs = document.getElementsByTagName("input");
        console.log(parsedProfile);
        let userEigenschaften = Object.entries(parsedProfile);
        let k = 1;
        for (let i = 0; i < inputs.length; i++) {
            console.log(userEigenschaften[i + 1][0]);
            if (userEigenschaften[i + 1][0] == "user") {
                k++;
            }
            inputs[i].value = userEigenschaften[i + k][1];
        }
    }
    //Zeig die (un)Followbaren nutzer an
    function showFollow(_messsge) {
        let parsedFollow = JSON.parse(_messsge);
        let followerTable = document.getElementById("FollowerTable");
        followerTable.innerHTML = "<th>Nutzernamen</th><th>Follow-Status</th>";
        for (let i = 0; i < parsedFollow.username.length; i++) {
            if (parsedFollow.username[i] != user) {
                let followRow = document.createElement("tr");
                let newButton = document.createElement("button");
                let followCell = document.createElement("td");
                if (parsedFollow.followed[i]) {
                    newButton.innerHTML = "Unfollow";
                    newButton.addEventListener("click", function () { getSMessage("&follow=undo&friend=" + parsedFollow.username[i]); });
                }
                else {
                    newButton.innerHTML = "Follow";
                    newButton.addEventListener("click", function () { getSMessage("&follow=do&friend=" + parsedFollow.username[i]); });
                }
                followRow.innerHTML = "<td>" + parsedFollow.username[i] + "</td>";
                followCell.appendChild(newButton);
                followRow.appendChild(followCell);
                followerTable.appendChild(followRow);
            }
        }
    }
    //#endregion
})(Abgabe3 || (Abgabe3 = {}));
//# sourceMappingURL=script.js.map