<script lang="ts">
    import { onDestroy } from 'svelte';

    const paperclipSvg = `<svg viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><title>paperclip-line</title><path d="M8.42,32.6A6.3,6.3,0,0,1,4,30.79l-.13-.13A6.2,6.2,0,0,1,2,26.22,6.77,6.77,0,0,1,4,21.4L19.5,6.07a8.67,8.67,0,0,1,12.15-.35A8,8,0,0,1,34,11.44a9,9,0,0,1-2.7,6.36L17.37,31.6A1,1,0,1,1,16,30.18L29.89,16.38A7,7,0,0,0,32,11.44a6,6,0,0,0-1.76-4.3,6.67,6.67,0,0,0-9.34.35L5.45,22.82A4.78,4.78,0,0,0,4,26.22a4.21,4.21,0,0,0,1.24,3l.13.13a4.64,4.64,0,0,0,6.5-.21L25.22,15.94A2.7,2.7,0,0,0,26,14a2.35,2.35,0,0,0-.69-1.68,2.61,2.61,0,0,0-3.66.13l-9.2,9.12a1,1,0,1,1-1.41-1.42L20.28,11a4.62,4.62,0,0,1,6.48-.13A4.33,4.33,0,0,1,28,14a4.68,4.68,0,0,1-1.41,3.34L13.28,30.58A6.91,6.91,0,0,1,8.42,32.6Z" fill="#ffffff"/></svg>`;

    const paperclipUrl = `data:image/svg+xml;utf8,${encodeURIComponent(paperclipSvg)}`;

    let prompt = '';
    let image: File | null = null;
    let fileName = '';
    let style = 'photorealistic';
    let aspect = '16:9';
    let quality = 'high';
    let generatedImage: string | null = null;
    let loading = false;
    let error: string | null = null;
    let history: string[] = [];

    const styles = ['photorealistic', 'cinematic', 'digital-art', 'watercolor', 'anime', 'comic', 'pixel'];
    const aspects = ['1:1','4:5','16:9','9:16'];
    const qualities = ['low','medium','high'];
    const examples = [
        'A cozy cottage in a snowy forest, morning light',
        'Portrait of an astronaut cat, cinematic lighting',
        'Futuristic city skyline at dusk, neon reflections'
    ];

    function handleFileChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const f = input.files?.[0] ?? null;
        image = f;
        fileName = f ? f.name : '';
    }

    async function generate() {
        error = null;
        generatedImage = null;
        if (!prompt.trim()) {
            error = 'Please enter a prompt.';
            return;
        }
        loading = true;
        try {
            const formData = new FormData();
            formData.append('prompt', prompt);
            formData.append('style', style);
            formData.append('aspect', aspect);
            formData.append('quality', quality);
            if (image) formData.append('image', image, image.name);

            const res = await fetch('/api/generate', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({ error: 'Upstream error' }));
                error = body?.error ?? `Request failed: ${res.status}`;
                return;
            }

            const data = await res.json();
            if (data?.imageUrl) {
                generatedImage = data.imageUrl;
                // only prepend when generatedImage is a non-empty string to keep history type-safe
                if (generatedImage) {
                  history = [generatedImage, ...history].slice(0, 8);
                }
            } else {
                error = 'No image returned from server.';
            }
        } catch (e) {
            console.error(e);
            error = 'Request failed.';
        } finally {
            loading = false;
        }
    }

    async function downloadImage() {
        if (!generatedImage) return;
        try {
            if (generatedImage.startsWith('data:')) {
                const a = document.createElement('a');
                a.href = generatedImage;
                a.download = `imago.png`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                const resp = await fetch(generatedImage);
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `imago.png`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            }
        } catch (e) {
            console.error(e);
        }
    }

    onDestroy(() => {
        // ...existing cleanup if any...
    });
</script>

