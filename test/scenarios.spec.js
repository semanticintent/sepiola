// Plays every scenarios/*.txt through the real page, checks each ack, and screenshots each step to test/shots/.
import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';

const fixture = (name) => JSON.parse(readFileSync(`fixtures/${name}.json`, 'utf8'));
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'content-type': 'application/json' };

const DIR = 'scenarios';
mkdirSync('test/shots', { recursive: true });
const scenarios = readdirSync(DIR).filter((f) => f.endsWith('.txt'));

async function boot(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  await page.waitForFunction(() => window.sepiola?.ready === true);
  return errors;
}

for (const file of scenarios) {
  const name = file.replace(/\.txt$/, '');
  test(name, async ({ page }) => {
    const errors = await boot(page);
    const lines = readFileSync(`${DIR}/${file}`, 'utf8').split('\n').map((s) => s.trim()).filter((l) => l && !l.startsWith('#'));
    for (const [i, line] of lines.entries()) {
      const ack = await page.evaluate((l) => window.sepiola.run(l), line);
      expect(typeof ack, `${line} → ${JSON.stringify(ack)}`).toBe('object');
      expect(ack, `${line} → ${JSON.stringify(ack)}`).not.toHaveProperty('error');
      await page.evaluate(() => window.sepiola.settled());
      const state = await page.evaluate(() => window.sepiola.state());
      if (line.startsWith('circle')) expect(state.circle?.id).toBe(line.split(/\s+/)[1]);
      if (line.startsWith('wipe')) { expect(state.circle).toBeNull(); expect(state.replay).toBeNull(); }
      if (line.startsWith('split')) expect(state.replay?.ids).toEqual(line.split(/\s+/).slice(1, 3));
      if (line.startsWith('replay')) expect(state.replay?.ids).toEqual([line.split(/\s+/)[1]]);
      if (line.startsWith('cut_to')) {
        const view = line.split(/\s+/)[1];
        expect(state.windows[view].open).toBe(true);
        expect(await page.locator(`.win[data-name="${view}"].focus`).count()).toBe(1);
      }
      if (line.startsWith('read_ice')) { expect(state.windows.panel.open).toBe(true); expect(state.windows.hand.open).toBe(true); }
      expect(state.log.at(-1)).toMatchObject({ line, ack }); // entries that produced a read also carry a readId
      await page.screenshot({ path: `test/shots/${name}-${String(i + 1).padStart(2, '0')}-${line.split(/\s+/)[0]}.png` });
    }
    expect(errors).toEqual([]);
  });
}

test('a move the grammar does not know is refused, not thrown', async ({ page }) => {
  await boot(page);
  const ack = await page.evaluate(() => window.sepiola.run('rank gridin'));
  expect(ack).toHaveProperty('error');
});

test('talkback resolves a surname to an id, and the transcript shows what was typed', async ({ page }) => {
  await boot(page);
  for (const l of ['cue_roster cgy-week1', 'read_ice']) await page.evaluate((x) => window.sepiola.run(x), l);
  const ack = await page.evaluate(() => window.sepiola.submit('circle Zary'));
  expect(ack.circled).toBe('zary');
  await expect(page.locator('[data-view="console"] .log')).toContainText('> circle zary');
});

test('a circle persists until wiped', async ({ page }) => {
  await boot(page);
  for (const l of ['cue_roster cgy-week1', 'read_ice', 'circle zary']) await page.evaluate((x) => window.sepiola.run(x), l);
  await page.evaluate(() => window.sepiola.settled());
  await page.waitForTimeout(1500);
  expect(await page.locator('[data-view="spot"] .callout').count()).toBe(1);
  await page.evaluate(() => window.sepiola.run('wipe'));
  expect(await page.locator('[data-view="spot"] .callout').count()).toBe(0);
});

