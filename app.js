import express from "express";
import expressWS from "express-ws";

const app = express();
expressWS(app);
app.use(express.static("public"));

const putters = new Map();

app.ws("/put/:id", (ws, req) => {
  const id = req.params.id;

  if (putters.has(id)) {
    putters.get(id).terminate();
  }

  putters.set(id, ws);
  console.log(`[Puter] Connected: ${id}`);

  ws.on("close", () => {
    console.log(`[Puter] Disconnected: ${id}`);
    putters.delete(id);
  });

  ws.on("error", (err) => {
    console.error(`[Puter] Error on ${id}:`, err);
    putters.delete(id);
  });
});

app.ws("/get/:id", (ws, req) => {
  const id = req.params.id;
  const putterWS = putters.get(id);

  if (!putterWS) {
    ws.close(1001, "No source stream found for this ID");
    return;
  }

  console.log(`[Getter] Subscribed to: ${id}`);

  const messageHandler = (msg) => {
    if (ws.readyState === 1) {
      ws.send(msg);
    }
  };

  putterWS.on("message", messageHandler);

  ws.on("close", () => {
    console.log(`[Getter] Disconnected from: ${id}`);
    putterWS.off("message", messageHandler);
  });

  putterWS.on("close", () => {
    if (ws.readyState === 1) {
      ws.close(1000, "Source stream closed");
    }
  });
});

app.listen(3000, () => {
  console.log("Server started");
});
