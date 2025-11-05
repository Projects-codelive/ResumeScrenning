const express = require('express');
const router = express.Router();
const CVHistory = require('../models/cvHistory.model');
const auth = require('../middleware/auth.middleware');

// This route is not actively used but kept for potential future use
router.post('/save-cv-history', auth, async (req, res) => {
  try {
    const { companyName, roleName, originalCV, improvedCV, analysisResults } = req.body;
    
    const cvHistory = new CVHistory({
      userId: req.user._id,
      companyName,
      roleName,
      originalCV,
      improvedCV,
      analysisResults
    });

    await cvHistory.save();
    res.json({ success: true, data: cvHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user's CV history list
router.get('/', auth, async (req, res) => {
  try {
    const cvHistory = await CVHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({ success: true, data: cvHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get a single CV history item by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const cvHistoryItem = await CVHistory.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!cvHistoryItem) {
      return res.status(404).json({ success: false, message: 'CV history not found.' });
    }

    res.json({ success: true, data: cvHistoryItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// Update a CV history item
router.put('/:id', auth, async (req, res) => {
  try {
    const { improvedCV, analysisResults } = req.body;
    
    const updatedCV = await CVHistory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { improvedCV, analysisResults, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedCV) {
        return res.status(404).json({ success: false, message: 'CV history not found.' });
    }

    res.json({ success: true, data: updatedCV });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ FIXED: Added the missing DELETE route for CV history
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await CVHistory.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!result) {
      return res.status(404).json({ success: false, message: 'CV history item not found or you do not have permission to delete it.' });
    }

    res.json({ success: true, message: 'CV history item deleted successfully.' });
  } catch (error) {
    console.error('Error deleting CV history item:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


module.exports = router;