test('an agent with WebMCP sees every move and can make one', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.modelContext = { tools: [], async registerTool(t) { this.tools.push(t); } };
  });
  await boot(page);
  await page.evaluate(() => window.sepiola.webmcp);
  await expect(page.locator('#pill-webmcp')).toHaveText(/WebMCP · 7 tools/);
  await page.click('.signal summary');
  await expect(page.locator('#signal-panel')).toContainText('7 tools registered with the browser');
  expect(await page.locator('#signal-panel .chips-row code').count()).toBe(7);
  const names = await page.evaluate(() => navigator.modelContext.tools.map((t) => t.name));
  expect(names).toEqual(await page.evaluate(() => window.sepiola.moves));
  const ack = await page.evaluate(async () => {
    const tool = (n) => navigator.modelContext.tools.find((t) => t.name === n);
    await tool('cue_roster').execute({ fixture: 'cgy-week1' });
    await tool('read_ice').execute({});
    return tool('circle').execute({ ids: ['zary'], reason: 'the agent said so' });
  });
  expect(ack).toEqual({ circled: 'zary', reason: 'the agent said so' });
  const state = await page.evaluate(() => window.sepiola.state());
  expect(state.circle).toEqual({ id: 'zary', reason: 'the agent said so' });
  expect(state.log.at(-1).line).toMatch(/^agent circle /);
  await page.screenshot({ path: 'test/shots/webmcp-agent-circle.png' });
});

