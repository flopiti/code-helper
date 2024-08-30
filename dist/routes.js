"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const functions_1 = require("./functions");
const router = express_1.default.Router();
router.get(`/get-file`, async (req, res) => {
    try {
        const response = await (0, functions_1.getFileContent)(req.query.fileName, req.query.project);
        res.status(200).json(response);
    }
    catch (error) {
        console.log('Error handling request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post(`/replace-code`, async (req, res) => {
    try {
        await (0, functions_1.replaceCode)(req.body.data.project, req.body.data.files);
        res.status(200).json({ message: "received" });
    }
    catch (error) {
        console.log('Error handling POST request:', error);
        res.status(500).json({ error: 'Failed to replace the code' });
    }
});
// router.get(`/spring-boot-classes`, async (req: any, res) => { 
//   const response = await processResources();
//   res.status(200).json(response);
// });
router.get(`/get-projects`, async (req, res) => {
    console.log(req.query);
    (0, functions_1.getProjectsInPath)(req.query.dirPath).then(projects => {
        res.status(200).json(projects);
    }).catch(error => {
        console.error('Failed to get projects:', error);
        res.status(500).json({ error: 'Error in getting the project list' });
    });
});
router.get(`/get-all-filenames`, async (req, res) => {
    try {
        console.log(req.query);
        let response;
        if (req.query.type === 'spring-boot') {
            response = await (0, functions_1.getAllFilesSpringBoot)(`${process.env.DIR_PATH}/${req.query.project}`);
        }
        else if (req.query.type === 'next-js' || req.query.type === 'node-js') {
            response = await (0, functions_1.getAllFilesNextJs)(`${process.env.DIR_PATH}/${req.query.project}`);
        }
        res.status(200).json(response);
    }
    catch (error) {
        console.log('Error handling GET request:', error);
        res.status(500).json({ error: 'Failed to retrieve files' });
    }
});
exports.default = router;
