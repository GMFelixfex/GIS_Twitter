import * as Http from "http";
import * as url from "url";
import * as Mongo from "mongodb";

export namespace PServer {

    class Person {
        vorname: string;
        nachname: string;
        adresse: string;
        mtr: string;
        stg: string;
        email: string;
        user: string;
        password: string;
        friends: string[];

        constructor(_fname: string, _lname: string, _adrr: string, _mtr: string, _stg: string, _email: string, _user: string, _password: string, _friends?: string[]) {
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
            } else {
                this.friends = _friends;
            }
        }
    }

    class Comment {
        user: string;
        commentText: string;

        constructor(_user: string, _commentText: string) {
            this.user = _user;
            this.commentText = _commentText;
        }
    }

    interface ParsingUser {
        id: string;
        vorname: string;
        nachname: string;
        adresse: string;
        mtr: string;
        stg: string;
        email: string;
        user: string;
        password: string;
        friends: string[];
    }

    interface ParsingComment {
        id: string;
        user: string;
        commentText: string;
    }

    class ParsingFollow {
        username: string[];
        followed: boolean[];

        constructor(_username: string[], _followed: boolean[]) {
            this.username = _username;
            this.followed = _followed;
        }
    }

    let users: Mongo.Collection;
    let comments: Mongo.Collection;

    //Portfestlegung
    let port: number = Number(process.env.PORT);
    if (!port) {
        port = 8100;
    }

    //URL-Auswahl
    let dbURL: string = "mongodb+srv://Felixfex:!Fex1341@forgisgm.koewa.mongodb.net/<dbname>?retryWrites=true&w=majority";
    console.log(process.argv.slice(2));

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
        users = mongoClient.db("Twitter2").collection("Users");
        comments = mongoClient.db("Twitter2").collection("Comments");
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
        let commCursor: Mongo.Cursor = comments.find();
        let parsedComments: ParsingComment[] = await commCursor.toArray();

        let fun: string = _request.url;
        console.log("I hear voices from: " + fun);
        let fun2: url.UrlWithParsedQuery = url.parse(fun, true);
        let fun3: typeof fun2.query = fun2.query;
        let persi: Person;
        let sendString: string = "";

        //Für die Registrierungsseite
        if (fun2.pathname == "/index.html") {
            persi = new Person(<string>fun3.fname, <string>fun3.lname, <string>fun3.adrr, <string>fun3.mtr, <string>fun3.stg, <string>fun3.email, <string>fun3.user, <string>fun3.password);
            let filterinput: string = await users.findOne({ "email": fun3.email });
            let filterUser: string = await users.findOne({ "user": fun3.user });
            if (filterinput == null && filterUser == null) {
                users.insertOne(persi);
                sendString = "Nutzerprofil erstellt Log dich <a href='singin.html' id='Hier'>Hier</a> ein";
            } else {
                sendString = "Nutzer mit dieser Email/Usernamen existiert bereits; Log dich <a href='singin.html' id='Hier'>Hier</a> ein";
            }
        }

        //Für die Ausgabe/Follow seite
        if (fun2.pathname == "/loaduser.html") {
            let filterUser: ParsingUser = await users.findOne({ "user": fun3.currUser });
            if (fun3.friend != null) {
                users.deleteOne({ "user": fun3.currUser });
                if (fun3.follow == "do") {
                    filterUser.friends.push(<string>fun3.friend);
                } else if (fun3.follow == "undo") {
                    for (let i: number = 0; i < filterUser.friends.length; i++) {
                        if (filterUser.friends[i] == fun3.friend) {
                            filterUser.friends.splice(i, 1);
                        }
                    }
                }
                let redouser: Person = new Person(filterUser.vorname, filterUser.nachname, filterUser.adresse, filterUser.mtr, filterUser.stg, filterUser.email, filterUser.user, filterUser.password, filterUser.friends);
                users.insertOne(redouser);
            }

            let friendslist: string[] = filterUser.friends;
            let matchlist: boolean[] = [];
            let endingList: string[] = [];
            for (let i: number = 0; i < findingsArray.length; i++) {
                let matchBool: boolean = false;
                for (let k: number = 0; k < friendslist.length; k++) {
                    if (findingsArray[i].user == friendslist[k]) {
                        matchBool = true;
                    }
                }
                matchlist[i] = matchBool;
                endingList[i] = findingsArray[i].user;
            }
            let forSendingList: ParsingFollow = new ParsingFollow(endingList, matchlist);
            sendString = JSON.stringify(forSendingList);
        }

        //Für die Einlog-Seite
        if (fun2.pathname == "/singin.html") {
            let filterinput: typeof users.findOne = await users.findOne({ "user": fun3.user, "password": fun3.password });
            let filterEmail: typeof users.findOne = await users.findOne({ "user": fun3.user });

            if (filterEmail != null) {
                if (filterinput != null) {
                    sendString = "Erfolgreich Eingelogt";
                } else {
                    sendString = "Passwort ist falsch";
                }
            } else {
                sendString = "Nutzer mit diesem Username existiert noch nicht, Registrieren sie sich bitte";
            }
        }

        //Für die Kommentare
        if (fun2.pathname == "/hauptseite.html") {
            let filterUser: Person = await users.findOne({ "user": fun3.currUser });
            if (fun3.getcomment != "do") {
                let newComm: Comment = new Comment(filterUser.user, <string>fun3.comment);
                comments.insertOne(newComm);
            } else {
                for (let i: number = parsedComments.length - 1; i >= 0; i--) {
                    for (let k: number = 0; k < filterUser.friends.length; k++) {
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
                let filterUser: ParsingUser = await users.findOne({ "user": fun3.currUser });
                sendString = JSON.stringify(filterUser);
            } else if (fun3.DelAcc == null && fun3.DelCom == null) {
                let filterUser: ParsingUser = await users.findOne({ "user": fun3.currUser });
                users.deleteOne({ "user": fun3.currUser });
                persi = new Person(<string>fun3.fname, <string>fun3.lname, <string>fun3.adrr, <string>fun3.mtr, <string>fun3.stg, <string>fun3.email, <string>fun3.currUser, <string>fun3.password, filterUser.friends);
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
        } else if (sendString != "") {
            _response.write("<p>" + sendString + "</p>");
            _response.end();
        }
    }
}