<div class="app">
  <header class="topbar">
    <div class="brand">
      <h1>Imago</h1>
      <span class="tag">Slick AI images</span>
    </div>
  </header>

  <main class="grid">
    <section class="controls">
      <label class="field">
        <span class="label">Prompt</span>
        <textarea class="prompt" bind:value={prompt} placeholder="Describe what you want..."></textarea>
        <div class="examples">
          {#each examples as e}
            <button class="chip" type="button" on:click={() => prompt = e}>{e}</button>
          {/each}
        </div>
      </label>

      <div class="row">
        <label class="small">
          <span class="label">Style</span>
          <select bind:value={style}>
            {#each styles as s}<option value={s}>{s}</option>{/each}
          </select>
        </label>

        <label class="small">
          <span class="label">Aspect</span>
          <select bind:value={aspect}>
            {#each aspects as a}<option value={a}>{a}</option>{/each}
          </select>
        </label>

        <label class="small">
          <span class="label">Quality</span>
          <select bind:value={quality}>
            {#each qualities as q}<option value={q}>{q}</option>{/each}
          </select>
        </label>
      </div>

      <div class="row file-row">
        <label class="filelabel">
          <input type="file" accept="image/*" on:change={handleFileChange} />
          <img src={paperclipUrl} alt="paperclip" class="paperclip"/>
          <span class="attach-text">{fileName || 'Attach reference (optional)'}</span>
        </label>

        <div class="controls-right">
          <button class="btn primary" on:click={generate} disabled={loading}>
            {#if loading}
              <svg class="spinner" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4"></circle></svg>
              Generating...
            {:else}
              Generate
            {/if}
          </button>

          {#if generatedImage}
            <button class="btn" on:click={downloadImage}>Download</button>
          {/if}
        </div>
      </div>

      <div class="meta">
        <p class="muted">Style: <strong>{style}</strong> • Aspect: <strong>{aspect}</strong> • Quality: <strong>{quality}</strong></p>
        {#if error}
          <p class="error">{error}</p>
        {/if}
      </div>
    </section>

    <aside class="preview">
      <div class="canvas">
        {#if loading}
          <div class="placeholder loading">Generating preview…</div>
        {:else if generatedImage}
          <img src={generatedImage} alt="Generated result" />
        {:else}
          <div class="placeholder">Result preview will appear here</div>
        {/if}
      </div>

      <div class="history">
        <h3>Recent</h3>
        <div class="thumbs">
          {#if history.length === 0}
            <div class="muted small">No recent generations</div>
          {/if}
          {#each history as h}
            <button class="thumb" on:click={() => generatedImage = h}>
              <img src={h} alt="history" />
            </button>
          {/each}
        </div>
      </div>
    </aside>
  </main>

  
</div>

<style>
  :root{
    --bg: #1e1e2e;
    --surface: #26233a;
    --muted: #6e6a86;
    --text: #cdd6f4;
    --accent: #cba6f7;
    --accent-2: #fab387;
    --radius: 12px;
    --glass: rgba(255,255,255,0.02);
  }

  :global(body){
    margin:0;
    background: var(--bg);
    color: var(--text);
    font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    -webkit-font-smoothing:antialiased;
    -moz-osx-font-smoothing:grayscale;
    min-height:100vh;
  }

  .app{ max-width:1200px; margin:28px auto; padding:20px; }

  .topbar{
    display:flex; justify-content:space-between; align-items:center; gap:12px;
  }
  .brand{ display:flex; align-items:baseline; gap:12px; }
  .brand h1{ margin:0; font-size:1.25rem; color:var(--text); }
  .tag{ color:var(--muted); font-size:.9rem; }

  .grid{ display:grid; grid-template-columns: 440px 1fr; gap:18px; margin-top:18px; align-items:start; }

  .controls{
    background:var(--surface); border-radius:var(--radius); padding:16px; border:1px solid rgba(255,255,255,0.03);
    display:flex; flex-direction:column; gap:12px;
  }

  .field .label{ display:block; color:var(--muted); font-size:.85rem; margin-bottom:6px; }
  .prompt{
    width:100%; min-height:110px; resize:vertical; padding:10px; border-radius:8px;
    background:var(--bg); border:1px solid rgba(255,255,255,0.04); color:var(--text);
    outline:none;
  }
  .examples{ display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }
  .chip{
    background:transparent; border:1px solid rgba(255,255,255,0.04); color:var(--muted);
    padding:6px 8px; border-radius:999px; cursor:pointer; font-size:.85rem; transition:all .12s ease;
  }
  .chip:hover{ color:var(--text); border-color:rgba(203,166,247,0.18); transform:translateY(-2px); }

  .row{ display:flex; gap:10px; align-items:center; }
  .small{ flex:1; display:flex; flex-direction:column; gap:6px; }
  select{
    padding:8px; border-radius:8px; background:var(--bg); color:var(--text);
    border:1px solid rgba(255,255,255,0.04);
  }

  .file-row{ justify-content:space-between; align-items:center; gap:12px; }
  .filelabel{
    display:inline-flex; align-items:center; gap:8px; padding:8px 10px;
    background:var(--surface-2); border:1px solid rgba(255,255,255,0.05); color:var(--muted); border-radius:8px; cursor:pointer;
    transition: all .14s ease;
  }
  .filelabel input{ display:none; }
  .filelabel:hover{ transform:translateY(-2px); box-shadow:0 6px 18px rgba(3,2,6,0.45); color:var(--text); }
  .filelabel .paperclip{ width:14px; height:14px; margin-right:6px; filter: invert(1); }

  .controls-right{ display:flex; gap:8px; align-items:center; }
  .btn{
    padding:8px 12px; border-radius:8px; border:1px solid rgba(255,255,255,0.04); background:transparent; color:var(--text); cursor:pointer;
    transition:transform .12s ease, box-shadow .12s ease;
  }
  .btn.primary{
    background:var(--accent); color:#111; border:none; font-weight:700; box-shadow:0 8px 20px rgba(203,166,247,0.12);
  }
  .btn:disabled{ opacity:.6; cursor:not-allowed; }

  .muted{ color:var(--muted); font-size:.9rem; }
  .error{ color:#ff7b7b; margin-top:8px; }

  .preview{
    background:var(--surface); border-radius:var(--radius); padding:14px; border:1px solid rgba(255,255,255,0.03);
    display:flex; flex-direction:column; gap:12px;
  }

  .canvas{
    background:var(--bg); border-radius:8px; min-height:320px; display:grid; place-items:center; border:1px solid rgba(255,255,255,0.03);
    overflow:hidden;
  }
  .canvas img{ max-width:100%; max-height:520px; display:block; object-fit:contain; }

  .placeholder{ color:var(--muted); padding:20px; text-align:center; }

  .loading{ display:flex; gap:10px; align-items:center; justify-content:center; }

  .spinner{ width:18px; height:18px; animation:spin 1s linear infinite; color:var(--text); }
  @keyframes spin{ to{ transform:rotate(360deg); } }

  .history h3{ margin:0; font-size:.95rem; color:var(--muted); }
  .thumbs{ display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; }
  .thumb{ width:64px; height:64px; border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.03); padding:0; background:transparent; cursor:pointer; }
  .thumb img{ width:100%; height:100%; object-fit:cover; display:block; }

 .small{ font-size:.9rem; }

  @media (max-width: 980px){
    .grid{ grid-template-columns: 1fr; }
    .app{ padding:12px; margin:14px auto; }
  }
</style>
