async function registerUserRoutes(app, prefix, pool, uid) {
    app.get(prefix + "user/:id", async (req, res) => {
        const dbuserres = await pool.query(
            "SELECT id, username, email, fullname, displayname, statusmsg FROM users WHERE id=$1 ",
            [req.params.id]);
        console.log(dbuserres);

        if(dbuserres.rows.length === 1) {
            const dbuserorgres = await pool.query(
                "SELECT * FROM organizationusers WHERE userid=$1 ",
                [req.params.id]);
            console.log(dbuserorgres);

            let user = dbuserres.rows[0];
            let organizations = [];
            for(let org of dbuserorgres.rows) {
                const orgDetails = await pool.query(
                    "SELECT * FROM organizations WHERE id=$1",
                    [org.orgid]
                );
                organizations.push(orgDetails.rows[0]);
            }

            res.send({...user, organizations});
        } else {
            res.send({success: false, message: "Could not find user"});
        }
    });
    app.post(prefix + "user/:id", async (req, res) => {

    });

}
module.exports  = registerUserRoutes;
