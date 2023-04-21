var express = require('express');
const multer = require('multer');
var router = express.Router();
const jwt = require('jsonwebtoken');
const validateToken = require('../middleware/TokenVerifier')
const { getFirestore, collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, serverTimestamp, orderBy, limit } = require('firebase/firestore');
const firestore = require('firebase/firestore')
const db = getFirestore();
const blogPosts = collection(db, "blogPosts");

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Specify the destination folder for uploaded files
        cb(null, './public/images');
    },
    filename: (req, file, cb) => {
        // Set the filename for the uploaded file
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// File filter to only allow jpg and png
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        // Accept the file
        cb(null, true);
    } else {
        // Reject the file
        cb(null, false);
    }
};

// Create multer instance with the defined storage
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // Limit file size to 5MB
    },
    fileFilter: fileFilter
});

// Get all blogs
router.get('/', validateToken, async (req, res) => {

    // Get docs from collection
    const sortedBlogPostsQuery = query(blogPosts, orderBy('createdAt', 'asc'));

    try {
        // Get docs from the collection using the sorted query
        const querySnapshot = await getDocs(sortedBlogPostsQuery);

        // Empty array to push data in later
        const allBlogs = [];

        // Push data() in for each doc
        querySnapshot.forEach((doc) => {
            allBlogs.push(doc.data())
        });

        // Render mainPage with allBlogs
        res.render('mainPage', {
            allBlogs: allBlogs || [],
        })
    } catch (error) {
        // JSON response upon error
        res.status(500).json(
            {
                errCode: 500,
                message: error.message
            }
        )
    }
})

// Route to write blog page after authorization
router.get('/create', validateToken, async (req, res) => {
    res.render('writePage');
});

// Get post by :id and render blogPost page after validation
router.get('/:id', validateToken, async (req, res) => {
    // Query for specific blogPost
    const myQuery = query(blogPosts, where("id", "==", req.params.id))
    // Decrypt JWT token to gain userInfo
    const accessToken = jwt.verify(req.cookies.token, 'secret')

    try {
        // Get doc from collection
        const myQuerySnapshot = await getDocs(myQuery)

        // Empty variable to become data()
        let blogPost;

        // Set data() as blogPost
        myQuerySnapshot.forEach((doc) => {
            blogPost = doc.data();
        })

        if (!blogPost) {
            // Render error page if not found
            res.render('error', {
                errCode: 404,
                message: 'Page not found.'
            })
            return;
        }

        // Renders blogPosts page with specific blogPost according to id
        res.render('blogPosts', {
            blogPost,
            uid: accessToken.user.uid
        })

    } catch (error) {
        // Log the error
        console.log('Error found:' + error)
        // JSON response upon error
        res.status(500).json({
            errCode: 500,
            message: error.message
        })
    }


})

// Create and save new blog into firestore after validation
router.post('/create', validateToken, upload.single('image'), async (req, res) => {
    const { title, description, content } = req.body;
    // Decrypt JWT token to gain userInfo
    const accessToken = jwt.verify(req.cookies.token, 'secret')
    // Get filePath from upload
    const filePath = req.file ? req.file.path : '';
    // Remove '/public' from filePath
    const publicRemovedPath = filePath.replace('public', '');

    try {
        // Create a new document with a unique ID in Firestore
        const newDocRef = doc(blogPosts);
        const newDocId = newDocRef.id;

        // Set the data for the newly created document
        await setDoc(newDocRef, {
            id: newDocId,
            title,
            description,
            content,
            uid: accessToken.user.uid,
            author: accessToken.user.email,
            imageFile: publicRemovedPath,
            comments: [],
            likes: [],
            createdAt: Date.now()
        });


        // Log the response
        console.log(newDocRef);

        // JSON response upon success
        res.status(201).json({
            message: 'Blog post created!.',
            firebaseReturn: newDocRef
        })
    } catch (error) {
        // Log the error
        console.log('Error found:' + error)
        // JSON response upon error
        res.status(500).json({
            errCode: 500,
            message: error.message
        })
    }
})

// Get next blog post
router.post('/nextPost', validateToken, async (req, res) => {
    // Get the current post's document reference
    const currentPostRef = doc(blogPosts, req.body.currentPostId);

    try {
        // Get the current post's data
        const currentPostSnapshot = await getDoc(currentPostRef);
        const currentPostData = currentPostSnapshot.data();

        // Query for the next blog post
        const nextPostQuery = query(
            blogPosts,
            where("createdAt", ">", currentPostData.createdAt),
            orderBy("createdAt", "asc"),
            limit(1)
        );

        // Get the next post document
        const nextPostSnapshot = await getDocs(nextPostQuery);

        if (!nextPostSnapshot.empty) {
            // Get the data of the next post
            const nextPostData = nextPostSnapshot.docs[0].data();

            // Return the next post's data as a JSON response
            res.status(200).json(nextPostData);
        } else {
            // If there are no more posts, get the first post available
            const firstPostQuery = query(
                blogPosts,
                orderBy("createdAt", "asc"),
                limit(1)
            );

            const firstPostSnapshot = await getDocs(firstPostQuery);

            if (!firstPostSnapshot.empty) {
                // Get the data of the first post
                const firstPostData = firstPostSnapshot.docs[0].data();

                // Return the first post's data as a JSON response
                res.status(200).json(firstPostData);
            } else {
                // If there is no first post, return a message
                res.status(404).json({
                    message: "No posts available."
                });
            }
        }
    } catch (error) {
        // Log the error
        console.log('Error found:' + error);
        // JSON response upon error
        res.status(500).json({
            errCode: 500,
            message: error.message
        });
    }
});

// Updates blogPost after validation
router.put('/', validateToken, async (req, res) => {
    // Get doc reference
    const docRef = doc(db, 'blogPosts', req.body.id);
    try {
        // Update documents according to object passed
        const response = await updateDoc(docRef, req.body)
        // Logs the response
        console.log(response)
        // JSON response upon success
        res.status(200).json({
            message: 'Update successful.'
        })
    } catch (error) {
        // Logs the error
        console.log(error)
        // JSON response upon error
        res.status(500).json({
            message: 'Update failed. Please try again.'
        })
    }

})

module.exports = router;