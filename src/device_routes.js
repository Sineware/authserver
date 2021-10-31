async function registerDeviceRoutes(app, prefix, pool, uid) {
    app.get(prefix + "device/:id", async (req, res) => {
        const dbdeviceres = await pool.query(
            "SELECT id, displayname, orgid, type FROM devices WHERE id=$1 ",
            [req.params.id]);
        console.log(dbdeviceres);

        if(dbdeviceres.rows.length === 1) {
            res.send({success: true, ...dbdeviceres.rows[0]});
        } else {
            res.send({success: false, message: "Could not find device"});
        }
    });
    app.post(prefix + "device/:id", async (req, res) => {

    });

}
module.exports  = registerDeviceRoutes;
