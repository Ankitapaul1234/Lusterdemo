// const express = require("express");
// const router = express.Router();

// const { generateResponse } = require("../services/gemini");

// router.post("/", async (req, res) => {
//     try {
//         const { message, history } = req.body;

//         if (!message || !message.trim()) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Message is required."
//             });
//         }

//         const response = await generateResponse(
//             message,
//             history || []
//         );

//         res.json({
//             success: true,
//             reply: response
//         });

//     } catch (error) {

//         console.error("Gemini Error:", error);

//         res.status(500).json({
//             success: false,
//             message: "Sorry, I'm having trouble responding right now."
//         });
//     }
// });

// module.exports = router;





















const express = require("express");
const router = express.Router();

const { generateResponse } = require("../services/gemini");

router.post("/", async (req, res) => {

    try {

        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required."
            });
        }

        const response = await generateResponse(message);

        res.json({
            success: true,
            reply: response
        });

    } catch (error) {

        console.error("Gemini Error:", error);

        res.status(500).json({
            success: false,
            message: "Sorry, I'm having trouble responding right now."
        });
    }
});

module.exports = router;