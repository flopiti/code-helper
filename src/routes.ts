import express from "express";
import {
  buildRestCall,
  createNewResource,
  AddHasManyRelationshipBase,
  processResources,
  getFileContent,
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
  console.log(req.query.fileName)
  const response = await getFileContent(req.query.fileName)
  res.status(200).json(response);

});

router.get(`/spring-boot-classes`, async (req: any, res) => { 
  const response = await processResources();
  res.status(200).json(response);
}
);

export default router;
