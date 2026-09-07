// Every view, by the data-view it renders into. Views never import each other.
import { about } from './about.js';
import { chrome, chromePanel, chromeHand, chromeReplay } from './chrome.js';
import { consoleView } from './console.js';
import { focus } from './focus.js';
import { formats } from './formats.js';
import { hand } from './hand.js';
import { menu } from './menu.js';
import { pick } from './pick.js';
import { panel } from './panel.js';
import { replay } from './replay.js';
import { rink } from './rink.js';
import { spot } from './spot.js';
import { strips } from './strips.js';
import { welcome } from './welcome.js';

export const views = { chrome, 'chrome-panel': chromePanel, 'chrome-hand': chromeHand, 'chrome-replay': chromeReplay, rink, spot, strips, replay, panel, hand, console: consoleView, welcome, about, formats, menu, pick, focus };
