import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'

/** The one-prompt install: paste into Claude/Cursor and the agent does the rest. */
const AGENT_PROMPT = [
  'Install and run retard-harness for me:',
  '1. git clone https://github.com/BeaRRRRR/retard-harness.git',
  '2. cd retard-harness && pnpm install',
  '3. Run `pnpm dsh web` and open the printed localhost URL in my browser.',
  'It needs Node 22+ and pnpm. Once it is running, guide me through adding my DeepSeek API key.',
].join('\n')

/** One-click copy box for the agent prompt, with copied feedback. */
function CopyPrompt(): ReactNode {
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(AGENT_PROMPT)
    } catch {
      // Clipboard API can be denied on http:// — fall back to a textarea exec.
      const ta = document.createElement('textarea')
      ta.value = AGENT_PROMPT
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  return (
    <div className="promptBox">
      <div className="promptBoxHead">
        <span className="promptBoxLabel">Paste this into Claude · Cursor · your agent</span>
        <button type="button" className={`copyBtn ${copied ? 'copied' : ''}`} onClick={onCopy}>
          {copied ? '✓ Copied' : 'Copy prompt'}
        </button>
      </div>
      <pre className="promptText">{AGENT_PROMPT}</pre>
      <div className="promptBoxFoot">One prompt. Zero terminal skills required. Your agent handles the rest.</div>
    </div>
  )
}

export default function App() {
  const cloneCmd = 'git clone https://github.com/BeaRRRRR/retard-harness.git'
  const installCmd = 'pnpm install'
  const runCmd = 'pnpm dsh web'

  return (
    <div className="page">
      <header className="nav">
        <span className="navBrand">🦖 retard-harness</span>
        <nav className="navLinks">
          <a href="#features">Features</a>
          <a href="#install">Install</a>
          <a href="#about">About</a>
        </nav>
        <a className="btn primary small" href="https://github.com/BeaRRRRR/retard-harness">GitHub</a>
      </header>

      <section className="hero">
        <div className="heroText">
          <div className="badge">A DeepSeek Harness fork</div>
          <h1>Play <span className="accent">Dino</span> &amp; watch <span className="accent2">brainrot</span> while the model thinks.</h1>
          <p className="sub">
            Waiting on the model is boring. retard-harness splits the screen so you can
            run a Chrome-dino game up top and loop Instagram/Minecraft brainrot below,
            all while the agent streams your answer.
          </p>
          <div className="heroCta">
            <a className="btn primary" href="#install">Get started</a>
            <a className="btn" href="#preview">See the preview</a>
          </div>
        </div>
        <div className="heroPreview">
          <img src="/preview.png" alt="Dino game and brainrot video next to the chat" />
        </div>
      </section>

      <section id="install" className="installTop">
        <h2>Let your agent install it</h2>
        <p className="sub">
          No terminal wizardry. Copy one prompt, paste it into your AI agent,
          and come back when the dino is jumping.
        </p>
        <CopyPrompt />
      </section>

      <section id="preview" className="previewFull">
        <h2>Distraction as a feature</h2>
        <p>
          When the model is thinking, a resizable sidebar slides in: the Chrome-dino runner
          on top, a looping brainrot video below. Click away and it pauses. Click back and you're playing.
        </p>
        <img className="previewLarge" src="/preview.png" alt="Full panel preview" />
      </section>

      <section id="features" className="features">
        <h2>What's inside</h2>
        <div className="featureGrid">
          <div className="card">
            <div className="cardIcon">🦖</div>
            <h3>Chrome Dino</h3>
            <p>Jump with Space / ↑, duck with ↓. Obstacles ramp up, best score persists.</p>
          </div>
          <div className="card">
            <div className="cardIcon">🎬</div>
            <h3>Brainrot slot</h3>
            <p>A looping video below the game — Minecraft parkour, reels, anything you want on repeat.</p>
          </div>
          <div className="card">
            <div className="cardIcon">↔️</div>
            <h3>Resizable split</h3>
            <p>Drag the edges to resize the panel and the game/brainrot split to your liking.</p>
          </div>
          <div className="card">
            <div className="cardIcon">🏓</div>
            <h3>Focus-aware</h3>
            <p>Click the game and Space goes to the game. Click the chat and Space types there.</p>
          </div>
          <div className="card">
            <div className="cardIcon">⏸️</div>
            <h3>Auto-pause</h3>
            <p>Click away and it pauses. When the model replies, it pauses for 2s too.</p>
          </div>
          <div className="card">
            <div className="cardIcon">🕹️</div>
            <h3>More games soon</h3>
            <p>Flappy Bird and TikTok are on the roadmap. Drop your own game in the selector.</p>
          </div>
        </div>
      </section>

      <section className="install">
        <h2>Prefer doing it by hand?</h2>
        <p className="sub">
          Four commands. Node 22+ and pnpm required.
        </p>
        <div className="codeBlock">
          <div className="codeLine"><span className="prompt">$</span> {cloneCmd}</div>
          <div className="codeLine"><span className="prompt">$</span> cd retard-harness</div>
          <div className="codeLine"><span className="prompt">$</span> {installCmd}</div>
          <div className="codeLine"><span className="prompt">$</span> {runCmd}</div>
          <div className="codeComment"># opens http://localhost:3080 — add your API key, then send a prompt</div>
        </div>
        <div className="installNote">
          Built on <a href="https://github.com/deepseek-ai/deepseek-harness" target="_blank" rel="noreferrer">DeepSeek Harness</a> — this stays an open-source fork. Deploy it however you like.
        </div>
      </section>

      <section id="about" className="about">
        <h2>Why would you want this?</h2>
        <p>
          Because staring at a spinner while the model reasons is the worst part of using an agent.
          This turns dead time into playtime — and honestly, it's just fun.
        </p>
      </section>

      <footer className="footer">
        <span>retard-harness · a silly fork of DeepSeek Harness</span>
        <span><a href="https://github.com/BeaRRRRR/retard-harness" target="_blank" rel="noreferrer">Star it ⭐</a></span>
      </footer>
    </div>
  )
}