"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PServer = void 0;
const Http = require("http");
const url = require("url");
const Mongo = require("mongodb");
var PServer;
(function (PServer) {
    class Person {
        constructor(_fname, _lname, _adrr, _email, _password) {
            this.vorname = _fname;
            this.nachname = _lname;
            this.adresse = _adrr;
            this.email = _email;
            this.password = _password;
        }
    }
    let users;
    //Portfestlegung
    let port = Number(process.env.PORT);
    if (!port) {
        port = 8100;
    }
    //URL-Auswahl
    let dbURL = "mongodb+srv://Felixfex:!Fex1341@forgisgm.koewa.mongodb.net/<dbname>?retryWrites=true&w=majority";
    console.log(process.argv.slice(2));
    if (process.argv.slice(2)[0] == "local") {
        dbURL = "mongodb://127.0.0.1:27017";
    }
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
        users = mongoClient.db("Test").collection("Users");
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
        let fun = _request.url;
        console.log("I hear voices from: " + fun);
        let fun2 = url.parse(fun, true);
        let fun3 = fun2.query;
        let persi;
        let sendString = "";
        //Für die Registrierungsseite
        if (fun2.pathname == "/index.html") {
            persi = new Person(fun3.fname, fun3.lname, fun3.adrr, fun3.email, fun3.password);
            let filterinput = await users.findOne({ "email": fun3.email });
            if (filterinput == null) {
                users.insertOne(persi);
                sendString = "User created";
            }
            else {
                sendString = "User with that E-mail already exist";
            }
        }
        //Für die Ausgabe seite
        if (fun2.pathname == "/loaduser.html") {
            for (let i = 0; i < findingsArray.length; i++) {
                sendString += findingsArray[i].vorname + " " + findingsArray[i].nachname + "</br>";
            }
        }
        //Für die Einlog-Seite
        if (fun2.pathname == "/singin.html") {
            let filterinput = await users.findOne({ "email": fun3.email, "password": fun3.password });
            let filterEmail = await users.findOne({ "email": fun3.email });
            if (filterEmail != null) {
                if (filterinput != null) {
                    sendString = "Erfolgreich Eingelogt";
                }
                else {
                    sendString = "Passwort ist falsch";
                }
            }
            else {
                sendString = "Nutzer mit dieser Email existiert noch nicht Registrieren sie sich bitte";
            }
        }
        _response.write("<p>" + sendString + "</p>");
        _response.end();
    }
})(PServer = exports.PServer || (exports.PServer = {}));
//# sourceMappingURL=PServer.js.map