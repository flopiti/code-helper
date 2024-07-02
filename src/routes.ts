import express from "express";
import {
  getFileContent,
  replaceCode,
  getProjectsInPath,
  getAllFilesSpringBoot,
  getAllFilesNextJs,
} from "./functions";
const router = express.Router();

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
  try {
    await replaceCode(req.body.data.project, req.body.data.files);
    res.status(200).json({ message: "received" });
  } catch (error) {
    console.log('Error handling POST request:', error);
    res.status(500).json({ error: 'Failed to replace the code' });
  }
});

// router.get(`/spring-boot-classes`, async (req: any, res) => { 
//   const response = await processResources();
//   res.status(200).json(response);
// });

router.get(`/get-projects`, async (req: any, res) => { 
  getProjectsInPath().then(projects => {
    res.status(200).json(projects);
  }).catch(error => {
    console.error('Failed to get projects:', error);
    res.status(500).json({ error: 'Error in getting the project list' });
  });
});

router.get(`/get-all-filenames`, async (req: any, res) => {
  try {
    console.log(req.query);
    let response;
    if(req.query.type === 'spring-boot') {
      response = await getAllFilesSpringBoot(`${process.env.DIR_PATH}/${req.query.project}`);
    } else if(req.query.type === 'next-js' || req.query.type === 'node-js') {
      response = await getAllFilesNextJs(`${process.env.DIR_PATH}/${req.query.project}`);
    }
    res.status(200).json(response);
  } catch (error) {
    console.log('Error handling GET request:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

export default router;
