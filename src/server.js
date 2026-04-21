require("dotenv").config();
const express = require("express");
const cors = require("cors");
const alphabetApiRouter = require("./alphabet-api/controller");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/alphabet", alphabetApiRouter);

app.listen(3000, () => {
    console.log("Server started on port 3000");
});