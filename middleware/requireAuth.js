const { doc, getDoc } = require("firebase/firestore");
const { db } = require("../firebase");


//--------------------------------GET DOC - getDoc
async function getUser(id) {
    let userDataDoc = null

    const docRef = doc(db, "users", id);

    const docSnap = await getDoc(docRef)
    if (!{ ...docSnap.data().role }) return
    userDataDoc = { ...docSnap.data(), id: docSnap.id }

    return userDataDoc;
}

const requireAuth = async (req, res, next) => {
    try {
        // Get authorization
        const { authorization } = req.headers;

        if (!authorization) {
            return res.status(401).json({ error: "Authorization token required" });
        }

        //  Get user
        // authorization = bearer + token
        //                bearer qqqqqq.wwwww.zzzz
        console.log("authorization:", authorization);

        const tokenId = authorization.split(' ')[1]; // Split by space
        //console.log("tokenId", tokenId);

        // Verify the token
        const user = await getUser(tokenId);
        console.log("user=>", user);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        req.myUser = user;

        // Fire the next handler function
        next();

    } catch (error) {
        console.error("Error:", error);
        res.status(401).json({ error: "Request is not authorized" });
    }
};


//----------- auth roles -------------
const authRoles = (permissions) => { //permissions: coming from the endpoint.
    return (req, res, next) => {
        const userRole = req.myUser.role;
        console.log(`userRole: ${userRole}`)
        if (permissions.includes(userRole)) { return next(); }
        else {
            return res.status(401).send("Unauthorized: you don't have permission!"); // user is not authorized, send an error response
        }
    }
}


module.exports = { requireAuth, authRoles };