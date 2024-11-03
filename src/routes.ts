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
  switchAndPullMain,
  checkoutNewBranch,
  sendIt,
  findDescComments,
  getAllFileDescriptions // Import the new function
} from "./functions";
import { addVectors } from "./functions";  // Import new function
const router = express.Router();

// Existing routes...

router.post('/add-vectors', async (req: any, res) => {
  try {
    const vectors = req.body.vectors;  // Expecting vectors data from the request body
    await addVectors(vectors);
    res.status(200).json({ message: 'Vectors added successfully' });
  } catch (error) {
    console.error('Error adding vectors:', error);
    res.status(500).json({ error: 'Failed to add vectors' });
  }
});

// Existing routes continue...

export default router;
