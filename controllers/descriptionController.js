const { getHero } = require("./heroController")



const getDescription = async (req, res) => {
    const { id } = req.params
    //console.log("desc id:", id);

    try {
        const { description: descriptionUrl } = await getHero(id)
        //console.log("desc ", descriptionUrl);

        fetch(descriptionUrl)
            .then(response => {
                //console.log("DESCRIPTION_res:", response);
                return response.text();
            })
            .then(data => {
                //console.log("DESCRIPTION_data:", data);
                res.status(200).json({ the_description: data });
            })

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}


module.exports = {
    getDescription,
}