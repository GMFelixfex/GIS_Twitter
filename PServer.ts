import * as Http from "http";
import * as url from "url";
import * as Mongo from "mongodb";

export namespace PServer {

    class Person {
        vorname: string;
        nachname: string;
        adresse: string;
        email: string;
        password: string;

        constructor(_fname: string, _lname: string, _adrr: string, _email: string, _password: string) {
            this.vorname = _fname;
            this.nachname = _lname;
            this.adresse = _adrr;
            this.email = _email;
            this.password = _password;
        }
    }

    interface ParsingUser {
        id: string;
        vorname: string;
        nachname: string;
        adresse: string;
        email: string;
        password: string;
    }

    let users: Mongo.Collection;

    //Portfestlegung
    let port: number = Number(process.env.PORT);
    if (!port) {
        port = 8100;

    }

    //URL-Auswahl
    let dbURL: string = "mongodb+srv://Felixfex:!Fex1341@forgisgm.koewa.mongodb.net/<dbname>?retryWrites=true&w=majority";
    console.log(process.argv.slice(2));
    if (process.argv.slice(2)[0] == "local") {
        dbURL = "mongodb://127.0.0.1:27017";
    }

    connectToDatabase(dbURL);
    startServer(port);

    //#region Server Setup
    function startServer(_port: number | string): void {
        console.log("Starting server" + _port);
        let server: Http.Server = Http.createServer();
        server.addListener("request", handleRequest);
        server.addListener("listening", handleListen);
        server.listen(_port);
    }

    async function connectToDatabase(_url: string): Promise<void> {
        let options: Mongo.MongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };
        let mongoClient: Mongo.MongoClient = new Mongo.MongoClient(_url, options);
        await mongoClient.connect();
        users = mongoClient.db("Test").collection("Users");
        console.log("Connection Established", users != undefined);
    }
    //#endregion

    //#region Request Handeling
    function handleListen(): void {
        console.log("Listening");
    }

    async function handleRequest(_request: Http.IncomingMessage, _response: Http.ServerResponse): Promise<void> {
        _response.setHeader("content-type", "text/html; charset=utf-8");
        _response.setHeader("Access-Control-Allow-Origin", "*");

        let collCursor: Mongo.Cursor = users.find();
        let findingsArray: ParsingUser[] = await collCursor.toArray();
        let fun: string = _request.url;
        console.log("I hear voices from: " + fun);
        let fun2: url.UrlWithParsedQuery = url.parse(fun, true);
        let fun3: typeof fun2.query = fun2.query;
        let persi: Person;
        let sendString: string = "";

        //Für die Registrierungsseite
        if (fun2.pathname == "/index.html") {
            persi = new Person(<string>fun3.fname, <string>fun3.lname, <string>fun3.adrr, <string>fun3.email, <string>fun3.password);
            let filterinput: string = await users.findOne({ "email": fun3.email });
            if (filterinput == null) {
                users.insertOne(persi);
                sendString = "User created";
            } else {
                sendString = "User with that E-mail already exist";
            }
        }

        //Für die Ausgabe seite
        if (fun2.pathname == "/loaduser.html") {
            for (let i: number = 0; i < findingsArray.length; i++) {
                sendString += findingsArray[i].vorname + " " + findingsArray[i].nachname + "</br>";
            }
        }

        //Für die Einlog-Seite
        if (fun2.pathname == "/singin.html") {
            let filterinput: typeof users.findOne = await users.findOne({ "email": fun3.email, "password": fun3.password });
            let filterEmail: typeof users.findOne = await users.findOne({ "email": fun3.email });

            if (filterEmail != null) {
                if (filterinput != null) {
                    sendString = "Erfolgreich Eingelogt";
                } else {
                    sendString = "Passwort ist falsch";
                }
            } else {
                sendString = "Nutzer mit dieser Email existiert noch nicht Registrieren sie sich bitte";
            }
        }

        _response.write("<p>" + sendString + "</p>");
        _response.end();
    }
}