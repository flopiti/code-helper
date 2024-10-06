import express from "express";
import {
  getFileContent,
  replaceCode,
  getProjectsInPath,
  getAllFilesSpringBoot,
  getAllFilesNextJs,
  getAllFiles,
  getGitHeadRef,
  getGitDiff,
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

router.get(`/current-branch`, async (req: any, res) => {
  console.log("halo")
  try {
    const branchName = await getGitHeadRef(req.query.dirPath);
    res.status(200).json({ branchName });
  } catch (error) {
    console.log('Error handling GET request:', error);
    res.status(500).json({ error: 'Failed to get the current branch name' });
  }
}
);
router.get(`/get-projects`, async (req: any, res) => { 
  console.log('get-projects is called');
  console.log('atchou')
  getProjectsInPath(req.query.dirPath).then(projects => {
    res.status(200).json(projects);
  }).catch(error => {
    console.error('Failed to get projects:', error);
    res.status(500).json({ error: 'Error in getting the project list' });
  });
});
router.get('/git-diff/:project', async (req, res) => {
  console.log('alo');
  console.log(req.params.project);
  try {
    const project = req.params.project;
    console.log(project);
    const diffOutput = await getGitDiff(project);
    console.log(diffOutput);
    res.status(200).json({ diff: diffOutput });
  } catch (error) {
    console.log('Error handling GET request:', error);
    res.status(500).json({ error: 'Failed to get git diff', details: error });
  }
});
router.get(`/get-all-filenames`, async (req: any, res) => {
  try {
    let response;
    if(req.query.type === 'spring-boot') {
      response = await getAllFilesSpringBoot(`${process.env.DIR_PATH}/${req.query.project}`);
    } else if(req.query.type === 'next-js' || req.query.type === 'node-js') {
      response = await getAllFilesNextJs(`${process.env.DIR_PATH}/${req.query.project}`);
    }
    else if(req.query.type === 'unknown') {
      console.log(`${process.env.DIR_PATH}/${req.query.project}`)
      response = await getAllFiles(`${process.env.DIR_PATH}/${req.query.project}`);
    }
    res.status(200).json(response);
  } catch (error) {
    console.log('Error handling GET request:', error);
    res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

export default router;
