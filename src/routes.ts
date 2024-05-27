import express from "express";
import {
  buildRestCall,
  createNewResource,
  AddHasManyRelationshipBase,
  processResources,
  getFileContent,
  replaceCode,
  getProjectsInPath,
  getAllFilesSpringBoot,
  getAllFilesNextJs,
} from "./functions";
const router = express.Router();

router.post("/create-new-resource/:id", (req: any, res) => {
  const { id } = req.params;
  createNewResource(id, req.body.data);
  res.status(200).json({ message: "received" });
});

router.post("/has-many", (req: any, res) => {
  AddHasManyRelationshipBase(req.body.data);
  res.status(200).json({ message: "received" });
});

router.get(`/get-file`, async (req:any, res) => {
  try {
    const response = await getFileContent(req.query.fileName, req.query.project);
    res.status(200).json(response);
  } catch (error) {
    console.log('Error handling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.post(`/replace-code`, async (req: any, res) => {
  replaceCode(req.body.data.fileName, req.body.data.code, req.body.data.project);
  res.status(200).json({ message: "received" });
});

router.get(`/spring-boot-classes`, async (req: any, res) => { 
  const response = await processResources();
  res.status(200).json(response);
});

router.get(`/get-projects`, async (req: any, res) => { 
  const response = await getProjectsInPath();
  res.status(200).json(response);
});

router.get(`/get-all-filenames`, async (req: any, res) => {
  console.log(req.query);

  if(req.query.type === 'spring-boot') {
    const response = await getAllFilesSpringBoot(`/Users/nathanpieraut/projects/${req.query.project}`);
    res.status(200).json(response);
  }
  else if(req.query.type === 'next-js') {
    const response = await getAllFilesNextJs(`/Users/nathanpieraut/projects/${req.query.project}`);
    res.status(200).json(response);
  }
  else if(req.query.type === 'node-js') {
    const response = await getAllFilesNextJs(`/Users/nathanpieraut/projects/${req.query.project}`);
    res.status(200).json(response);
  }
});

export default router;
