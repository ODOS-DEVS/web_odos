export const THEME_KEY = "odos-theme";

/**
 * Runs before first paint (inlined in <head>) so the page never flashes the wrong
 * theme. Uses the stored choice, else the OS setting, and keeps following the OS
 * until the viewer picks a theme explicitly.
 */
export const themeScript = `(function(){var k=${JSON.stringify(THEME_KEY)},d=document.documentElement,m=matchMedia("(prefers-color-scheme: dark)"),s=null;try{s=localStorage.getItem(k)}catch(e){}d.dataset.theme=s==="light"||s==="dark"?s:m.matches?"dark":"light";m.addEventListener("change",function(e){var v=null;try{v=localStorage.getItem(k)}catch(x){}if(!v)d.dataset.theme=e.matches?"dark":"light"})})();`;
