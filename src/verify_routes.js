async function registerVerifyRoutes(app, prefix, pool, uid) {
    app.post(prefix + "verify/user", async (req, res) => {
        try {
            if(req.body.token === undefined) {
                res.send({success: false, error: "No token provided"});
            }
            console.log("Verifying User: " + req.body.token);

            const dbres = await pool.query(
                "SELECT id, username, email, fullname, displayname, statusmsg FROM users WHERE accesskey=$1 ",
                [req.body.token]);
            console.log(dbres);
            if(dbres.rows.length === 1) {
                res.send({
                    success: true,
                    ...dbres.rows[0]
                });
            } else {
                throw new Error("Invalid Token");
            }

        } catch(e) {
            res.send({success: false, error: e.message})
        }
    });
    app.post(prefix + "verify/device", async (req, res) => {
        try {
            if(req.body.token === undefined) {
                res.send({success: false, error: "No token provided"});
            }
            console.log("Verifying Device: " + req.body.token);
            throw new Error("Not Implemented");
        } catch(e) {
            res.send({success: false, error: e.message})
        }
    });
}
module.exports  = registerVerifyRoutes;
