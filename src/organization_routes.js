async function registerOrganizationRoutes(app, prefix, pool, uid) {
    app.get(prefix + "organization", async (req, res) => {

    });
    app.post(prefix + "organization", async (req, res) => {
        try {
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