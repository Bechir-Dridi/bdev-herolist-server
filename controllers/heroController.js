const { colRef } = require("../firebase")
//firebase:
const { db } = require("../firebase")
const {
    onSnapshot, addDoc, deleteDoc, doc,
    query, orderBy, serverTimestamp,
    updateDoc,
    getDoc
} = require("firebase/firestore")
const { deleteObject, getDownloadURL, getMetadata, listAll, ref, uploadBytes, uploadString, setString } = require("firebase/storage")
const { storage } = require("../firebase")



//--------------------------------Add IMG:

// 0. ------------------------ firebase ADMIN SDK Config:
var admin = require("firebase-admin")

var serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://next-hero-list-server.appspot.com",
});
//----


const addImg = async (img) => {
    if (!img) return;
    console.log("img_Bucket:", img);

    // 1. ------------------------ Generate signed URL for the uploaded image  

    // Access the initialized admin SDK
    var bucket = admin.storage().bucket();

    const imageBuffer = img.buffer;

    const imageName = img.originalname;
    //const file = bucket.file(imageName);

    const filePath = `images/${imageName}`;
    const file = bucket.file(filePath);

    const result = await file.save(imageBuffer, { contentType: img.mimetype });
    console.log('Image uploaded successfully:', result);

    //2. ------------------------ Generate signed URL for the uploaded image

    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500', // You can set the expiry date as per your requirement
    });

    console.log('Image URL:', url);
    return url;
}

//--------------------------------GET IMG
async function getImg(imgName) {

    //get img ref:
    const imgRef = ref(storage, `images/${imgName}`)

    //get img:
    const url = await getDownloadURL(imgRef)

    return url
}


//--------------------------------DEL IMG
const delImg = async (imgName) => {
    //const { img } = req.params
    // const imgName = img
    //async function delImg(imgName) {
    try {
        console.log("Img to del =>", imgName);

        //get imgs ref:
        const imgRef = ref(storage, `images/${imgName}`)

        deleteObject(imgRef)
            .then(() => {
                console.log({ imgName: imgName, msg: " Hero img deleted" });
            })
            .catch((error) => {
                console.log({ error: error.message })
            });

    } catch (error) {
        // Handle error if the image doesn't exist
        console.error("Error deleting image:", error);
    }
}


//--------------------------------UPDATE IMG
const updateImg = async (img, imgNameToUpdate) => {
    if (!img) return;
    // Get reference to the existing image
    const imgNameToUpdateRef = ref(storage, `images/${imgNameToUpdate}`);

    try {
        // Delete existing image
        await deleteObject(imgNameToUpdateRef);
        console.log("Existing image deleted successfully");
    } catch (error) {
        // Handle error if the image doesn't exist
        console.error("Error deleting existing image to update image:", error);
    }

    // Upload new image
    const imgUrl = await addImg(img)
    return imgUrl;
};




//--------------------------------Add dESCRIPTION:
const addDescription = async (name, description) => {
    if (!description) return;
    //get description ref:
    const descriptionRef = ref(storage, `descriptions/${name}.txt`)

    //upload description:
    await uploadString(descriptionRef, description)

    // Get download URL for the uploaded description
    const downloadURL = await getDownloadURL(descriptionRef);

    console.log("Text uploaded successfully");
    console.log("Download URL:", downloadURL);

    return downloadURL;
    //we added the return to make the await effective in addHero,
    //in order to wait until the img is uploaded
}


//--------------------------------DEL DESCRIPTION
const delDesc = async (descName) => {
    //const delDesc = async (req, res) => {

    //const { desc: descName } = req.params
    console.log("Desc to del =>", descName);

    try {
        //get descs ref:
        const descRef = ref(storage, `descriptions/${descName}`)

        deleteObject(descRef)
            .then(() => {
                console.log(descName, " Hero desc deleted");
            })

    } catch (error) {
        // Handle error if the image doesn't exist
        console.error("Error deleting description:", error);
    }
}


