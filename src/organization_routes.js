async function registerOrganizationRoutes(app, prefix, pool, uid) {
    app.get(prefix + "organization/:id", async (req, res) => {
        const dbres = await pool.query(
            "SELECT * FROM organizations WHERE id=$1",
            [req.params.id]);
        console.log(dbres);
        res.send(dbres.rows);
    });
    app.get(prefix + "organization/:id/users", async (req, res) => {
        const dbres = await pool.query(
            "SELECT users.id, users.username, users.email, users.fullname, users.displayname, users.statusmsg FROM organizationusers INNER JOIN users ON organizationusers.userid=users.id WHERE orgid=$1",
            [req.params.id]);
        console.log(dbres);
        res.send(dbres.rows);
    });
    // todo authenticate
    app.get(prefix + "organization/:id/devices", async (req, res) => {
        const dbres = await pool.query(
            "SELECT devices.id, devices.displayname, devices.orgid, devices.type FROM devices WHERE orgid=$1",
            [req.params.id]);
        console.log(dbres);
        res.send(dbres.rows);
    });


    // todo authenticate
    app.post(prefix + "organization", async (req, res) => {
        try {
            return; // disable for now
            const query = "INSERT INTO organizations(id, name) VALUES($1, $2) RETURNING id";
            const ID = await uid.asyncGetUniqueID();
            const values = [ID, req.body.name];
            const dbres = await pool.query(query, values);
            console.log(dbres);
            res.send({
                success: true,
                ...dbres.rows[0]
            });
        } catch(e) {
            res.send({success: false, error: e.message})
        }
    });

}
module.exports  = registerOrganizationRoutes;
