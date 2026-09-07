// Every static string the interface shows. Views may show a string from here or a string from the read. Nothing else.
// Templates use {name} slots; fill() puts read values into them. The no-opinions test knows about both.
export const copy = {
  brand: 'Sepiola',
  rink: {
    title: 'My rink',
    subEmpty: 'Cue a roster to load the board',
    subBefore: 'Lineup before the ice is read',
    subAfter: 'Ice read for the next {days} days',
    subRead: 'Ice read',
    previousWeek: 'Previous week',
    nextWeek: 'Next week',
    weekStarting: 'Week starting',
  },
  legend: {
    fresh: 'fresh ice: the schedule is on his side',
    chewed: 'chewed up: light week, or a back-to-back',
    badges: 'Badges:',
    flag: 'flag',
    stream: 'stream candidate',
  },
  strips: {
    bench: 'Bench',
    ir: 'Injured reserve',
    benchEmpty: 'Nobody on the bench.',
    irEmpty: 'Nobody in the box.',
  },
  glyph: { warn: '!', stream: '↗', b2b: 'b2b', game: 'G' },
  replay: {
    title: 'Replay',
    sub: 'run it back',
    pts: '{pts} projected pts',
    empty: 'Run it back on a skater and his week shows up here.',
  },
  panel: {
    sub: 'the calls',
    empty: 'Nothing read yet. Run read_ice, or let your agent call it.',
    start: 'Start', sit: 'Sit', ir: 'IR', stream: 'Stream',
    why: 'why',
  },
  hand: {
    sub: 'who skates more',
    empty: 'Run the ice to see the edge.',
    you: 'You', opp: 'Opp',
    expand: 'Both rosters',
    collapse: 'Totals only',
    colGames: 'games',
    colPts: 'pts',
  },
  siteTools: {
    none: 'Site tools: not available in this browser',
    on: 'Site tools: {n} registered',
    fixture: 'fixtures',
    live: 'live · {url}',
  },
  skaterMenu: {
    spotlight: 'Spotlight',
    replay: 'Run it back',
    compare: 'Compare with…',
  },
  pick: {
    banner: 'Compare {name} with… click another skater.',
    cancel: 'Cancel',
  },
  history: {
    games: '{you} vs {opp} games',
    gamesSolo: '{you} games',
    restore: 'Restore',
    again: 'Run again',
    raw: 'command and result',
    restored: 'restored · {label}',
    gone: 'That read is no longer kept. Run it again.',
  },
  console: {
    paste: 'Paste a lineup',
    pasteGo: 'Cue it',
    pasted: 'cue_roster (pasted lineup)',
    ready: 'Talkback ready. One move per line.',
    hint: 'Moves:',
    placeholder: 'read_ice',
    run: 'Run',
  },
  paste: {
    formats: 'What "one player per line" means',
    lead: 'Any of these, mixed freely. Names are matched against the NHL\'s player index; a surname alone works when it is unique.',
    examples: [
      ['Name and position', 'Connor McDavid C'],
      ['Bench or injured reserve first', 'BN Ryan Strome C'],
      ['Last name, first name', 'Matthews, Auston'],
      ['A ranked list', '1. Nathan MacKinnon COL - C'],
      ['A row copied from a fantasy site', 'D    Cale Makar    COL - D    Q'],
      ['Just a surname', 'Nylander'],
    ],
    opponent: 'Opponent\'s lineup (optional)',
    opponentHint: 'Paste the other side too and games in hand gets its second bar and the analyst\'s edge.',
    useSample: 'Use the sample lineup',
    sample: 'Connor McDavid C\nMatvei Gridin LW\nMatt Coronato RW\nMorgan Frost C\nConnor Zary LW\nJoel Farabee RW\nCale Makar D\nRasmus Andersson D\nMacKenzie Weegar D\nKevin Bahl D\nDustin Wolf G\nBN Ryan Strome C\nBN Mikael Backlund C\nIR Jonathan Huberdeau LW',
  },
  signal: {
    title: 'Two sides of one screen',
    line: 'The analyst decides. The pen draws. The screen has no opinions.',
    pen: {
      heading: 'The pen · WebMCP',
      what: 'Tools this page registers with the browser, so an agent running in it can make the seven moves.',
      pill: 'WebMCP',
      on: '{n} tools registered with the browser\'s modelContext',
      off: 'Not available in this browser. Chrome with WebMCP enabled (chrome://flags, or --enable-features=WebMCP), or the Codex desktop browser, registers them.',
      pillOn: '{n} tools',
      pillOff: 'off',
    },
    analyst: {
      heading: 'The analyst · CHIRP',
      what: 'The server that reads the ice: an MCP server with an HTTP face. It computes every number and writes every line; the page only draws them.',
      pill: 'Analyst',
      live: 'live',
      fixtures: 'fixtures',
      fixturesLine: 'Built-in reads. No network, no analyst.',
      checking: 'checking…',
      health: '{analyst} · season {season} · answered in {ms} ms',
      mcp: 'Also an MCP server: {tools} tools at {endpoint}, stateless — pass your lineup with each call.',
      down: 'Did not answer.',
      hint: 'Point the page elsewhere with ?analyst=<url>, or at nothing with ?analyst=fixtures.',
    },
    more: 'How it works',
  },
  windows: { rink: 'Rink', panel: 'Panel', hand: 'Games in hand', replay: 'Replay', console: 'Console', welcome: 'Start here', about: 'About' },
  menu: {
    windows: 'Windows',
    start: 'Start here',
    sample: 'Load a sample week',
    about: 'About Sepiola',
    quickStart: 'Quick start',
    github: 'GitHub',
    privacy: 'Privacy',
    terms: 'Terms',
    disclaimer: 'Disclaimer',
  },
  welcome: {
    title: 'Sepiola',
    sub: 'a screen for an analyst\'s read',
    lead: 'CHIRP reads your fantasy-hockey week: who plays, who sits on a back-to-back, who to stream, games in hand. This page draws that read instead of telling it. Nothing here has an opinion of its own.',
    sample: 'Load a sample week',
    sampleHint: 'A fixture roster, read and drawn. Then click a skater.',
    paste: 'Paste your lineup',
    pasteHint: 'Any platform, one player per line. Names resolve against the NHL.',
    learn: 'Read how it works',
    learnHint: 'The seven moves, the read contract, the pattern.',
  },
  about: {
    title: 'About Sepiola',
    sub: 'what this is, how to use it, and the fine print',
    sections: {
      about: {
        heading: 'About',
        paras: [
          'Sepiola is a telestrator: a page that draws an analyst\'s read onto a persistent screen. The analyst is CHIRP, an open-source fantasy-hockey intelligence server. Any agent that speaks WebMCP is the pen. This page is the screen, and the screen has no opinions: every number and every sentence on it comes from the analyst\'s read.',
          'The name is the bobtail squid. A cuttlefish\'s skin is a display of millions of pigment cells driven directly by its brain; the skin decides nothing. And the passing cloud, a dark wave that travels across the body to hold prey still, is a spotlight done by an animal.',
          'Built by semanticintent as an open-source demonstration of the telestrator pattern. Source, contract, and decisions are on GitHub.',
        ],
      },
      quickStart: {
        heading: 'Quick start',
        steps: [
          'The Talkback window (top right) speaks the same seven moves an agent would.',
          'Press Paste a lineup, paste your roster in any format, one player per line, and press Cue it. Or pick Load a sample week from the Sepiola menu.',
          'Type read_ice and press Run. Before opening night, add a date to read a real week: read_ice 7 2026-10-12.',
          'Click a skater to circle him. Press why on a panel row to run it back. Type split with two ids for two weeks side by side.',
          'With WebMCP in your browser, an agent can make every one of these moves for you, and you will see each one land in the transcript.',
        ],
      },
      privacy: {
        heading: 'Privacy',
        paras: [
          'No accounts, no sign-in, no cookies, no analytics, no tracking scripts. The page does not store anything in your browser.',
          'When you paste a lineup, the text is sent to the analyst at chirp-mcp.semanticintent.dev so player names can be resolved against the NHL\'s public player index and a read can be computed. The analyst is stateless: it does not store your lineup, and the read is returned to your browser and kept only there, until you reload.',
          'The analyst runs on Cloudflare. Cloudflare may keep ordinary request metadata (such as IP address and timestamps) for a limited time for security, rate limiting, and operations. We do not use it to identify you.',
          'Fixture mode (add ?analyst=fixtures to the address) makes no network requests at all.',
        ],
      },
      terms: {
        heading: 'Terms',
        paras: [
          'Sepiola is provided as is, without warranty of any kind, under the MIT licence. Use it at your own risk.',
          'You are responsible for the lineup text you paste. If it comes from a fantasy platform, its terms of service govern what you may copy from it. Player names, positions, clubs, and schedules are public information published by the NHL.',
          'Sepiola is not affiliated with, endorsed by, or connected to the NHL, any of its clubs, the NHLPA, or any fantasy-sports platform. No team logos, wordmarks, or jersey designs are used; the jerseys are generic shapes in club colours.',
          'These terms may change as the project does. The current version is always the one served here and in the repository.',
        ],
      },
      disclaimer: {
        heading: 'Disclaimer',
        paras: [
          'Everything on this screen is for entertainment and information. Start, sit, and stream calls are the analyst\'s reading of the published schedule and last season\'s production; they are not predictions and they will be wrong sometimes. Make your own decisions.',
          'Schedules change. Injuries happen. The read is only as current as the NHL\'s public data at the moment it was made, and the panel says where every number came from.',
        ],
      },
      credits: {
        heading: 'Credits',
        paras: [
          'Barlow and Barlow Condensed by Jeremy Tribby, under the SIL Open Font License 1.1. Motion by GSAP. Schedule and statistics from the NHL\'s public API. The original mockup and pattern were drafted with Claude; the code was built with Claude Code.',
          'The mark is a bobtail squid drawn as a crest: flat fills, one bold line, and the passing cloud across its mantle. It is the project\'s own and carries no team\'s colours.',
        ],
      },
    },
  },
  errors: {
    noRoster: 'Cue a roster first.',
    unknownFixture: 'No fixture called "{name}".',
    unknownSkater: 'No skater on the ice called "{id}".',
    unknownId: 'No skater in the read called "{id}".',
    sameSkater: 'Split needs two different skaters.',
    unknownWindow: 'No window called "{view}". Try rink, panel, hand, replay, or console.',
    expectedNumber: 'Expected a number for {key}. Try: {example}',
    badDays: 'look_ahead_days must be a whole number from 1 to 14. Try: {example}',
    needsRoster: 'Give cue_roster a fixture name, or a pasted lineup when an analyst is configured.',
    noAnalyst: 'No analyst is configured. Load a fixture with cue_roster <fixture>, or open the page with ?analyst=<url>.',
    analystDown: 'The analyst did not answer at {url}.',
    badRead: 'The analyst returned something the screen cannot draw: {why}.',
    unknownMove: 'Unknown move "{name}".',
  },
};

export const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

/** Every leaf string in copy, for tests. */
export function leaves(node = copy, out = []) {
  for (const v of Object.values(node)) typeof v === 'string' ? out.push(v) : leaves(v, out);
  return out;
}
