const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const app = express();

const PORT = 8080;

app.use(express.static(path.join(__dirname, "build")));
app.use(bodyParser.json());
app.use(cors());

const headers = ["time", "event", "action", "type", "user"];
const LOG_FILE = "./log.csv";
const stream = fs.createWriteStream(LOG_FILE, {flags: 'a'});

function makeCsv(str, element) {


	        return str === "" ? element : str + "," + element;
}

stream.write(headers.reduce(makeCsv, "") + "\n");



async function appendToLogs(stream, body) {

	        let arr = [body.time, body.event, body.action, body.type, body.user];
	        let appendFile = await stream.write(arr.reduce(makeCsv, "") + "\n");
	        return appendFile;
}

app.post("/logs", (req, res) => {
	        console.log('body:', req.body);

	        appendToLogs(stream, req.body)
	                .then((status) => {
				                        res.sendStatus(200);
				                })
	                .catch((err) => {
				                        console.err(err);
				                        res.sendStatus(500);
				                });

});


app.listen(PORT, () => {
	        console.info("Server listening on port %s...", PORT);
});

