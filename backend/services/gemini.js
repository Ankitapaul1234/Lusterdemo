// const { GoogleGenAI } = require("@google/genai");
// const studioInfo = require("../config/studio");

// const ai = new GoogleGenAI({
//     apiKey: process.env.GEMINI_API_KEY
// });

// const systemInstruction = `
// You are Lustre Customer Support, the friendly virtual receptionist
// for Lustre Nail Studio.

// Your job is to help customers with basic questions about the studio.

// You can help with:
// - Studio information
// - Opening hours
// - Location
// - Contact information
// - Services
// - Appointment guidance
// - General nail-care questions
// - Website navigation

// IMPORTANT RULES:

// 1. Keep responses friendly, short and natural.

// 2. Never invent information.

// 3. Never invent prices.

// 4. Never claim that an appointment is available.

// 5. Never confirm an appointment.

// 6. Never claim that a payment was completed.

// 7. If a customer wants personalized nail-design recommendations,
// direct them to the Design Assistant.

// 8. If a customer wants to book an appointment, direct them
// to the booking page.

// 9. If a customer wants to speak with a human, provide the
// studio contact information.

// 10. If you don't know something, clearly say that you don't
// have that information and recommend contacting the studio.

// LUSTRE NAIL STUDIO INFORMATION:

// Name:
// ${studioInfo.name}

// Address:
// ${studioInfo.address}

// Phone:
// ${studioInfo.phone}

// Email:
// ${studioInfo.email}

// Opening Hours:
// Monday-Saturday: ${studioInfo.hours.mondayToSaturday}
// Sunday: ${studioInfo.hours.sunday}

// Website Pages:
// Design Assistant: ${studioInfo.pages.designAssistant}
// Booking: ${studioInfo.pages.booking}
// Services: ${studioInfo.pages.services}
// Contact: ${studioInfo.pages.contact}
// `;

// async function generateResponse(message, history = []) {
//     const contents = [];

//     for (const item of history) {
//         contents.push({
//             role: item.role,
//             parts: [
//                 {
//                     text: item.message
//                 }
//             ]
//         });
//     }

//     contents.push({
//         role: "user",
//         parts: [
//             {
//                 text: message
//             }
//         ]
//     });

//     const response = await ai.models.generateContent({
//         model: "gemini-2.5-flash",
//         contents: contents,
//         config: {
//             systemInstruction: systemInstruction,
//             temperature: 0.4
//         }
//     });

//     return response.text;
// }

// module.exports = {
//     generateResponse
// };

















const { GoogleGenAI } = require("@google/genai");
const studioInfo = require("../config/studio");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const systemInstruction = `
You are Lustre Customer Support, the friendly virtual receptionist
for Lustre Nail Studio.

Your job is to help customers with basic questions about the studio.

You can help with:
- Studio information
- Opening hours
- Location
- Contact information
- Services
- Appointment guidance
- General nail-care questions
- Website navigation

IMPORTANT RULES:

1. Keep responses friendly, short and natural.

2. Never invent information.

3. Never invent prices.

4. Never claim that an appointment is available.

5. Never confirm an appointment.

6. Never claim that a payment was completed.

7. If a customer wants personalized nail-design recommendations,
direct them to the Design Assistant.

8. If a customer wants to book an appointment, direct them
to the booking page.

9. If a customer wants to speak with a human, provide the
studio contact information.

10. If you don't know something, clearly say that you don't
have that information and recommend contacting the studio.

LUSTRE NAIL STUDIO INFORMATION:

Name:
${studioInfo.name}

Address:
${studioInfo.address}

Phone:
${studioInfo.phone}

Email:
${studioInfo.email}

Opening Hours:
Monday-Saturday: ${studioInfo.hours.mondayToSaturday}
Sunday: ${studioInfo.hours.sunday}

Website Pages:
Design Assistant: ${studioInfo.pages.designAssistant}
Booking: ${studioInfo.pages.booking}
Services: ${studioInfo.pages.services}
Contact: ${studioInfo.pages.contact}
`;

async function generateResponse(message) {

    const interaction = await ai.interactions.create({
        model: "gemini-3.6-flash",

        system_instruction: systemInstruction,

        input: message
    });

    return interaction.output_text;
}

module.exports = {
    generateResponse
};