test('with an analyst configured, cue_roster posts the lineup and read_ice re-reads with the window', async ({ page }) => {
  const posts = [];
  await page.route('**/health', (route) => route.fulfill({ status: 200, headers: CORS, body: JSON.stringify({ ok: true, analyst: 'chirp', season: '20262027', mcp: { endpoint: '/mcp', tools: 23, stateless: true } }) }));
  await page.route('**/read', async (route) => {
    const body = JSON.parse(route.request().postData());
    posts.push(body);
    await route.fulfill({ status: 200, headers: CORS, body: JSON.stringify(body.look_ahead_days === 3 ? fixture('thin-week-no-opp') : fixture('cgy-week1')) });
  });
  await page.goto('/?analyst=http://analyst.test');
  await page.waitForFunction(() => window.sepiola?.ready === true);
  await expect(page.locator('#pill-analyst')).toHaveText(/Analyst · live/);
  // Through the real UI: open the paste window from the welcome card, type, press Cue it.
  await page.click('.win[data-name="welcome"] [data-paste]');
  await page.fill('#paste-in', 'Zary LW\nGridin LW');
  await page.fill('#opp-in', 'Auston Matthews C');
  await page.click('#paste-go');
  await page.waitForFunction(() => window.sepiola.state().read !== null);
  const state0 = await page.evaluate(() => window.sepiola.state());
  expect(state0.log.at(-1)).toMatchObject({ line: 'cue_roster (pasted lineup)', ack: { cued: 'fx-cgy-week1', skaters: 15 } });
  expect(state0.windows.paste.open).toBe(false);
  expect(state0.windows.welcome.open).toBe(false);
  await page.evaluate(() => window.sepiola.run('read_ice'));
  expect(await page.locator('[data-view="hand"] [data-seq="gih_bar"]').count()).toBe(2); // cgy-week1 carries an opponent
  const read = await page.evaluate(() => window.sepiola.run('read_ice 3 2026-10-05'));
  expect(read.read).toBe('fx-thin-week');
  expect(posts.map((p) => [p.roster_text, p.opponent_text, p.look_ahead_days, p.start])).toEqual([
    ['Zary LW\nGridin LW', 'Auston Matthews C', 7, undefined],
    ['Zary LW\nGridin LW', 'Auston Matthews C', 7, undefined],
    ['Zary LW\nGridin LW', 'Auston Matthews C', 3, '2026-10-05'],
  ]);
  expect(await page.locator('[data-view="hand"] [data-seq="gih_bar"]').count()).toBe(1); // thin-week has no opponent
  // Codex feedback: every week view says which week it shows, in the analyst's words; controls move by a week.
  await expect(page.locator('.win[data-name="rink"] .sub')).toContainText('Nov 9 – 15');
  await expect(page.locator('.win[data-name="panel"] .sub')).toContainText('Nov 9 – 15');
  await expect(page.locator('.win[data-name="hand"] .sub')).toContainText('Nov 9 – 15');
  expect(await page.locator('.week-nav').isVisible()).toBe(true);
  expect(await page.inputValue('#week-in')).toBe('2026-11-09');
  const before = posts.length;
  await page.click('[data-week="previous"]');
  await page.waitForFunction((n) => window.sepiola.state().log.length > n, await page.evaluate(() => window.sepiola.state().log.length));
  expect(posts.length).toBe(before + 1);
  expect(posts.at(-1)).toMatchObject({ start: '2026-11-02', look_ahead_days: 7 }); // the current read's window length (the fixture's), not the earlier request's
  // Codex feedback: the transcript is history. Restore puts a kept read back with no network; Run again asks the analyst afresh.
  const cards = page.locator('.hist');
  expect(await cards.count()).toBeGreaterThanOrEqual(2);
  await expect(cards.first()).toContainText('Oct 5 – 11');
  await expect(cards.first()).toContainText('45 vs 39 games');
  const postsBeforeRestore = posts.length;
  await cards.first().locator('[data-restore]').click();
  await page.waitForFunction(() => window.sepiola.state().read.analysis_id === 'fx-cgy-week1');
  expect(posts.length).toBe(postsBeforeRestore); // restored from memory
  await expect(page.locator('.win[data-name="rink"] .sub')).toContainText('Oct 5 – 11');
  await expect(page.locator('[data-view="console"] .log')).toContainText('restored · Oct 5 – 11');
  await cards.nth(1).locator('[data-again]').click();
  await page.waitForFunction((n) => window.sepiola.state().log.length > n, await page.evaluate(() => window.sepiola.state().log.length));
  expect(posts.length).toBe(postsBeforeRestore + 1); // run again went to the analyst
  // Codex feedback: a circle drawn before a re-read must show the new read's reason, not the old one.
  await page.evaluate(() => window.sepiola.run('circle zary'));
  await page.evaluate(() => window.sepiola.run('read_ice 7'));   // back to cgy-week1: Zary's reason changes
  await expect(page.locator('.win[data-name="rink"] .sub')).toContainText('Oct 5 – 11');
  await expect(page.locator('[data-view="spot"] .callout text')).toHaveText('2 games, back-to-back');
  await page.evaluate(() => window.sepiola.run('read_ice 3 2026-10-05'));   // thin-week again
  await expect(page.locator('[data-view="spot"] .callout text')).toHaveText('2 games this week');
  // Codex feedback: a date alone means "the week starting that day"; nonsense says what was expected.
  const shorthand = await page.evaluate(() => window.sepiola.run('read_ice 2026-10-05'));
  expect(shorthand.window).toEqual({ start: '2026-10-05', end: '2026-10-11', days: 7 }); // the mocked analyst answers 7-day reads with cgy-week1
  expect(posts.at(-1)).toMatchObject({ look_ahead_days: 7, start: '2026-10-05' });
  const nonsense = await page.evaluate(() => window.sepiola.run('read_ice seven'));
  expect(nonsense.error).toBe('Expected a number for look_ahead_days. Try: read_ice 7 2026-10-05');
  await expect(page.locator('[data-view="console"] .log')).toContainText('Expected a number for look_ahead_days');
  const state = await page.evaluate(() => window.sepiola.state());
  expect(state.source).toEqual({ mode: 'live', text: 'Zary LW\nGridin LW', opponent_text: 'Auston Matthews C' });
  await page.click('.signal summary');
  await expect(page.locator('#signal-panel')).toContainText(/chirp · season 20262027 · answered in \d+ ms/);
  await expect(page.locator('#signal-panel')).toContainText('23 tools at http://analyst.test/mcp');
  await page.screenshot({ path: 'test/shots/signal-live.png' });
});

