const roleDatabase = {
  "google_Software Engineer": {
    skills: ["JavaScript", "React", "Node.js", "Cloud Computing", "Algorithms", "System Design"],
    experience: 2,
    jobDescription: "Build scalable web applications, collaborate with cross-functional teams, write clean and maintainable code, participate in code reviews, and contribute to architectural decisions."
  },
  "google_Data Analyst": {
    skills: ["Python", "SQL", "Data Visualization", "Statistics", "Machine Learning", "Tableau"],
    experience: 1,
    jobDescription: "Analyze large datasets to derive business insights, create data visualizations, build predictive models, and present findings to stakeholders."
  },
  "google_Product Manager": {
    skills: ["Product Strategy", "Agile", "Scrum", "User Research", "Analytics", "Roadmap Planning"],
    experience: 3,
    jobDescription: "Define product vision and strategy, work with engineering and design teams, conduct market research, and manage product roadmaps."
  },
  "amazon_Software Developer": {
    skills: ["Java", "AWS", "Microservices", "Docker", "Kubernetes", "System Design"],
    experience: 2,
    jobDescription: "Develop and maintain cloud-native applications, design distributed systems, optimize performance, and ensure scalability."
  },
  "amazon_Data Scientist": {
    skills: ["Python", "Machine Learning", "Deep Learning", "AWS SageMaker", "Statistics", "Big Data"],
    experience: 3,
    jobDescription: "Build machine learning models, analyze complex datasets, develop algorithms, and deploy ML solutions at scale."
  },
  "amazon_Operations Manager": {
    skills: ["Operations Management", "Process Improvement", "Leadership", "Analytics", "Six Sigma"],
    experience: 4,
    jobDescription: "Oversee daily operations, optimize processes, manage teams, analyze operational metrics, and drive continuous improvement."
  },
  "microsoft_Product Manager": {
    skills: ["Product Management", "Azure", "Agile", "Strategic Planning", "Customer Research"],
    experience: 3,
    jobDescription: "Drive product strategy for cloud services, collaborate with engineering teams, analyze market trends, and manage product lifecycle."
  },
  "microsoft_Cloud Engineer": {
    skills: ["Azure", "PowerShell", "ARM Templates", "DevOps", "Networking", "Security"],
    experience: 2,
    jobDescription: "Design and implement cloud infrastructure, automate deployments, ensure security compliance, and optimize cloud costs."
  },
  "microsoft_Business Analyst": {
    skills: ["Business Analysis", "Requirements Gathering", "Process Mapping", "SQL", "Power BI"],
    experience: 2,
    jobDescription: "Analyze business requirements, document processes, create functional specifications, and work with stakeholders to deliver solutions."
  }
};

function getRoleRequirements(companyId, role) {
  const key = `${companyId}_${role}`;
  return roleDatabase[key] || null;
}

function getAllCompanies() {
  const companies = {};
  Object.keys(roleDatabase).forEach(key => {
    const [companyId, role] = key.split('_');
    if (!companies[companyId]) {
      companies[companyId] = [];
    }
    companies[companyId].push(role);
  });
  return companies;
}

module.exports = { 
  getRoleRequirements,
  getAllCompanies,
  roleDatabase
};