//--------------------------------UPDATE DESCRIPTION
const updateDescription = async (name, newDescription) => {
    if (!newDescription) return;

    // Get reference to the existing description
    const descriptionRef = ref(storage, `descriptions/${name}.txt`);

    try {
        // Delete existing description
        await deleteObject(descriptionRef);
        console.log("Existing description deleted successfully");
    } catch (error) {
        // Handle error if the description doesn't exist
        console.error("Error deleting existing description:", error);
    }

    // Upload new description
    await uploadString(descriptionRef, newDescription);
    console.log("New description uploaded successfully");

    // Get download URL for the uploaded description
    const downloadURL = await getDownloadURL(descriptionRef);
    console.log("Download URL:", downloadURL);

    return downloadURL;
};



//-------------------------------- CREATE hero --------------------------------
const createHero = async (req, res) => {
    //async function addHero(name, from, img, text) {
    const { name, from, text } = req.body
    const img = req.file

    console.log("req.body: ", req.body)
    console.log("req.files: ", req.file)
    console.log("name: ", name)
    console.log("from: ", from)
    console.log("text: ", text)
    console.log("img: ", img)
    try {
        if (name === "" || from === "") {
            return console.log("Fields must be filled!");
        }

        //await addImg(img)
        const imgUrl = await addImg(img)
        console.log("imgggg:", imgUrl);
        //const imgUrl = await getImg(img.originalname)

        const descriptionUrl = await addDescription(name, text)
        //const descriptionUrl = await getDescription(name)
        //console.log("cccc", descriptionUrl)

        addDoc(colRef, {
            name: name,
            from: from,
            imgName: img.originalname,
            imgUrl: imgUrl,
            descriptionName: `${name}.txt`,
            description: descriptionUrl,
            //description: null,
            createdAt: serverTimestamp(),
            fans: [],
            likeSum: null,
            dislikeSum: null,
            heroSum: null,
            villainSum: null
        })
            .then(() => {
                console.log("Hero details submitted")
                res.status(200).json("Hero details submitted");
            })

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
    //}
}


//--------------------------------GET DOC - onSnapshot
// bla bla


//--------------------------------GET DOC - getDoc
async function getHero(id) {

    const docRef = doc(db, "heroes", id);

    const docSnap = await getDoc(docRef)
    //const heroDataDoc = { ...docSnap.data(), id: docSnap.id, img: "" }
    const heroDataDoc = { ...docSnap.data(), id: docSnap.id }

    return heroDataDoc;
}


//--------------------------------DEL DOC
const delHero = async (req, res) => {
    const { id } = req.params
    //function del(id) {
    try {
        const DocRef = doc(db, "heroes", id)//(db, collectionName,docID)
        const { descriptionName, imgName } = await getHero(id)

        deleteDoc(DocRef)
            .then(() => {
                console.log(id, " Hero deleted")
                res.status(200).json({ id: id, msg: "Hero deleted" });
            })

        delDesc(descriptionName)
        delImg(imgName)

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
    // }   
}


//--------------------------------UPDATE DOC
const updateHero = async (req, res) => {
    const { id } = req.params
    const { name, from, text } = req.body
    const img = req.file

    console.log("req.body: ", req.body)
    console.log("req.files: ", req.file)
    console.log("name: ", name)
    console.log("from: ", from)
    console.log("text: ", text)
    console.log("img: ", img)
    try {
        if (name === "" || from === "") {
            return console.log("Fields must be filled!");
        }

        const { imgName: imgNameToUpdate, name: prevDescriptionName } = await getHero(id)
        //await addImg(img)
        const imgUrl = await updateImg(img, imgNameToUpdate)

        const descriptionUrl = await updateDescription(prevDescriptionName, text)

        const DocRef = doc(db, "heroes", id)
        updateDoc(DocRef, {
            name: name,
            from: from,
            ...(img && { imgName: img.originalname, imgUrl: imgUrl }),
            // imgName: img.originalname,
            // imgUrl: imgUrl,
            ...(descriptionUrl && { descriptionName: `${name}.txt`, description: descriptionUrl }),
            createdAt: serverTimestamp(),
        })
            .then(() => {
                console.log(name, ": hero details updated")
                res.status(200).json({ name: name, msg: "hero details updated" });
            })
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}


//------------------------------------- UPDATE HERO -------------------------------------

//--------------------------------UPDATE DOC - LIKE SUM
function likeSum(snapshotHero, DocRef) {
    let prevLikeSum = 0
    let prevDislikeSum = 0
    let prevHeroSum = 0
    let prevVillainSum = 0

    snapshotHero && snapshotHero.fans && snapshotHero.fans.map(fan => {
        if (fan.like === true) { prevLikeSum += 1; }
        if (fan.dislike === true) { prevDislikeSum += 1; }

        if (fan.hero === true) { prevHeroSum += 1; }
        if (fan.villain === true) { prevVillainSum += 1; }
    });

    updateDoc(DocRef, {
        likeSum: prevLikeSum,
        dislikeSum: prevDislikeSum,
        heroSum: prevHeroSum,
        villainSum: prevVillainSum,
    })
}


//--------------------------------UPDATE DOC - LIKE-DISLIKE-ISHERO-ISVILLAIN
// const like = async (req, res) => {
//     const { id } = req.params
//     const { email, myLike: like, myDislike: dislike, myHero: heroLocal, myVillain: villain } = req.body//renaming the req.body props
//     // async function like(id, email, like, dislike, heroLocal, villain) {
//     console.log("req.body", req.body);

//     try {
//         const DocRef = doc(db, "heroes", id)
//         const snapshotHero = await getHero(id);
//         console.log("SNAP SNAP", snapshotHero);


//         let LIKE = null;
//         let DISLIKE = null;
//         let HERO = null;
//         let VILLAIN = null;

//         let EMAIL = email;
//         if (like) { LIKE = like; }
//         if (dislike) { DISLIKE = dislike; }
//         if (heroLocal) { HERO = heroLocal; }
//         if (villain) { VILLAIN = villain; }

//         console.log('evaluation:', LIKE, DISLIKE, HERO, VILLAIN);


//         //----new fan:
//         const newFan = async () => {
//             const fan = {
//                 email: EMAIL,
//                 like: LIKE ? LIKE : false,
//                 dislike: DISLIKE ? DISLIKE : false,
//                 hero: HERO ? HERO : false,
//                 villain: VILLAIN ? VILLAIN : false,
//             };
//             updateDoc(DocRef, {
//                 fans: [...snapshotHero.fans, fan]
//             })

//             // Get updated snapshot
//             const updatedSnapshotHero = await getHero(id);
//             // Recalculate totals and update document 
//             likeSum(updatedSnapshotHero, DocRef)

//             res.status(200).json({ email: email, msg: "new fan added" });
//         }


//         //----update fan:
//         const updateFan = async () => {
//             snapshotHero?.fans.map(fan => {
//                 if (fan.email === EMAIL) {
//                     if (LIKE) { fan.like = LIKE; fan.dislike = false }
//                     if (DISLIKE) { fan.like = false; fan.dislike = DISLIKE }

//                     if (HERO) { fan.hero = HERO; fan.villain = false }
//                     if (VILLAIN) { fan.hero = false; fan.villain = VILLAIN }
//                 }
//             });
//             updateDoc(DocRef, {
//                 fans: snapshotHero.fans
//             })

//             // Get updated snapshot
//             const updatedSnapshotHero = await getHero(id);
//             // Recalculate totals and update document 
//             likeSum(updatedSnapshotHero, DocRef)

//             res.status(200).json({ email: EMAIL, msg: "existed email likes a hero" });
//         }



//         if (snapshotHero && snapshotHero.fans && snapshotHero.fans.some(fan => fan.email === EMAIL)) {
//             updateFan()
//             console.log(EMAIL, 'email exists in fans');
//             // likeSum(snapshotHero, DocRef)
//         } else {
//             newFan()
//             console.log(EMAIL, 'email can be added into fans !');
//             // likeSum(snapshotHero, DocRef)
//         }
//     } catch (error) {
//         res.status(400).json({ error: error.message })
//     }
// }

//--------------------------------UPDATE DOC - LIKE
const like = async (req, res) => {
    const { id } = req.params
    const { email } = req.body//renaming the req.body props
    // async function like(id, email, like, dislike, heroLocal, villain) {
    console.log("req.body", req.body);

    try {
        const DocRef = doc(db, "heroes", id)
        const snapshotHero = await getHero(id);
        console.log("SNAP SNAP", snapshotHero);


        //let DISLIKE = null;

        let EMAIL = email;
        //if (dislike) { DISLIKE = true; }

        //console.log('evaluation:', DISLIKE,);


        //----new fan:
        const newFan = async () => {
            const fan = {
                email: EMAIL,
                dislike: false,

                like: true,
                hero: false,
                villain: false,
            };
            updateDoc(DocRef, {
                fans: [...snapshotHero.fans, fan]
            })

            // Get updated snapshot
            const updatedSnapshotHero = await getHero(id);
            // Recalculate totals and update document 
            likeSum(updatedSnapshotHero, DocRef)

            res.status(200).json({ email: email, msg: "new fan added" });
        }


        //----update fan:
        const updateFan = async () => {
            snapshotHero?.fans.map(fan => {
                if (fan.email === EMAIL) {
                    fan.like = true; fan.dislike = false
                }
            });
            updateDoc(DocRef, {
                fans: snapshotHero.fans
            })

            // Get updated snapshot
            const updatedSnapshotHero = await getHero(id);
            // Recalculate totals and update document 
            likeSum(updatedSnapshotHero, DocRef)

            res.status(200).json({ email: EMAIL, msg: "existed email likes a hero" });
        }



        if (snapshotHero && snapshotHero.fans && snapshotHero.fans.some(fan => fan.email === EMAIL)) {
            updateFan()
            console.log(EMAIL, 'email exists in fans');
            // likeSum(snapshotHero, DocRef)
        } else {
            newFan()
            console.log(EMAIL, 'email can be added into fans !');
            // likeSum(snapshotHero, DocRef)
        }
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}


//--------------------------------UPDATE DOC - DISLIKE
const dislike = async (req, res) => {
    const { id } = req.params
    const { email } = req.body//renaming the req.body props
    // async function like(id, email, like, dislike, heroLocal, villain) {
    console.log("req.body", req.body);

    try {
        const DocRef = doc(db, "heroes", id)
        const snapshotHero = await getHero(id);
        console.log("SNAP SNAP", snapshotHero);


        let DISLIKE = null;

        let EMAIL = email;
        //if (dislike) { DISLIKE = true; }

        //console.log('evaluation:', DISLIKE,);


        //----new fan:
        const newFan = async () => {
            const fan = {
                email: EMAIL,
                dislike: true,

                like: false,
                hero: false,
                villain: false,
            };
            updateDoc(DocRef, {
                fans: [...snapshotHero.fans, fan]
            })

            // Get updated snapshot
            const updatedSnapshotHero = await getHero(id);
            // Recalculate totals and update document 
            likeSum(updatedSnapshotHero, DocRef)

            res.status(200).json({ email: email, msg: "new fan added" });
        }


        //----update fan:
        const updateFan = async () => {
            snapshotHero?.fans.map(fan => {
                if (fan.email === EMAIL) {
                    fan.like = false; fan.dislike = true
                }
            });
            updateDoc(DocRef, {
                fans: snapshotHero.fans
            })

            // Get updated snapshot
            const updatedSnapshotHero = await getHero(id);
            // Recalculate totals and update document 
            likeSum(updatedSnapshotHero, DocRef)

            res.status(200).json({ email: EMAIL, msg: "existed email dislikes a hero" });
        }



        if (snapshotHero && snapshotHero.fans && snapshotHero.fans.some(fan => fan.email === EMAIL)) {
            updateFan()
            console.log(EMAIL, 'email exists in fans');
            // likeSum(snapshotHero, DocRef)
        } else {
            newFan()
            console.log(EMAIL, 'email can be added into fans !');
            // likeSum(snapshotHero, DocRef)
        }
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}


//--------------------------------UPDATE DOC - ISHEROFUNC
const isHeroFunc = async (req, res) => {
    const { id } = req.params
    const { email } = req.body//renaming the req.body props
    // async function like(id, email, like, dislike, heroLocal, villain) {
    console.log("req.body", req.body);

    try {
        const DocRef = doc(db, "heroes", id)
        const snapshotHero = await getHero(id);
        console.log("SNAP SNAP", snapshotHero);


        let isHero = null;

        let EMAIL = email;
        //if (dislike) { DISLIKE = true; }

        //console.log('evaluation:', DISLIKE,);


        //----new fan:
        const newFan = async () => {
            const fan = {
                email: EMAIL,
                dislike: false,

                like: false,
                hero: true,
                villain: false,
            };
            updateDoc(DocRef, {
                fans: [...snapshotHero.fans, fan]
            })

            // Get updated snapshot
            const updatedSnapshotHero = await getHero(id);
            // Recalculate totals and update document 
            likeSum(updatedSnapshotHero, DocRef)

            res.status(200).json({ email: email, msg: "new fan added" });
        }


        //----update fan:
        const updateFan = async () => {
            snapshotHero?.fans.map(fan => {
                if (fan.email === EMAIL) {
                    fan.hero = true; fan.villain = false
                }
            });
            updateDoc(DocRef, {
                fans: snapshotHero.fans
            })

            // Get updated snapshot
            const updatedSnapshotHero = await getHero(id);
            // Recalculate totals and update document 
            likeSum(updatedSnapshotHero, DocRef)

            res.status(200).json({ email: EMAIL, msg: "existed email sees this hero as a hero" });
        }



        if (snapshotHero && snapshotHero.fans && snapshotHero.fans.some(fan => fan.email === EMAIL)) {
            updateFan()
            console.log(EMAIL, 'email exists in fans');
            // likeSum(snapshotHero, DocRef)
        } else {
            newFan()
            console.log(EMAIL, 'email can be added into fans !');
            // likeSum(snapshotHero, DocRef)
        }
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}


//--------------------------------UPDATE DOC - ISVILLAINFUNC
const isVillainFunc = async (req, res) => {
    const { id } = req.params
    const { email } = req.body//renaming the req.body props
    // async function like(id, email, like, dislike, heroLocal, villain) {
    console.log("req.body", req.body);

    try {
        const DocRef = doc(db, "heroes", id)
        const snapshotHero = await getHero(id);
        console.log("SNAP SNAP", snapshotHero);


        let isVillain = null;

        let EMAIL = email;
        //if (dislike) { DISLIKE = true; }

        //console.log('evaluation:', DISLIKE,);


        //----new fan:
        const newFan = async () => {
            const fan = {
                email: EMAIL,
                dislike: false,

                like: false,
                hero: false,
                villain: true,
            };
            updateDoc(DocRef, {
                fans: [...snapshotHero.fans, fan]
            })

            // Get updated snapshot
            const updatedSnapshotHero = await getHero(id);
            // Recalculate totals and update document 
            likeSum(updatedSnapshotHero, DocRef)

            res.status(200).json({ email: email, msg: "new fan added" });
        }


        //----update fan:
        const updateFan = async () => {
            snapshotHero?.fans.map(fan => {
                if (fan.email === EMAIL) {
                    fan.hero = false; fan.villain = true
                }
            });
            updateDoc(DocRef, {
                fans: snapshotHero.fans
            })

            // Get updated snapshot
            const updatedSnapshotHero = await getHero(id);
            // Recalculate totals and update document 
            likeSum(updatedSnapshotHero, DocRef)

            res.status(200).json({ email: EMAIL, msg: "existed email sees this hero as a villain" });
        }



        if (snapshotHero && snapshotHero.fans && snapshotHero.fans.some(fan => fan.email === EMAIL)) {
            updateFan()
            console.log(EMAIL, 'email exists in fans');
            // likeSum(snapshotHero, DocRef)
        } else {
            newFan()
            console.log(EMAIL, 'email can be added into fans !');
            // likeSum(snapshotHero, DocRef)
        }
    } catch (error) {
        res.status(400).json({ error: error.message })
    }
}


module.exports = {
    getHero,
    createHero, addImg, addDescription,
    //heroMain,
    //getImg,
    delHero, delImg, delDesc,
    updateHero,
    //isLoading,
    like, dislike, isHeroFunc, isVillainFunc
}