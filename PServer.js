"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PServer = void 0;
const Http = require("http");
const url = require("url");
const Mongo = require("mongodb");
var PServer;
(function (PServer) {
    class Person {
        constructor(_fname, _lname, _adrr, _mtr, _stg, _email, _user, _password, _friends) {
            this.vorname = _fname;
            this.nachname = _lname;
            this.adresse = _adrr;
            this.mtr = _mtr;
            this.stg = _stg;
            this.email = _email;
            this.user = _user;
            this.password = _password;
            if (_friends == null) {
                this.friends = [];
                this.friends[0] = _user;
            }
            else {
                this.friends = _friends;
            }
        }
    }
    class Comment {
        constructor(_user, _commentText) {
            this.user = _user;
            this.commentText = _commentText;
        }
    }
    class ParsingFollow {
        constructor(_username, _followed) {
            this.username = _username;
            this.followed = _followed;
        }
    }
    let users;
    let comments;
    //Portfestlegung
    let port = Number(process.env.PORT);
    if (!port) {
        port = 8100;
    }
    //URL-Auswahl
    let dbURL = "mongodb+srv://Felixfex:!Fex1341@forgisgm.koewa.mongodb.net/<dbname>?retryWrites=true&w=majority";
    console.log(process.argv.slice(2));
    connectToDatabase(dbURL);
    startServer(port);
    //#region Server Setup
    function startServer(_port) {
        console.log("Starting server" + _port);
        let server = Http.createServer();
        server.addListener("request", handleRequest);
        server.addListener("listening", handleListen);
        server.listen(_port);
    }
    async function connectToDatabase(_url) {
        let options = { useNewUrlParser: true, useUnifiedTopology: true };
        let mongoClient = new Mongo.MongoClient(_url, options);
        await mongoClient.connect();
        users = mongoClient.db("Twitter2").collection("Users");
        comments = mongoClient.db("Twitter2").collection("Comments");
        console.log("Connection Established", users != undefined);
    }
    //#endregion
    //#region Request Handeling
    function handleListen() {
        console.log("Listening");
    }
    async function handleRequest(_request, _response) {
        _response.setHeader("content-type", "text/html; charset=utf-8");
        _response.setHeader("Access-Control-Allow-Origin", "*");
        let collCursor = users.find();
        let findingsArray = await collCursor.toArray();
        let commCursor = comments.find();
        let parsedComments = await commCursor.toArray();
        let fun = _request.url;
        console.log("I hear voices from: " + fun);
        let fun2 = url.parse(fun, true);
        let fun3 = fun2.query;
        let persi;
        let sendString = "";
        //Für die Registrierungsseite
        if (fun2.pathname == "/index.html") {
            persi = new Person(fun3.fname, fun3.lname, fun3.adrr, fun3.mtr, fun3.stg, fun3.email, fun3.user, fun3.password);
            let filterinput = await users.findOne({ "email": fun3.email });
            let filterUser = await users.findOne({ "user": fun3.user });
            if (filterinput == null && filterUser == null) {
                users.insertOne(persi);
                sendString = "Nutzerprofil erstellt Log dich <a href='singin.html' id='Hier'>Hier</a> ein";
            }
            else {
                sendString = "Nutzer mit dieser Email/Usernamen existiert bereits; Log dich <a href='singin.html' id='Hier'>Hier</a> ein";
            }
        }
        //Für die Ausgabe/Follow seite
        if (fun2.pathname == "/loaduser.html") {
            let filterUser = await users.findOne({ "user": fun3.currUser });
            if (fun3.friend != null) {
                users.deleteOne({ "user": fun3.currUser });
                if (fun3.follow == "do") {
                    filterUser.friends.push(fun3.friend);
                }
                else if (fun3.follow == "undo") {
                    for (let i = 0; i < filterUser.friends.length; i++) {
                        if (filterUser.friends[i] == fun3.friend) {
                            filterUser.friends.splice(i, 1);
                        }
                    }
                }
                let redouser = new Person(filterUser.vorname, filterUser.nachname, filterUser.adresse, filterUser.mtr, filterUser.stg, filterUser.email, filterUser.user, filterUser.password, filterUser.friends);
                users.insertOne(redouser);
            }
            let friendslist = filterUser.friends;
            let matchlist = [];
            let endingList = [];
            for (let i = 0; i < findingsArray.length; i++) {
                let matchBool = false;
                for (let k = 0; k < friendslist.length; k++) {
                    if (findingsArray[i].user == friendslist[k]) {
                        matchBool = true;
                    }
                }
                matchlist[i] = matchBool;
                endingList[i] = findingsArray[i].user;
            }
            let forSendingList = new ParsingFollow(endingList, matchlist);
            sendString = JSON.stringify(forSendingList);
        }
        //Für die Einlog-Seite
        if (fun2.pathname == "/singin.html") {
            let filterinput = await users.findOne({ "user": fun3.user, "password": fun3.password });
            let filterEmail = await users.findOne({ "user": fun3.user });
            if (filterEmail != null) {
                if (filterinput != null) {
                    sendString = "Erfolgreich Eingelogt";
                }
                else {
                    sendString = "Passwort ist falsch";
                }
            }
            else {
                sendString = "Nutzer mit diesem Username existiert noch nicht, Registrieren sie sich bitte";
            }
        }
        //Für die Kommentare
        if (fun2.pathname == "/hauptseite.html") {
            let filterUser = await users.findOne({ "user": fun3.currUser });
            if (fun3.getcomment != "do") {
                let newComm = new Comment(filterUser.user, fun3.comment);
                comments.insertOne(newComm);
            }
            else {
                for (let i = parsedComments.length - 1; i >= 0; i--) {
                    for (let k = 0; k < filterUser.friends.length; k++) {
                        if (filterUser.friends[k] == parsedComments[i].user) {
                            sendString += "<div class='Kommentar'><p class='KommUser'>" + parsedComments[i].user + "<pre></p><p class='KommText'>" + parsedComments[i].commentText + "</p></pre></div>";
                        }
                    }
                }
            }
            if (sendString == "") {
                sendString = "<p> Noch keine Kommentare </p>";
            }
        }
        //Für die Profilbearbeitung
        if (fun2.pathname == "/profil.html") {
            if (fun3.unsave == "do") {
                let filterUser = await users.findOne({ "user": fun3.currUser });
                sendString = JSON.stringify(filterUser);
            }
            else if (fun3.DelAcc == null && fun3.DelCom == null) {
                let filterUser = await users.findOne({ "user": fun3.currUser });
                users.deleteOne({ "user": fun3.currUser });
                persi = new Person(fun3.fname, fun3.lname, fun3.adrr, fun3.mtr, fun3.stg, fun3.email, fun3.currUser, fun3.password, filterUser.friends);
                users.insertOne(persi);
                sendString = "<p> Gespeichert </p>";
            }
            if (fun3.DelAcc == "do") {
                users.deleteOne({ "user": fun3.currUser });
            }
            if (fun3.DelCom == "do") {
                comments.deleteMany({ "user": fun3.currUser });
                sendString = "<p> Tweets gelöscht <p>";
            }
        }
        if (fun2.pathname == "/profil.html" || fun2.pathname == "/hauptseite.html" || fun2.pathname == "/loaduser.html") {
            _response.write(sendString);
            _response.end();
        }
        else if (sendString != "") {
            _response.write("<p>" + sendString + "</p>");
            _response.end();
        }
    }
})(PServer = exports.PServer || (exports.PServer = {}));
//# sourceMappingURL=PServer.js.map