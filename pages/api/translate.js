import translate from "google-translate-api-x";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { text } = req.query;
  if (!text) {
    return res.status(400).json({ error: "Missing text parameter" });
  }

  try {
    const result = await translate(text, { from: "en", to: "mr" });

    res.status(200).json({
      original: text,
      transliterated: result.text,
    });
  } catch (error) {
    console.error("Translation Error:", error);
    res.status(500).json({ error: "Translation Failed", details: error.message });
  }
}
