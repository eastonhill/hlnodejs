//var ipaddress = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
//var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;


var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ipaddress   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';


var WebSocketServer = require('ws').Server;
var url = require('url');
var http = require('http');

var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write("Welcome\n\n");
    response.write("Time: " + new Date() + "\n\n");
    response.end("Thanks for visiting us at " + request.url);
    var reqobj = url.parse(request.url, true).query;
    console.log(JSON.stringify(reqobj));


    if (reqobj.name == "payment") {
        //todo betalning via webbapp?
///console.log("PAYMENT!");
 //       wss.sendTo2(reqobj.stationid, reqobj, "payment_from_scan")
    }

    if (reqobj.test) {
       // console.log("tjoho");
        //wss.broadcast(GetSendObject(reqobj, "broadcast test"))
        //wss.sendTo2(reqobj.stationid, reqobj, "test_from_http")
    }

    if (request.url.trim() == "/order") {
      //  var mess = {};
       // mess.Message = "Ny order";
        //mess.From = "Konsolapplikation";
        //mess.To = "Alla";
        //mess.Type = "Order";
        //wss.broadcast(JSON.stringify(mess));
    }
});

server.listen(port, ipaddress, function () {
    console.log((new Date()) + 'Foo was Here! Server is listening on port '+port);


});

wss = new WebSocketServer({
    server: server,
    autoAcceptConnections: false
});


var channels = [];

function JoinChannel(channelname, clientid) {

    var channel = channels.filter(function (a) {
        return a.name == channelname
    })[0];

    if (channel) {
        console.log("Found");
    } else {
        console.log("Not found");

        channel = {};
        channel.clients = [];
        channel.name = channelname;

        channels.push(channel);
    }
    if (!contains(channel.clients, clientid)) {
        channel.clients.push(clientid);
        wss.broadcast(clientid +" har joinat "+channelname);
    }


}
function LeaveChannel(channelname, clientid) {

}

function ChangeUserIdChannels(clientid) {

}
function SendtoChannel(channelname, messageobject) {

    console.log("SendChannel Function")
    console.log("name:"+channelname);
    console.log("object:"+messageobject);

    var channel = channels.filter(function (a) {
        return a.name == channelname
    })[0];

    if (!channel){
        console.log("Hittade inte kanalen")
        return;
    }

    for (i = 0; i < channel.clients.length; i++) {


        var to = channel.clients[i];
        messageobject.to = to;

        console.log(JSON.stringify(messageobject, null, 3))
        wss.sendTo(messageobject);

    }


}


wss.on('connection', function (ws) {

    console.log("New connection - " + new Date());

    ws.on('message', function (message) {

        try {


            ws.lastactivityTime = new Date();

            try {
                var messageobject = JSON.parse(message);
            } catch (err) {

                var msg = GetSendObject(err, "error");
                ws.send(JSON.stringify(msg));
                return;
            }

            messageobject.name = messageobject.name.toLowerCase();


            switch (messageobject.name) {
                case "ping":

                    ws.send(JSON.stringify(GetSendObject("ping back", "ping")));
                    console.log("Got Ping from - " + messageobject.value + " - " + new Date());
                    break;

                case "setname":
                    console.log("Changing name from " + this.id + " to " + messageobject.value);


                    var toremove = [];
                    //todo temp ta bort gamla connections med samma namn

                    delete wss.clients[messageobject.value];

                    for (var i in wss.clients) {


                        if (wss.clients[i].id == messageobject.value) {
                            console.log("pushing " + i)
                            toremove.push(i)

                        }


                    }
//
//
//console.log("to remove")
//console.log(JSON.stringify(toremove))


                    this.id = messageobject.value;
                    ws.send(JSON.stringify(GetSendObject("Id changed", "info")));
                    wss.broadcast(GetSendObject("namechange", "clients"))
                    break;
                case "getname":
                    //   this.Id = messageobject.Content;
                    ws.send(JSON.stringify(GetSendObject(this.id, "id")));

                    break;

                case "setclienttype":
                    this.clienttype = messageobject.value;
                    ws.send(JSON.stringify(GetSendObject("Clienttype changed", "info")));
                    wss.broadcast(GetSendObject("namechange", "clients"))
                    break;

                case "sendto":
                    messageobject.from = this.id;
                    wss.sendTo(messageobject);
                    break;

                case "broadcast":
                    messageobject.from = this.id;
                    messageobject.timestamp = new Date();
                    wss.broadcast(messageobject);
                    break;

                case "getchannels":
                    var channelnames = channels.map(function (v) {
                        return v.name;
                    });

                    var msgobj = GetSendObject(channelnames, "channels");

                    ws.send(JSON.stringify(msgobj));
                    break;

                case "joinchannel":
                 
                    JoinChannel(messageobject.value, this.id);


                    break;


                case "channel":
messageobject.from=this.id;
                    SendtoChannel(messageobject.value, messageobject)
                    //   messageobject.from = this.id;
                    //   messageobject.timestamp = new Date();
                    //  wss.broadcast(messageobject);
                    break;


                case "getclients":
                    var clients = [];
                    for (var i in wss.clients) {
                        var client = {};

                        if (wss.clients[i].id)  client.id = wss.clients[i].id;
                        else client.Id = "noid";
                        client.connectionTime = wss.clients[i].connectionTime;
                        client.lastactivityTime = wss.clients[i].lastactivityTime;


                        clients.push(client);
                    }
                    var msgobj = {};
                    msgobj.clients = clients;
                    ws.send(JSON.stringify(msgobj));
                    break;

            }
        } catch (err) {
            console.log("Fel med ")
            console.log(message)
            console.log(err)
        }
    });


    var GetRandomId = function () {
        var text = "noname_";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 5; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    };

    ws.id = GetRandomId();
    ws.connectionTime = new Date();
    ws.lastactivityTime = ws.connectionTime;


    ws.send(JSON.stringify(GetSendObject("Websocket connection started", "info")));
    ws.send(JSON.stringify(GetSendObject(ws.id, "id")));
    ws.send(JSON.stringify(GetSendObject("To change Id use name 'setname'", "info")));
    wss.broadcast(GetSendObject("A new client has connected", ws.id));
});

console.log("Listening to " + ipaddress + ":" + port + "...");

wss.sendTo = function (message) {
    console.log("Sendto")
    console.log(JSON.stringify(message));
    var toName = message.to;
    for (var i in this.clients) {
        if (this.clients[i].id == toName) {
            this.clients[i].send(JSON.stringify(message));
        }

    }

};

wss.sendTo2 = function (to, value, name) {

    //   var toName=to;

    var msg = GetSendObject(value, name);

    msg.to = to;
    for (var i in this.clients) {
        if (this.clients[i].id == to) {
            console.log("sending to :" + to);
            this.clients[i].send(JSON.stringify(msg));
        }

    }

};
wss.broadcast = function (data) {
    for (var i in this.clients)
        try {
            this.clients[i].send(JSON.stringify(data));
        } catch (err) {
            console.log(err);
        }

};

function sendTime() {
    for (var i in this.clients)
        this.clients[i].send("{ time: new Date().toJSON() }");

}

function GetSendObject(value, name) {

    var msgobj = {};
    msgobj.name = name;
    msgobj.value = value;

    msgobj.timestamp = new Date();

    //  console.log(JSON.stringify(msgobj,null, 3));

    return msgobj;
}
function contains(arr, x) {
    return arr.filter(function (elem) {
            return elem == x
        }).length > 0;
}
setInterval(sendTime, 3000);