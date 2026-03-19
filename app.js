const svg = d3.select("#map");
const width = 1280;
const height = 720;

const modeEl = document.getElementById("mode");
const socketStatusEl = document.getElementById("socket-status");
const eventCountEl = document.getElementById("event-count");
const txLogEl = document.getElementById("tx-log");

let eventCount = 0;

const projection = d3.geoNaturalEarth1().fitExtent(
  [
    [24, 26],
    [width - 24, height - 26],
  ],
  { type: "Sphere" },
);

const pathGen = d3.geoPath(projection);

const mapLayer = svg.append("g");
const fxLayer = svg.append("g");

mapLayer
  .append("path")
  .datum(d3.geoGraticule10())
  .attr("class", "graticule")
  .attr("d", pathGen);

mapLayer
  .append("path")
  .datum({ type: "Sphere" })
  .attr("class", "graticule")
  .attr("d", pathGen);

const cityCoords = {
  istanbul: [28.9784, 41.0082],
  london: [-0.1276, 51.5072],
  nyc: [-74.006, 40.7128],
  sf: [-122.4194, 37.7749],
  berlin: [13.405, 52.52],
  singapore: [103.8198, 1.3521],
  tokyo: [139.6917, 35.6895],
  sydney: [151.2093, -33.8688],
  dubai: [55.2708, 25.2048],
  saoPaulo: [-46.6333, -23.5505],
};

const demoAgents = [
  "agent-alpha",
  "agent-frontend",
  "agent-protocol",
  "agent-registry",
  "agent-reviewer",
  "agent-deployer",
  "agent-orchestrator",
];

const demoProtocols = ["capture", "synthesis", "deploy"];

function routePath(source, destination) {
  const line = {
    type: "LineString",
    coordinates: [source, destination],
  };
  return pathGen(line);
}

function addLogRow(tx) {
  const li = document.createElement("li");
  li.className = `tx-item ${tx.protocol}`;
  const time = new Date(tx.timestamp).toLocaleTimeString();
  li.innerHTML = `
    <div class="meta">${time} · ${tx.protocol.toUpperCase()}</div>
    <div class="agent">${tx.agent}</div>
    <div>${tx.sourceLabel} → ${tx.destinationLabel}</div>
  `;
  txLogEl.prepend(li);

  const maxRows = 60;
  while (txLogEl.children.length > maxRows) {
    txLogEl.removeChild(txLogEl.lastChild);
  }
}

function blinkTransaction(tx) {
  const source = tx.source;
  const destination = tx.destination;
  const [sx, sy] = projection(source);
  const [dx, dy] = projection(destination);

  const group = fxLayer.append("g");

  // Route — thin line, no glow
  const route = group
    .append("path")
    .attr("class", `route ${tx.protocol}`)
    .attr("d", routePath(source, destination));

  const routeLength = route.node().getTotalLength();
  route
    .attr("stroke-dasharray", `${routeLength} ${routeLength}`)
    .attr("stroke-dashoffset", routeLength)
    .transition()
    .duration(600)
    .ease(d3.easeCubicOut)
    .attr("stroke-dashoffset", 0)
    .transition()
    .delay(300)
    .duration(800)
    .style("opacity", 0)
    .remove();

  // Origin dot — small, quiet
  group
    .append("circle")
    .attr("class", `origin-dot ${tx.protocol}`)
    .attr("cx", sx)
    .attr("cy", sy)
    .attr("r", 0)
    .transition()
    .duration(150)
    .attr("r", 2.5)
    .transition()
    .duration(500)
    .style("opacity", 0)
    .remove();

  // Destination dot — delayed, small
  group
    .append("circle")
    .attr("class", `dest-dot ${tx.protocol}`)
    .attr("cx", dx)
    .attr("cy", dy)
    .attr("r", 0)
    .transition()
    .delay(200)
    .duration(150)
    .attr("r", 2.5)
    .transition()
    .duration(500)
    .style("opacity", 0)
    .remove();

  // Pulse rings — subtle, small radius
  [
    [sx, sy],
    [dx, dy],
  ].forEach(([x, y], i) => {
    group
      .append("circle")
      .attr("class", `pulse ${tx.protocol}`)
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 2)
      .attr("opacity", 0.6)
      .transition()
      .delay(i * 200)
      .duration(800)
      .attr("r", 14)
      .attr("opacity", 0)
      .remove();
  });

  setTimeout(() => group.remove(), 1800);
}

function processTransaction(detail) {
  if (!detail?.source || !detail?.destination || !detail?.protocol || !detail?.agent) {
    return;
  }

  eventCount += 1;
  eventCountEl.textContent = String(eventCount);

  const tx = {
    protocol: detail.protocol,
    agent: detail.agent,
    source: detail.source,
    destination: detail.destination,
    sourceLabel: detail.sourceLabel || "unknown-src",
    destinationLabel: detail.destinationLabel || "unknown-dst",
    timestamp: detail.timestamp || Date.now(),
  };

  blinkTransaction(tx);
  addLogRow(tx);
}

window.addEventListener("tbh:tx", (event) => {
  processTransaction(event.detail);
});

function randomTx() {
  const keys = Object.keys(cityCoords);
  const sourceKey = keys[Math.floor(Math.random() * keys.length)];
  let destinationKey = keys[Math.floor(Math.random() * keys.length)];
  while (destinationKey === sourceKey) {
    destinationKey = keys[Math.floor(Math.random() * keys.length)];
  }

  return {
    protocol: demoProtocols[Math.floor(Math.random() * demoProtocols.length)],
    agent: demoAgents[Math.floor(Math.random() * demoAgents.length)],
    source: cityCoords[sourceKey],
    destination: cityCoords[destinationKey],
    sourceLabel: sourceKey,
    destinationLabel: destinationKey,
    timestamp: Date.now(),
  };
}

function startDemoMode() {
  modeEl.textContent = "demo";
  socketStatusEl.textContent = "offline";
  setInterval(() => processTransaction(randomTx()), 1400);
  setTimeout(() => processTransaction(randomTx()), 800);
}

function connectWebSocket() {
  const params = new URLSearchParams(window.location.search);
  const wsUrl = params.get("ws") || window.WS_URL;

  if (!wsUrl) {
    startDemoMode();
    return;
  }

  modeEl.textContent = "live";
  socketStatusEl.textContent = "connecting";

  try {
    const ws = new WebSocket(wsUrl);

    ws.addEventListener("open", () => {
      socketStatusEl.textContent = "online";
    });

    ws.addEventListener("close", () => {
      socketStatusEl.textContent = "closed";
    });

    ws.addEventListener("error", () => {
      socketStatusEl.textContent = "error";
    });

    ws.addEventListener("message", (msg) => {
      try {
        const data = JSON.parse(msg.data);
        processTransaction(data);
      } catch {
        // Ignore invalid payload
      }
    });
  } catch {
    socketStatusEl.textContent = "error";
    startDemoMode();
  }
}

async function drawWorld() {
  const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
  const countries = topojson.feature(world, world.objects.countries);

  mapLayer
    .append("g")
    .selectAll("path")
    .data(countries.features)
    .join("path")
    .attr("class", "country")
    .attr("d", pathGen);

  connectWebSocket();
}

drawWorld();
