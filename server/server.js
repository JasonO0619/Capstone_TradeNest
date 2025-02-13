const express = require('express');
const multer = require('multer'); 
const { createUser, signInUser, verifyIdToken } = require('./auth');
const { addDocument } = require('./firestore');
const { uploadFile } = require('./storage');
const path = require('path');


const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(express.json());


app.post('/createUser', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await createUser(email, password);
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post("/addPost", async (req, res) => {
    try {
        const { postType, postData } = req.body;

        
        const validPostTypes = ["sell", "trade", "lend", "lost"];
        if (!validPostTypes.includes(postType)) {
            return res.status(400).json({ error: "Invalid post type." });
        }

       
        if (!postData.createdAt) {
            postData.createdAt = new Date().toISOString();
        }

        const postRef = await db.collection("posts")
            .doc(postType) 
            .collection("items")
            .add(postData);

        res.status(201).json({ message: "Post added successfully", postId: postRef.id });
    } catch (error) {
        console.error("Error adding post:", error);
        res.status(500).json({ error: "Failed to add post" });
    }
});


app.post('/uploadFile', upload.single('file'), async (req, res) => {
  try {
    const { file } = req; 
    const { postType } = req.body; 
    
    if (!file || !postType) {
      return res.status(400).json({ error: "Missing file or post type." });
    }

    const filePath = file.path; 
    const fileName = `${Date.now()}_${file.originalname}`;
    
   
    const uploadedUrl = await uploadFile(filePath, postType, fileName);

    res.status(200).json({ url: uploadedUrl }); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log(`Server running on http://localhost:3000`);
});
