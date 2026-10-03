// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");

// const chatRoute = require("./routes/chat");

// const app = express();

// const PORT = process.env.PORT || 5000;

// app.use(cors());
// app.use(express.json());

// app.get("/", (req, res) => {
//     res.json({
//         message: "Lustre Customer Support Backend is running!"
//     });
// });

// app.use("/api/chat", chatRoute);

// app.listen(PORT, () => {
//     console.log(`Lustre backend running on http://localhost:${PORT}`);
// });








require("dotenv").config();

const express = require("express");
const cors = require("cors");

const chatRoute = require("./routes/chat");
const appointmentRoute = require("./routes/appointments");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());


app.get("/", (req, res) => {

    res.json({
        message:
            "Lustre Customer Support Backend is running!"
    });

});


app.use(
    "/api/chat",
    chatRoute
);


app.use(
    "/api/appointments",
    appointmentRoute
);


app.listen(PORT, () => {

    console.log(
        `Lustre backend running on http://localhost:${PORT}`
    );

});