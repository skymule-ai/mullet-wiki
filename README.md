# MULLET wiki

Skymule stack docs, published at <https://skymule-ai.github.io/mullet-wiki/> on every push to `main`. To edit, clone and serve locally.

```bash
git clone git@github.com:skymule-ai/mullet-wiki.git
cd mullet-wiki
./wiki
```

Opens [http://127.0.0.1:8088](http://127.0.0.1:8088) (8088 so it does not collide with the paddock gateway on 8000). Prefers [uv](https://docs.astral.sh/uv/); otherwise `python3 -m venv`.

Edit Markdown under `docs/`. The homepage map is driven by `docs/assets/stack.json`.
