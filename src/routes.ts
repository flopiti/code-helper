import express from "express";
import {
  buildRestCall,
  createNewResource,
  AddHasManyRelationshipBase,
  processResources,
  getFileContent,
  replaceCode,
  getAllFiles,
  getProjectsInPath,
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

router.get(`/get-file`, async (req: any, res) => {
  const response = await getFileContent(req.query.fileName)
  res.status(200).json(response);
});

router.post(`/replace-code`, async (req: any, res) => {
  replaceCode(req.body.data.fileName, req.body.data.code);
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

  if(req.query.project === 'natetrystuff-api') {
    console.log('natetrystuff-api')
  }
  else if(req.query.project === 'natetrystuff-web') {
    console.log('natetrystuff-ui')
  }
  else if(req.query.project === 'code-helper') {
    console.log('natetrystuff')
  }

  const response = await getAllFiles(`/Users/nathanpieraut/projects/${req.query.project}`);
  res.status(200).json(response);
});

export default router;
