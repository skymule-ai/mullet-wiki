(() => {
  let data = null;
  let selected = null;
  const observer = new ResizeObserver(() => drawEdges());


  function initStack() {
    const scene = document.getElementById("stack-scene");
    const src = scene && scene.dataset.src;
    if (!scene || !src) return;
    if (data) {
      render(data);
      sync();
      return;
    }
    fetch(src)
      .then((r) => r.json())
      .then((json) => {
        data = json;
        render(json);
        selected = json.lanes[0]?.nodes[0] || null;
        sync();
      });
  }

  function render(json) {
    const iso = document.getElementById("stack-iso");
    const inspector = document.getElementById("stack-inspector");
    if (!iso || !inspector) return;
    iso.replaceChildren();
    json.lanes.forEach((lane) => {
      const wrap = document.createElement("section");
      wrap.className = "stack-lane";
      wrap.dataset.lane = lane.id;
      const label = document.createElement("p");
      label.className = "stack-lane__label";
      label.textContent = lane.label;
      const row = document.createElement("div");
      row.className = "stack-lane__row";
      lane.nodes.forEach((id) => {
        const node = json.nodes[id];
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "stack-node";
        btn.id = `stack-node-${id}`;
        btn.dataset.node = id;
        btn.dataset.accent = node.accent;
        if (node.col) btn.style.gridColumn = String(node.col);
        btn.setAttribute("aria-pressed", "false");
        btn.innerHTML =
          `<span class="stack-node__tag">${escapeHtml(node.tag)}</span>` +
          `<span class="stack-node__title">${escapeHtml(node.title)}</span>`;
        btn.addEventListener("click", () => {
          selected = id;
          sync();
        });
        btn.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            selected = id;
            sync();
          }
        });
        row.appendChild(btn);
        btn.dataset.hotkey = String(hotIndex(json, id));
      });
      wrap.append(label, row);
      iso.appendChild(wrap);
    });
    observer.disconnect();
    observer.observe(document.getElementById("stack-scene"));
    observer.observe(iso);
  }

  function hotIndex(json, id) {
    return Object.keys(json.nodes).indexOf(id) + 1;
  }

  function sync() {
    const inspector = document.getElementById("stack-inspector");
    if (!data || !inspector) return;
    document.querySelectorAll(".stack-node").forEach((el) => {
      const id = el.dataset.node;
      const on = id === selected;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    inspector.replaceChildren();
    const node = data.nodes[selected];
    if (!node) {
      inspector.innerHTML =
        `<p class="stack-empty">Select a block to see what it does and what it connects to.</p>`;
      drawEdges();
      return;
    }
    const kicker = document.createElement("p");
    kicker.className = "stack-inspector__kicker";
    kicker.textContent = node.tag;
    const title = document.createElement("h2");
    title.textContent = node.title;
    const blurb = document.createElement("p");
    blurb.textContent = node.blurb;
    const wires = document.createElement("p");
    wires.className = "stack-inspector__wires";
    wires.textContent = node.wires;
    inspector.append(kicker, title, blurb, wires);
    if (node.page) {
      const more = document.createElement("a");
      more.className = "stack-more";
      more.href = new URL(node.page, document.baseURI).href;
      more.textContent = "Read the page";
      inspector.appendChild(more);
    }
    drawEdges();
  }

  // Layout box relative to the scene. offset* ignores CSS transforms, so a lifted block never
  // drags its lines along mid-animation.
  function box(el, scene) {
    let x = 0;
    let y = 0;
    for (let n = el; n && n !== scene; n = n.offsetParent) {
      x += n.offsetLeft;
      y += n.offsetTop;
    }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight, cx: x + el.offsetWidth / 2, cy: y + el.offsetHeight / 2 };
  }

  // Orthogonal route with rounded corners through the gaps between lanes.
  function route(a, b) {
    if (Math.abs(a.cy - b.cy) < a.h / 2) {
      const [l, r] = a.cx < b.cx ? [a, b] : [b, a];
      return [[l.x + l.w, l.cy], [r.x, r.cy]];
    }
    const down = b.cy > a.cy;
    const sy = down ? a.y + a.h : a.y;
    const ty = down ? b.y : b.y + b.h;
    if (Math.abs(a.cx - b.cx) < 1) return [[a.cx, sy], [b.cx, ty]];
    const gy = sy + (down ? GAP : -GAP);
    return [[a.cx, sy], [a.cx, gy], [b.cx, gy], [b.cx, ty]];
  }

  const GAP = 14;
  const RADIUS = 10;

  function pathOf(pts) {
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i - 1];
      const [x, y] = pts[i];
      const [nx, ny] = pts[i + 1];
      const lin = Math.hypot(x - px, y - py);
      const lout = Math.hypot(nx - x, ny - y);
      const k = Math.min(RADIUS, lin / 2, lout / 2);
      if (!k) continue;
      d += ` L ${x - ((x - px) / lin) * k} ${y - ((y - py) / lin) * k}`;
      d += ` Q ${x} ${y} ${x + ((nx - x) / lout) * k} ${y + ((ny - y) / lout) * k}`;
    }
    const [lx, ly] = pts[pts.length - 1];
    return `${d} L ${lx} ${ly}`;
  }

  function svgEl(name, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  function drawEdges() {
    const svg = document.getElementById("stack-edges");
    const scene = document.getElementById("stack-scene");
    if (!svg || !scene || !data) return;
    svg.setAttribute("viewBox", `0 0 ${scene.clientWidth} ${scene.clientHeight}`);
    svg.replaceChildren();
    data.edges.forEach(([a, b]) => {
      const from = document.getElementById(`stack-node-${a}`);
      const to = document.getElementById(`stack-node-${b}`);
      if (!from || !to) return;
      const pts = route(box(from, scene), box(to, scene));
      const on = a === selected || b === selected;
      const group = svgEl("g", { class: on ? "is-on" : "" });
      group.appendChild(
        svgEl("path", {
          d: pathOf(pts),
          fill: "none",
          stroke: "currentColor",
          "stroke-width": on ? "2" : "1.2",
          "stroke-linejoin": "round"
        })
      );
      [pts[0], pts[pts.length - 1]].forEach(([cx, cy]) =>
        group.appendChild(svgEl("circle", { cx, cy, r: on ? 3 : 2, fill: "currentColor" }))
      );
      svg.appendChild(group);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  document.addEventListener("keydown", (ev) => {
    if (!data || ev.target.closest("input, textarea")) return;
    const n = Number(ev.key);
    if (!n) return;
    const id = Object.keys(data.nodes)[n - 1];
    if (!id) return;
    selected = id;
    sync();
  });

  if (typeof document$ !== "undefined") {
    document$.subscribe(initStack);
  } else {
    document.addEventListener("DOMContentLoaded", initStack);
  }
})();
