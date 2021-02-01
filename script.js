"use strict";
var Abgabe3;
(function (Abgabe3) {
    function getPage() {
        return window.location.pathname.substring(window.location.pathname.lastIndexOf("/") + 1);
    }
    let subButton = document.getElementById("submitData");
    subButton.addEventListener("click", setValue);
    function setValue() {
        let inputs;
        let missingBool = false;
        inputs = document.getElementsByTagName("input");
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
            bod.style.width = "50%";
            getSMessage(formData);
        }
        else {
            bod.innerHTML = "<p> Eingaben vergessen! Bitte alles rot-markierte eintragen</p>";
            bod.style.width = "50%";
        }
    }
    //Sendet eine anfrage an den server und erwartet einen Rückantwort
    async function getSMessage(_formdata) {
        let path = getPage();
        let url = "https://gisfelixfex.herokuapp.com/" + path;
        let query = new URLSearchParams(_formdata);
        console.log(query);
        url = url + "?" + query.toString();
        console.log(url);
        let response = await fetch(url);
        let message = await response.text();
        console.log(message);
        showServerMessage2(message);
    }
    //Zeigt die Antwort an
    function showServerMessage2(_message) {
        let bod = document.getElementById("ErrorText");
        bod.innerHTML = _message;
        bod.style.width = "50%";
    }
})(Abgabe3 || (Abgabe3 = {}));
//# sourceMappingURL=script.js.map