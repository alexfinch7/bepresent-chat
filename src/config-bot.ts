import OpenAI from "openai";
import readlineSync from 'readline-sync';
import dotenv from "dotenv";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources";
import chalk from "chalk";
import fs from 'fs';

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const tools: ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            "name": "set_schedule",
            "description": "Set an initial phone blocking schedule",
            "parameters": {
                "type": "object",
                "required": ["wakeup", "sleep", "times"],
                "properties": {
                    "wakeup": { "type": "string" },
                    "sleep": { "type": "string" },
                    "times": {
                        "type": "array",
                        "items": { "type": "string" }
                    }
                }
            }
        },
    },
];

const tools2: ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            "name": "set_goal",
            "description": "Set app intensity score",
            "parameters": {
                "type": "object",
                "required": ["intensity_score"],
                "properties": {
                    "intensity_score": { "type": "number" }
                }
            }
        },
    },
];

const setSchedule = ({ wakeup, sleep, times }) => {
    console.log("Schedule set with wakeup:", wakeup, "sleep:", sleep, "times:", times);
    saveToFile({ wakeup, sleep, times });
};

const setGoal = ({ intensity_score }) => {
    console.log("Goal set with intensity score:", intensity_score);
    saveToFile({ intensity_score });
};

const saveToFile = (data) => {
    const filePath = 'be_present_config.json';
    fs.readFile(filePath, 'utf8', (err, fileData) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File does not exist, create it
                fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8', (err) => {
                    if (err) {
                        console.error("Error writing file:", err);
                    } else {
                        console.log("Configuration updated.");
                    }
                });
            } else {
                console.error("Error reading file:", err);
            }
        } else {
            // File exists, merge data
            const existingData = JSON.parse(fileData);
            const mergedData = { ...existingData, ...data };
            fs.writeFile(filePath, JSON.stringify(mergedData, null, 2), 'utf8', (err) => {
                if (err) {
                    console.error("Error writing file:", err);
                } else {
                    console.log("Configuration updated.");
                }
            });
        }
    });
};

async function checkAPIConnection() {
    try {
        const response = await openai.models.list();
        if (response.data) {
            console.log("API connection successful");
        } else {
            console.log("Connection unsuccessful, proceed to manual configuration");
        }
    } catch (error) {
        console.error("Failed to connect to OpenAI API:", error.message);
    }
}

let sched = true;
let inten = false;

async function main() {
    await checkAPIConnection();
    // context for each part of the conversation.
    const history: ChatCompletionMessageParam[] = [
        { role: "system", content: "You function as the configuration bot for BePresent, an app that is designed to reduce screen time. You are an expert in times and human rhythms. Your goal is to get a few metrics from the user while maintaining a friendly, spa-like presence. When you start off your questioning, provide a few words, very brief, on why these questions are important - link between routines and phone use. FIRST: you need to get the person's phone habits: when they wake up. SECOND: when they sleep. THIRD: what time frames in particular they use their phone most - let them respond in any way they want. Play the role of a doctor inquiring step by step. For example, in THIRD: if they say ‘before bed’ or ‘after I wake up’ don't ask them again, infer when the time is. If they give something more general like 'after work' you can ask when work ends, to figure out that time interval. After they give you an answer, you must confirm if those are the only times. Then, after your conversation, call set_schedule formatting the data you got in a specific way: the wakeup parameter being the time they wake up, the sleep parameter being the time they sleep, and the times parameter being an array of times that you would block ALL phone usage based on user responses so be careful, YOU NEED TO FORMAT these parameters as military times like '00:00'. If they say they use their phone when they sleep or wake, block that hour, plus a padding hour - use your reasoning, if they say they don't, don't block around those times. Don't ask multiple questions in one response, not even sleep and wake times." },
        { role: "user", content: "follow the system's instructions and make sure you call set_schedule with military time in the parameters" },
        { role: "assistant", content: "Hi! I'm Bea, here to customize your experience on BePresent and help you reduce your screen time! Shall we get started?" }
    ];
    const history2: ChatCompletionMessageParam[] = [
        { role: "system", content: "You function as the configuration bot for BePresent, an app that is designed to reduce screen time. Your goal is to as the user a few questions about what he wants to use BePresent for and then based on his responses, call set_goal with an intensity score of how restrictive you think the app should be to meet the goal, but don't explicitly ask this. For example, 1 would be for a user who just wants to reduce it very slightly, 10 would be for a user who wants to totally get off of it. If the user wants to cut down screen time by a specific amount of time or number of hours, inquire about how long their screen time is now, and then make a judgement. For example, if they want to cut their hours by half, and they have 4 hours, thats a two hour difference a day, and would warrant a score of around 6" },

        { role: "assistant", content: "Almost there! To finish off, what are your desired screen time goals? For example, do you want to use BePresent to stop some scrolling here and there, or, perhaps, do you want to completely cut out all screen time from your day?" }
    ];

    console.log(chalk.cyan("\nHi! I'm Bea, here to customize your experience on BePresent and help you reduce your screen time! Shall we get started?\n"));
    // part one - blocking schedule
    while (sched) {
        const userInput = readlineSync.question(chalk.magenta("∴") + " ");
        history.push({ role: "user", content: userInput });

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: history,
                tools: tools,
                tool_choice: "auto"
            });

            const responseMessage = completion.choices[0].message;

            if (responseMessage.tool_calls) {
                const availableFunctions = {
                    set_schedule: setSchedule,
                };

                for (const toolCall of responseMessage.tool_calls) {
                    const functionName = toolCall.function.name;
                    const functionToCall = availableFunctions[functionName as keyof typeof availableFunctions];
                    const functionArgs = JSON.parse(toolCall.function.arguments);
                    functionToCall(functionArgs);
                    console.log(chalk.cyan("Thank's so much for that information! We have updated your BePresent configuration."));
                    console.log(chalk.cyan("To finish off, what are your desired screen time goals? For example, do you want to use BePresent to stop some scrolling here and there, or, perhaps, do you want to completely cut out all screen time from your day?"));
                    sched = false;
                    inten = true;
                }

            }
            if (responseMessage.content && sched) {
                console.log(chalk.cyan("\n" + responseMessage.content + "\n"));
                history.push({ role: "assistant", content: responseMessage.content });
            }

        } catch (error) {
            console.error("Error during OpenAI API call:", error);
        }
    }
    // part 2 - app restriction intensity
    while (inten) {
        const userInput = readlineSync.question(chalk.magenta("∴") + " ");
        history2.push({ role: "user", content: userInput });

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: history2,
                tools: tools2,
                tool_choice: "auto"
            });

            const responseMessage = completion.choices[0].message;
            if (responseMessage.tool_calls) {
                const availableFunctions = {
                    set_goal: setGoal,
                };

                for (const toolCall of responseMessage.tool_calls) {
                    const functionName = toolCall.function.name;
                    const functionToCall = availableFunctions[functionName as keyof typeof availableFunctions];
                    const functionArgs = JSON.parse(toolCall.function.arguments);
                    functionToCall(functionArgs);
                    console.log(chalk.cyan("Great - I've configured BePresent to suit your specific schedule and needs. If you ever have questions or need to feel a little more present, I'm here to chat!"));
                    inten = false;
                }
            }
            if (responseMessage.content && inten) {
                console.log(chalk.cyan("\n" + responseMessage.content + "\n"));
                history.push({ role: "assistant", content: responseMessage.content });
            }
        } catch (error) {
            console.error("Error during OpenAI API call:", error);
        }
    }
}

main();
