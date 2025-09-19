import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import cors from "cors";
import { text } from "stream/consumers";

const app = express();
const upload = multer();
const ai = new GoogleGenAI({});

//inisialisasi model AI
const geminiModels = {
  text: "gemini-2.5-flash-lite",
  chat: "gemini-2.5-pro",
  image: "gemini-2.5-flash",
  audio: "gemini-2.5-flash",
  document: "gemini-2.5-flash-lite",
};

//inisialisasi aplikasi backend/server
app.use(cors()); // .use() digunakan untuk panggil/bikin middleware
app.use(express.json()); //untuk membolehkan kita menggunakan 'Content-Type: application/json' di header

app.use(express.static("public")); //digunakan untuk ketika diakses di localhost akan otomatis mengarah ke folder yg dicantumkan

//ENDPOINT 1 : generate text
app.post("/generate-text", async (req, res) => {
  //handle bagaimana request diterima oleh user
  const { body } = req; // object destructuring

  //guard clause : untuk mengecek case2 negatif
  //jika body kosong
  if (!body) {
    res.status(400).json("Tidak ada payload yang dikirim!");
    return;
  }

  //cek tipe body
  if (typeof body !== "object") {
    res.status(400).json("Payload harus berupa object!");
    return;
  }
  //end guard clause

  const { message } = body;
  if (!message || typeof message !== "string") {
    res.status(400).json("Pesan tidak ada atau format tidak sesuai!");
    return; //keluar lebih awal dari handler
  }

  //proses
  const response = await ai.models.generateContent({
    model: geminiModels.text,
    contents: message,
  });
  res.status(200).json({ reply: response.text });
});

//ENDPOINT 2 : chat
app.post("/chat", async (req, res) => {
  const { conversation } = req.body;

  //pengeecekan 1 : conversation array atau bukan
  if (!conversation || !Array.isArray(conversation)) {
    res.status(400).json({
      success: false,
      data: null,
      message: "Percakapan tidak valid!",
    });
  }

  //pengecekan 2 : integritas datanya
  let dataIsInvalid = false;
  conversation.forEach((item) => {
    if (!item) {
      dataIsInvalid = true;
    } else if (typeof item !== "object") {
      dataIsInvalid = true;
    } else if (!item.role || !item.message) {
      dataIsInvalid = true;
    }
  });

  if (dataIsInvalid) {
    res.status(400).json({
      success: false,
      data: null,
      message: "Ada data yang invalid pada percakapan yang dikirim!",
    });
    return;
  }

  //proses mapping
  const contents = conversation.map((item) => {
    return {
      role: item.role,
      parts: [{ text: item.message }],
    };
  });

  try {
    const aiResponse = await ai.models.generateContent({
      model: geminiModels.chat,
      contents,
    });

    res.status(200).json({
      success: true,
      data: aiResponse.text,
      message: null,
    });
  } catch (e) {
    console.log({ e });
    return res.status(500).json({
      success: false,
      data: null,
      message: e.message,
    });
  }
});

// async function main() {
//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: "Halo apa kabar ?",
//   });
//   console.log(response.text);
// }

// await main();

//panggil appnya
const port = 3000;
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