test('a read the screen cannot draw is refused in the transcript, not drawn', async ({ page }) => {
  await page.route('**/read', (route) => route.fulfill({ status: 200, headers: CORS, body: JSON.stringify({ contract_version: '0.1', skaters: 'many' }) }));
  await page.goto('/?analyst=http://analyst.test');
  await page.waitForFunction(() => window.sepiola?.ready === true);
  const ack = await page.evaluate(() => window.sepiola.call('cue_roster', { text: 'Zary LW' }));
  expect(ack.error).toMatch(/cannot draw: read\./);
  expect((await page.evaluate(() => window.sepiola.state())).read).toBeNull();
});

test('an analyst that does not answer is reported, and fixtures still work without one', async ({ page }) => {
  await page.route('**/read', (route) => route.abort());
  await page.goto('/?analyst=http://analyst.test');
  await page.waitForFunction(() => window.sepiola?.ready === true);
  const ack = await page.evaluate(() => window.sepiola.call('cue_roster', { text: 'Zary LW' }));
  expect(ack.error).toMatch(/did not answer at http:\/\/analyst\.test/);
  await page.goto('/');
  await page.waitForFunction(() => window.sepiola?.ready === true);
  const noAnalyst = await page.evaluate(() => window.sepiola.call('cue_roster', { text: 'Zary LW' }));
  expect(noAnalyst.error).toMatch(/No analyst is configured/);
  expect(await page.evaluate(() => window.sepiola.run('cue_roster cgy-week1'))).toEqual({ cued: 'fx-cgy-week1', skaters: 15 });
});

test('in fixture mode the week is labelled but the week controls stay hidden', async ({ page }) => {
  await boot(page);
  await page.click('.win[data-name="welcome"] [data-sample]');
  await page.waitForFunction(() => window.sepiola.state().ice === true);
  await expect(page.locator('.win[data-name="rink"] .sub')).toContainText('Oct 5 – 11');
  expect(await page.locator('.week-nav').isVisible()).toBe(false);
  // Codex feedback: the compact games-in-hand opens to both rosters, as the analyst counted them.
  expect(await page.locator('.tally').count()).toBe(0);
  await page.click('[data-hand-toggle]');
  expect(await page.locator('.tally').count()).toBe(2);
  expect(await page.locator('.tally tbody tr').count()).toBe(24);
  await expect(page.locator('.counted')).toHaveText('Everyone not on injured reserve, bench included.');
  await page.evaluate(() => window.sepiola.settled());
  await page.screenshot({ path: 'test/shots/hand-detail.png' });
  await page.click('[data-hand-toggle]');
  expect(await page.locator('.tally').count()).toBe(0);
});

test('a visitor is welcomed, the sample loads through the grammar, and the welcome steps aside', async ({ page }) => {
  await boot(page);
  await expect(page.locator('.win[data-name="welcome"]')).toBeVisible();
  await expect(page.locator('.win[data-name="welcome"]')).toContainText('Nothing here has an opinion of its own.');
  await page.click('.win[data-name="welcome"] [data-sample]');
  await page.waitForFunction(() => window.sepiola.state().ice === true);
  await page.evaluate(() => window.sepiola.settled());
  const state = await page.evaluate(() => window.sepiola.state());
  expect(state.windows.welcome.open).toBe(false);
  expect(state.log.map((e) => e.line)).toEqual(['cue_roster cgy-week1', 'read_ice']);
  await page.screenshot({ path: 'test/shots/welcome-sample.png' });
});

