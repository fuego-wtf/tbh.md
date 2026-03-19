# tbh.md — Terminal World Map Monitor

`tbh.md` is a terminal-themed network monitor UI for the Graphon Lens ecosystem.
It renders a live world map and blinks activity whenever an agent transaction/event appears on the network/protocol stream.

## Features

- Terminal/CRT-inspired interface
- World map visualization (D3 + TopoJSON)
- Real-time transaction effects:
  - source pulse
  - destination pulse
  - animated route between points
- Live log panel with protocol + agent metadata
- Multiple ingestion modes:
  - demo simulator (default)
  - WebSocket stream
  - browser custom event API

## Project Structure

- `index.html` — app shell and layout
- `styles.css` — terminal visual system + map/log styling
- `app.js` — map rendering, event ingestion, blink animations

## Run Locally

```bash
cd /Users/aysimaerdemirci/Developer/tbh.md
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

## Event Input Modes

### 1) Demo mode (default)
If no WebSocket URL is provided, the app generates random traffic for visualization.

### 2) WebSocket mode
Pass a websocket endpoint in query params:

```text
http://localhost:8080?ws=ws://localhost:3001
```

### 3) Custom event API (manual test)
From browser DevTools:

```js
window.dispatchEvent(new CustomEvent("tbh:tx", {
  detail: {
    protocol: "capture", // capture | synthesis | deploy
    agent: "agent-alpha",
    source: [28.9784, 41.0082],
    destination: [-74.006, 40.7128],
    sourceLabel: "istanbul",
    destinationLabel: "nyc",
    timestamp: Date.now()
  }
}));
```

## Payload Schema

```ts
type TxEvent = {
  protocol: "capture" | "synthesis" | "deploy";
  agent: string;
  source: [number, number];      // [longitude, latitude]
  destination: [number, number]; // [longitude, latitude]
  sourceLabel?: string;
  destinationLabel?: string;
  timestamp?: number;
};
```

## Notes

- This repository is currently intended for private beta iteration.
- No backend service is required for basic demo operation.
