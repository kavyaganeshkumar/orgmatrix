const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination(req, file, cb) {
      const uploadPath = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath);
      }
      cb(null, uploadPath);
  },
  filename(req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

const {
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany,
} = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getCompany).post(protect, upload.single('logo'), createCompany);
router.route('/:id').put(protect, upload.single('logo'), updateCompany).delete(protect, deleteCompany);

module.exports = router;
