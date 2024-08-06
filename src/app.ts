import express from "express";
import router from "./routes"; // Import the router from routes.ts

const app = express();
app.use(express.json());
app.use(router);

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
