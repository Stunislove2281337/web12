const express = require("express");
const axios = require("axios");
const xml2js = require("xml2js");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());

const parser = new xml2js.Parser();
const PORT = process.env.PORT || 3000;

// твої RSS
const FEEDS = [
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", name: "BBC World", cat: "Світ", clr: "#4f9eff" },
  { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", name: "BBC Tech", cat: "Технології", clr: "#4caf82" },
  { url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", name: "BBC Science", cat: "Наука", clr: "#e8c547" },
  { url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", name: "NYT World", cat: "Світ", clr: "#ff5f5f" },
  { url: "https://www.theguardian.com/world/rss", name: "Guardian", cat: "Аналітика", clr: "#c77dff" },
];

// парс RSS
async function fetchFeed(feed) {
  try {
    const res = await axios.get(feed.url, { timeout: 8000 });
    const data = await parser.parseStringPromise(res.data);

    const items = data.rss?.channel?.[0]?.item || [];

    return items.slice(0, 15).map(item => ({
      title: item.title?.[0] || "",
      desc: (item.description?.[0] || "").replace(/<[^>]*>/g, "").slice(0, 160),
      link: item.link?.[0] || "#",
      pubDate: item.pubDate?.[0] || new Date().toISOString(),
      source: feed.name,
      cat: feed.cat,
      clr: feed.clr
    }));
  } catch (e) {
    console.log("RSS error:", feed.name, e.message);
    return [];
  }
}

app.use(express.static(path.join(__dirname, "public")));

// API endpoint
app.get("/api/news", async (req, res) => {
  const results = await Promise.all(FEEDS.map(fetchFeed));

  const all = results
    .flat()
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  res.json({
    count: all.length,
    items: all
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log("🚀 Proxy running on port " + PORT);
});