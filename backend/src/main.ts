import app from "./app";
import open from "open";

const PORT = 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  // Open browser automatically
  await open(`http://localhost:${PORT}`);
});
