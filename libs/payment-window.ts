"use client";

/**
 * The tab the shopper is paying in.
 *
 * On mobile the provider's page lives in a browser sheet, so when the charge
 * lands the sheet dismisses and the shopper is simply back in the app. A
 * browser tab has no such behaviour: KutanaPay cannot redirect anywhere (its
 * API has no return-URL field at all), so after paying, the shopper sits on
 * the provider's page while our own tab quietly confirms the order behind it.
 * They never see it.
 *
 * Holding the handle here closes that gap. The handle is module state rather
 * than React state on purpose: checkout and the result screen are different
 * routes, and the component that opened the window unmounts on the way. App
 * Router navigation keeps the same JS context, so the handle survives the
 * trip — and a hard reload simply loses it, which degrades to the old
 * behaviour rather than breaking.
 */

let paymentWindow: Window | null = null;

export function rememberPaymentWindow(win: Window | null) {
  paymentWindow = win;
}

/** Close the provider tab and bring this one forward. Safe to call repeatedly. */
export function closePaymentWindow() {
  const win = paymentWindow;
  paymentWindow = null;
  if (!win) {
    return;
  }
  try {
    if (!win.closed) {
      // Allowed cross-origin because we opened it: a script may close a window
      // it opened itself, whatever origin it later navigated to.
      win.close();
    }
  } catch {
    // Never let tidying up a tab interrupt a confirmed payment.
  }
  try {
    // Closing the provider tab usually returns focus here on its own; asking
    // is a no-op when it does, and helps when it does not.
    window.focus();
  } catch {
    /* ignore */
  }
}