test('the menubar menus open windows and the about sections answer to hashes', async ({ page }) => {
  await boot(page);
  await page.click('details.menu summary.brand');
  await expect(page.locator('.menu-list').first()).toBeVisible();
  await page.click('[data-open-about="privacy"]');
  await expect(page.locator('.win[data-name="about"]')).toBeVisible();
  await expect(page.locator('#about-privacy')).toContainText('No accounts, no sign-in, no cookies');
  expect(await page.evaluate(() => location.hash)).toBe('#privacy');
  await page.goto('/#terms');
  await page.waitForFunction(() => window.sepiola?.ready === true);
  expect(await page.evaluate(() => window.sepiola.state().windows.about.open)).toBe(true);
  await page.click('.win[data-name="about"] [data-close]');
  expect(await page.evaluate(() => location.hash)).toBe(''); // closing About forgets the section, so a reload starts on the welcome
  expect(await page.evaluate(() => window.sepiola.state().windows.about.open)).toBe(false);
  // the right column never overlaps: games in hand starts below the talkback
  const gap = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.win[data-name="hand"]')).top) - document.querySelector('.win[data-name="console"]').getBoundingClientRect().bottom);
  expect(gap).toBeGreaterThanOrEqual(8);
  await page.screenshot({ path: 'test/shots/about-terms.png' });
});

test('the paste window explains the formats and can fill itself with the sample lineup', async ({ page }) => {
  await boot(page);
  await page.click('.win[data-name="welcome"] [data-paste]');
  await page.click('.formats summary');
  expect(await page.locator('.formats-table tr').count()).toBe(6);
  await expect(page.locator('.formats-body')).toContainText('Matthews, Auston');
  await page.click('[data-paste-sample]');
  expect(await page.inputValue('#paste-in')).toMatch(/^Connor McDavid C\n/);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({ path: 'test/shots/paste-formats.png' });
});

test('clicking a skater opens the menu; spotlight, run it back, and compare-with need no ids', async ({ page }) => {
  await boot(page);
  await page.click('.win[data-name="welcome"] [data-sample]');
  await page.waitForFunction(() => window.sepiola.state().ice === true);
  await page.evaluate(() => window.sepiola.settled());
  await page.click('.jersey[data-id="zary"]');
  await expect(page.locator('.skater-menu')).toBeVisible();
  await expect(page.locator('.skater-menu b')).toHaveText('Zary');
  expect(await page.locator('.focus-ring[data-id="zary"]').count()).toBe(1); // the skater the menu is about is ringed
  await page.click('.skater-menu [data-act="circle"]');
  await page.waitForFunction(() => window.sepiola.state().circle?.id === 'zary');
  expect(await page.locator('.skater-menu').count()).toBe(0);
  await page.click('.jersey[data-id="gridin"]');
  await page.click('.skater-menu [data-act="compare"]');
  await expect(page.locator('.pick-bar')).toContainText('Compare Gridin with… click another skater.');
  expect(await page.locator('.focus-ring.picked[data-id="gridin"]').count()).toBe(1); // the first pick stays ringed
  await page.click('.jersey[data-id="zary"]');
  await page.waitForFunction(() => window.sepiola.state().replay?.ids?.join() === 'gridin,zary');
  expect(await page.locator('.pick-bar').textContent()).toBe('');
  await expect(page.locator('[data-view="replay"] .verdict-t')).toHaveText('Gridin skates 2 more. Start him.');
  // bench chips get the same menu, minus spotlight (bring the rink forward first: the replay window covers the bench)
  await page.evaluate(() => window.sepiola.run('cut_to rink'));
  await page.click('.chip[data-id="strome"]');
  expect(await page.locator('.skater-menu [data-act="circle"]').isDisabled()).toBe(true);
  await page.click('.skater-menu [data-act="replay"]');
  await page.waitForFunction(() => window.sepiola.state().replay?.ids?.join() === 'strome');
  await page.keyboard.press('Escape');
  await page.screenshot({ path: 'test/shots/skater-menu.png' });
});
