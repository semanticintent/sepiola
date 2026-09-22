// Window subtitles. Each says what the window is, and, once the ice is read, which week it shows — in the analyst's words
// (window.label). The screen never formats a date.
import { html } from '../html.js';
import { copy, fill } from '../copy.js';

const week = (state) => (state.ice && state.read?.window?.label ? html`<span class="week">${state.read.window.label}</span>` : '');

export function chrome(state) {
  if (!state.read) return html`${copy.rink.subEmpty}`;
  if (!state.ice) return html`${copy.rink.subBefore}`;
  return state.read.window.label ? html`${copy.rink.subRead}${week(state)}` : html`${fill(copy.rink.subAfter, { days: state.read.window.days })}`;
}
export const chromePanel = (state) => html`${copy.panel.sub}${week(state)}`;
export const chromeHand = (state) => html`${copy.hand.sub}${week(state)}`;
export const chromeReplay = (state) => html`${copy.replay.sub}${state.replay && !state.replay.board ? week(state) : ''}`;
