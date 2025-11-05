const express = require('express');
const router = express.Router();
const { getRoleRequirements, getAllCompanies } = require('../services/role.service');

// Get role requirements for specific company and role
router.get('/role-requirements', (req, res) => {
  try {
    const { companyId, role } = req.query;
    
    if (!companyId || !role) {
      return res.status(400).json({
        success: false,
        message: 'Company ID and role are required'
      });
    }

    const requirements = getRoleRequirements(companyId, role);
    
    if (!requirements) {
      return res.status(404).json({
        success: false,
        message: 'Role requirements not found for this company and position'
      });
    }

    res.json({
      success: true,
      data: {
        company: companyId,
        role: role,
        requirements: requirements
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get all companies and their available roles
router.get('/companies', (req, res) => {
  try {
    const companies = getAllCompanies();
    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
