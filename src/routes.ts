import express, { Request, Response } from "express";
import {
  getFileContent,
  replaceCode,
  getProjectsInPath,
  getAllFilesSpringBoot,
  getAllFilesNextJs,
  getAllFiles,
  getGitHeadRef,
} from "./functions";
import { checkoutNewBranch, getGitDiff, sendIt, switchAndPullMain } from "./git";
import { checkApiStatus, stopApi, startApi } from "./dev-environments";

const router = express.Router();

router.get('/get-file', async (req: Request, res: Response) => {
  try {
    const { fileName, project } = req.query as { fileName: string; project: string };
    const response = await getFileContent(fileName, project);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/replace-code', async (req: Request, res: Response) => {
  try {
    const { project, files } = req.body.data;
    await replaceCode(project, files);
    res.status(200).json({ message: "received" });
  } catch (error) {
    console.error("Error handling POST request:", error);
    res.status(500).json({ error: "Failed to replace the code" });
  }
});

router.get('/send-it', async (req: Request, res: Response) => {
  try {
    const { project, commitMessage, branchName } = req.query as {
      project: string;
      commitMessage: string;
      branchName: string;
    };
    await sendIt(project, commitMessage, branchName);
    res.status(200).json({ message: "Changes added, committed, and pushed successfully" });
  } catch (error) {
    console.error("Error handling send-it request:", error);
    res.status(500).json({ error: "Failed to send changes" });
  }
});

router.get('/current-branch', async (req: Request, res: Response) => {
  try {
    const { dirPath } = req.query as { dirPath: string };
    const branchName = await getGitHeadRef(dirPath);
    res.status(200).json({ branchName });
  } catch (error) {
    console.error("Error handling GET request:", error);
    res.status(500).json({ error: "Failed to get the current branch name" });
  }
});

router.get('/get-projects', async (req: Request, res: Response) => {
  try {
    const { dirPath } = req.query as { dirPath: string };
    const projects = await getProjectsInPath(dirPath);
    res.status(200).json(projects);
  } catch (error) {
    console.error("Failed to get projects:", error);
    res.status(500).json({ error: "Error in getting the project list" });
  }
});

router.get('/git-diff/:project', async (req: Request, res: Response) => {
  try {
    const { project } = req.params;
    const diffOutput = await getGitDiff(project);
    res.status(200).json({ diff: diffOutput });
  } catch (error) {
    console.error("Error handling GET request:", error);
    res.status(500).json({ error: "Failed to get git diff", details: error });
  }
});

router.get('/get-all-filenames', async (req: Request, res: Response) => {
  try {
    const { project, type } = req.query as { project: string; type: string };
    const projectPath = `${process.env.DIR_PATH}/${project}`;
    let response;

    switch (type) {
      case "spring-boot":
        response = await getAllFilesSpringBoot(projectPath);
        break;
      case "next-js":
      case "node-js":
        response = await getAllFilesNextJs(projectPath);
        break;
      case "unknown":
        response = await getAllFiles(projectPath);
        break;
      default:
        throw new Error("Invalid type");
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error handling GET request:", error);
    res.status(500).json({ error: "Failed to retrieve files" });
  }
});

router.get('/go-main/:projectName', async (req: Request, res: Response) => {
  try {
    const { projectName } = req.params;
    await switchAndPullMain(projectName);
    res.status(200).json({ message: "Switched and pulled main successfully." });
  } catch (error) {
    console.error("Error handling go-main request:", error);
    res.status(500).json({ error: "Failed to switch and pull main." });
  }
});

router.get('/create-branch', async (req: Request, res: Response) => {
  try {
    const { project, branchName } = req.query as { project: string; branchName: string };
    await checkoutNewBranch(project, branchName);
    res.status(200).json({ message: `Created and switched to branch ${branchName}` });
  } catch (error) {
    console.error("Error handling create-branch request:", error);
    res.status(500).json({ error: "Failed to create new branch." });
  }
});

router.get('/check-api-status', (req: Request, res: Response) => {
  const status = checkApiStatus();
  res.status(200).json({ status });
} 
);

router.get('/stop-api', (req: Request, res: Response) => {
  stopApi().then((response) => {
    res.status(200).json({ message: response });
  }
).catch((error) => {
    res.status(500).json({ error: error.message });
  });
});

router.get('/start-api', (req: Request, res: Response) => {
  startApi().then((response) => {
    res.status(200).json({ message: response });
  }
).catch((error) => {
    res.status(500).json({ error: error.message });
});
});

export default router;
