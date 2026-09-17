(() => {
  let data = null;
  let selected = null;
  let drawing = false;

  const accent = (name) =>
    ({ cyan: "#4cc2ff", amber: "#ffb547", mint: "#3ddc97" }[name] || "#4cc2ff");

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
    requestAnimationFrame(() => {
      drawEdges();
      requestAnimationFrame(drawEdges);
    });
  }

  function hotIndex(json, id) {
    return Object.keys(json.nodes).indexOf(id) + 1;
  }

  function related(id) {
    const set = new Set([id]);
    data.edges.forEach(([a, b]) => {
      if (a === id) set.add(b);
      if (b === id) set.add(a);
    });
    return set;
  }

  function sync() {
    const inspector = document.getElementById("stack-inspector");
    if (!data || !inspector) return;
    const live = related(selected);
    document.querySelectorAll(".stack-node").forEach((el) => {
      const id = el.dataset.node;
      const on = id === selected;
      el.classList.toggle("is-active", on);
      el.classList.toggle("is-dim", selected && !live.has(id));
      el.setAttribute("aria-pressed", on ? "true" : "false");
    });
    inspector.replaceChildren();
    const node = data.nodes[selected];
    if (!node) {
      inspector.innerHTML =
        `<p class="stack-empty">Click a block to inspect wiring and commands.</p>` +
        `<p class="stack-hint">Keys 1–${Object.keys(data.nodes).length}</p>`;
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
    (node.commands || []).forEach((block) => {
      const section = document.createElement("section");
      section.className = "stack-cmd";
      const head = document.createElement("header");
      const h = document.createElement("h3");
      h.textContent = block.label;
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "stack-copy";
      copy.textContent = "copy";
      copy.addEventListener("click", () => {
        navigator.clipboard.writeText(block.lines.join("\n")).then(() => {
          copy.textContent = "copied";
          setTimeout(() => (copy.textContent = "copy"), 1200);
        });
      });
      head.append(h, copy);
      const pre = document.createElement("pre");
      pre.textContent = block.lines.join("\n");
      section.append(head, pre);
      inspector.appendChild(section);
    });
    if (node.page) {
      const more = document.createElement("a");
      more.className = "stack-more";
      more.href = new URL(node.page, document.baseURI).href;
      more.textContent = "Open page →";
      inspector.appendChild(more);
    }
    drawEdges();
  }

  function drawEdges() {
    const svg = document.getElementById("stack-edges");
    const scene = document.getElementById("stack-scene");
    if (!svg || !scene || !data || drawing) return;
    drawing = true;
    const rect = scene.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    svg.replaceChildren();
    const live = related(selected);
    data.edges.forEach(([a, b]) => {
      const from = document.getElementById(`stack-node-${a}`);
      const to = document.getElementById(`stack-node-${b}`);
      if (!from || !to) return;
      const fa = from.getBoundingClientRect();
      const tb = to.getBoundingClientRect();
      const x1 = fa.left + fa.width / 2 - rect.left;
      const y1 = fa.top + fa.height / 2 - rect.top;
      const x2 = tb.left + tb.width / 2 - rect.left;
      const y2 = tb.top + tb.height / 2 - rect.top;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      let d;
      if (dy > dx) {
        const mid = (y1 + y2) / 2;
        d = `M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;
      } else {
        const mid = (x1 + x2) / 2;
        d = `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
      }
      path.setAttribute("d", d);
      const on = !selected || (live.has(a) && live.has(b) && (a === selected || b === selected));
      const color = accent(data.nodes[a].accent);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", color);
      path.setAttribute("stroke-width", on ? "2.2" : "1.1");
      path.setAttribute("stroke-opacity", on ? "0.85" : "0.18");
      path.setAttribute("stroke-linecap", "round");
      svg.appendChild(path);
    });
    drawing = false;
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

  window.addEventListener("resize", () => {
    if (data) requestAnimationFrame(drawEdges);
  });

  if (typeof document$ !== "undefined") {
    document$.subscribe(initStack);
  } else {
    document.addEventListener("DOMContentLoaded", initStack);
  }
})();
