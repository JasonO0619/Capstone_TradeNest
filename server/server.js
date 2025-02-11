const express = require('express');
const multer = require('multer'); // Multer middleware for handling file uploads
const { createUser, signInUser, verifyIdToken } = require('./auth');
const { addDocument } = require('./firestore');
const { uploadFile } = require('./storage');
const path = require('path');

// Set up multer for file upload (temporary storage)
const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(express.json());

// Route to create a user
app.post('/createUser', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await createUser(email, password);
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to add a post to Firestore
app.post('/addPost', async (req, res) => {
  try {
    const { title, content } = req.body;
    const postId = await addDocument('posts', { title, content });
    res.status(201).json({ message: 'Post added', postId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to upload a file to Firebase Storage
app.post('/uploadFile', upload.single('file'), async (req, res) => {
  try {
    const { file } = req; // Get the uploaded file
    const filePath = file.path; // Temporary file path
    const bucketPath = `profile_pictures/${file.originalname}`; // Define path in Firebase Storage

    // Upload the file to Firebase Storage
    const uploadedUrl = await uploadFile(filePath, bucketPath);

    // Respond with the URL of the uploaded file
    res.status(200).json({ message: uploadedUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
