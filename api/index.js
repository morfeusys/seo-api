const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
require("dotenv").config();

const RESPONSE_TIMEOUT = 10_000;
const BASE_URL = "https://arsenkin.ru/tools/api/task";

const app = express();
app.use(express.json());

const postTask = async (tool, token, formData) => {
    const fullUrl = `${BASE_URL}/set?token=${token}&tools_name=${tool}`;

    const response = await axios.post(fullUrl, formData, {
        headers: formData.getHeaders(),
    });

    await new Promise(resolve => setTimeout(resolve, RESPONSE_TIMEOUT));
    return response.data.task_id;
}

const getTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { token } = req.query;
        const fullUrl = `${BASE_URL}/result?token=${token}&task_id=${taskId}`;

        const response = await axios.get(fullUrl);
        if (response.data.error_code === -1) {
            await new Promise(resolve => setTimeout(resolve, RESPONSE_TIMEOUT));
            res.redirect(`/result/${taskId}?token=${token}`);
        } else if (response.data.error) {
            res.status(500).json({ success: false, error: response.data.error });
        } else {
            const data = response.data;
            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (item.left) {
                        item.left = Object.fromEntries(Object.entries(item.left).slice(0, 10));
                    }
                });
            }
            res.json(data);
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

app.post("/task", async (req, res) => {
    try {
        const formData = new FormData();
        Object.entries(req.body).forEach(([key, value]) => {
            formData.append(key, typeof value === "string" ? value : JSON.stringify(value));
        });
        const { tool, token } = req.query;
        const taskId = await postTask(tool, token, formData);
        res.redirect(`/result/${taskId}?token=${token}`);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/result/:taskId", getTask);
app.post("/result/:taskId", getTask);

const PORT = process.env.PORT || 8008;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});