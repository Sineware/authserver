console.log("Starting Sineware Cloud Services AuthServer...");
require("dotenv").config()
const express = require("express");
const { Pool } = require("pg");
const argon2 = require('argon2');
const { UniqueID } = require('nodejs-snowflake');
const { v4: uuidv4 } = require('uuid');

const uid = new UniqueID({
    machineID: process.env.MACHINE_ID,
    customEpoch: 1602547200 // Sineware Epoch: Oct 13, 2020
});

const app = express();
const port = process.env.PORT;

const prefix = "/api/v1/";

async function main() {
    console.log("Connecting to PostgresSQL");
    const pool = new Pool();
    console.log((await pool.query("SELECT VERSION()")).rows[0])

    app.use(express.json());

    app.get("/", async (req, res) => {
        res.send({"service": "sineware-authserver", ...(await pool.query("SELECT NOW()")).rows[0]});
    });

    // Authentication
    app.post(prefix + "login", async (req, res) => {
        console.log("debug: new user login:");
        console.log(req.body);
        // todo email or username!
        const text = "SELECT * FROM users WHERE username = $1"
        const values = [req.body.username];
        try {
            const dbres = await pool.query(text, values);
            console.log(dbres);
            if(dbres.rows.length === 0) {
                res.send({success: false, error: "Invalid Credentials"});
                return;
            } else {
                if(await argon2.verify(dbres.rows[0].passhash, req.body.password)) {
                    const accesskey = uuidv4();
                    const text = "UPDATE users SET accesskey = $1 WHERE id = $2"
                    const values = [accesskey, dbres.rows[0].id]
                    await pool.query(text, values);
                    res.send({success: true, accesskey});
                    return;
                } else {
                    res.send({success: false, error: "Invalid Credentials"});
                    return;
                }
            }
        } catch (err) {
            console.log(err.stack);
            // todo friendly error message
            res.send({success: false, error: err.message});
        }
    });
    app.post(prefix + "register", async (req, res) => {
        console.log("debug: new user registration:");
        console.log(req.body);
        const r = req.body;

        // Hash Password
        let passhash = await argon2.hash(r.password);

        // Generate a Snowflake
        const ID = await uid.asyncGetUniqueID();

        // Todo validation
        const text = "INSERT INTO users(id, username, email, fullname, displayname, passhash) VALUES($1, $2, $3, $4, $5, $6) RETURNING id";
        const values = [ID, r.username, r.email, r.fullname, r.displayname, passhash];
        try {
            const dbres = await pool.query(text, values);
            console.log(dbres.rows[0]);
            res.send({
                success: true,
                id: dbres.rows[0].id
            });
        } catch (err) {
            console.log(err.stack);
            // todo friendly error message
            res.send({success: false, error: err.message});
        }
    });

    app.listen(port, () => {
        console.log(`HTTP Server listening at http://0.0.0.0:${port}`);
    });
}
main().then(() => {
    console.log("Sineware Cloud Services AuthServer has started.");
});

// await pool.end()