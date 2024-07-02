"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const functions_1 = require("./functions");
// import { createNewResource, AddHasManyRelationshipBase, processResources } from "./apiFunctions";
const router = express_1.default.Router();
// router.post("/create-new-resource/:id", (req: any, res) => {
//   const { id } = req.params;
//   createNewResource(id, req.body.data);
//   res.status(200).json({ message: "received" });
// });
// router.post("/has-many", (req: any, res) => {
//   AddHasManyRelationshipBase(req.body.data);
//   res.status(200).json({ message: "received" });
// });
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
    (0, functions_1.replaceCode)(req.body.data.project, req.body.data.files);
    res.status(200).json({ message: "received" });
});
// router.get(`/spring-boot-classes`, async (req: any, res) => { 
//   const response = await processResources();
//   res.status(200).json(response);
// });
router.get(`/get-projects`, async (req, res) => {
    const response = await (0, functions_1.getProjectsInPath)();
    res.status(200).json(response);
});
router.get(`/get-all-filenames`, async (req, res) => {
    console.log(req.query);
    if (req.query.type === 'spring-boot') {
        const response = await (0, functions_1.getAllFilesSpringBoot)(`/Users/nathanpieraut/projects/${req.query.project}`);
        res.status(200).json(response);
    }
    else if (req.query.type === 'next-js') {
        const response = await (0, functions_1.getAllFilesNextJs)(`/Users/nathanpieraut/projects/${req.query.project}`);
        res.status(200).json(response);
    }
    else if (req.query.type === 'node-js') {
        const response = await (0, functions_1.getAllFilesNextJs)(`/Users/nathanpieraut/projects/${req.query.project}`);
        res.status(200).json(response);
    }
});
exports.default = router;
