console.log("Starting Sineware Cloud Services AuthServer...");
require("dotenv").config()
const express = require("express");
const { Pool } = require("pg");
const argon2 = require('argon2');
const { UniqueID } = require('nodejs-snowflake');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors')

const registerOrganizationRoutes = require("./organization_routes");
const registerUserRoutes = require("./user_routes");
const registerVerifyRoutes = require("./verify_routes");
const registerDeviceRoutes = require("./device_routes");

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

    app.use(cors());
    app.use(express.json());

    console.log("Registering Routes: ");
    app.get("/", async (req, res) => {
        res.send({"service": "sineware-authserver", "machine_id": process.env.MACHINE_ID, ...(await pool.query("SELECT NOW()")).rows[0]});
    });

    // Authentication
    // todo integrate external LDAP for enterprise
    app.post(prefix + "login", async (req, res) => {
        console.log("debug: new user login:");
        console.log(req.body);
        try {
            const dbres = await pool.query(
                "SELECT * FROM users WHERE username = $1 OR email = $1",
                [req.body.username]
            );
            console.log(dbres);
            if(dbres.rows.length === 0) {
                throw {message: "Invalid Credentials"};
            } else if(dbres.rows.length === 1) {
                let user = dbres.rows[0];
                if(await argon2.verify(user.passhash, req.body.password)) {
                    // todo: geoip, otp, etc
                    if(user.accesskey === null) {
                        const accesskey = uuidv4();
                        const text = "UPDATE users SET accesskey = $1 WHERE id = $2";
                        const values = [accesskey, dbres.rows[0].id];
                        await pool.query(text, values);
                        res.send({success: true, accesskey});
                    } else {
                        res.send({success: true, accesskey: user.accesskey});
                    }
                } else {
                    throw {message: "Invalid Credentials"};
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

        // Todo validation (email etc)
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

    await registerOrganizationRoutes(app, prefix, pool, uid);
    await registerUserRoutes(app, prefix, pool, uid);
    await registerVerifyRoutes(app, prefix, pool, uid);

    app.listen(port, () => {
        console.log(`HTTP Server listening at http://0.0.0.0:${port}`);
    });
}
main().then(() => {
    console.log("Sineware Cloud Services AuthServer has started.");
});

// await pool.end()
