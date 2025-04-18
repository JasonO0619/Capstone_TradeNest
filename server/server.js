const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');


const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const adminRoutes = require('./routes/adminRoutes');
const messageRoutes = require('./routes/messageRoutes');
const favoritesRoutes = require('./routes/favoritesRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const { uploadFile, uploadProfilePicture } = require('./controllers/storageController');

const upload = multer({ dest: 'uploads/' });
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);       
app.use('/api/posts', postRoutes);      
app.use('/api/admin', adminRoutes);     
app.use('/api/messages', messageRoutes);   
app.use('/api/favorites', favoritesRoutes);
app.use('/api/reviews', reviewRoutes);


app.post('/uploadFile', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    const { postType } = req.body;

    if (!file || !postType) {
      return res.status(400).json({ error: 'Missing file or post type.' });
    }

    const filePath = file.path;
    const fileName = `${Date.now()}_${file.originalname}`;
    const uploadedUrl = await uploadFile(filePath, postType, fileName);

    res.status(200).json({ url: uploadedUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/', (req, res) => {
  res.send('🔥 Backend API for your app is running');
});


const PORT = process.env.PORT || 3000;
app.listen(5000, '0.0.0.0', () => {
  console.log("Server running on port 5000");
});
