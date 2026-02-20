/**
 * blockly-drag-fix.js
 * Fixes block dragging for old Blockly builds in modern browsers.
 *
 * Root cause: Old Blockly (pre-2021, using goog.events) listens for
 * mousedown/mousemove/mouseup on SVG elements. Modern Chrome (v92+) routes
 * all input through the Pointer Events API first, and if touch-action is not
 * "none", the browser captures subsequent pointermove events for scrolling,
 * so the SVG never sees the mousemove — drag silently breaks.
 *
 * Fix approach:
 * 1. Wait for Blockly to inject the workspace SVG, then set touch-action:none
 *    on it so the browser stops intercepting pointer moves.
 * 2. Forward pointerdown/pointermove/pointerup to synthetic
 *    mousedown/mousemove/mouseup events on the same target so Blockly's
 *    goog.events listeners fire correctly.
 */
(function () {
    'use strict';

    // ── helpers ────────────────────────────────────────────────────────────────

    function syntheticMouse(type, pointerEvt) {
        var evt = new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            detail: 1,
            screenX: pointerEvt.screenX,
            screenY: pointerEvt.screenY,
            clientX: pointerEvt.clientX,
            clientY: pointerEvt.clientY,
            ctrlKey: pointerEvt.ctrlKey,
            altKey: pointerEvt.altKey,
            shiftKey: pointerEvt.shiftKey,
            metaKey: pointerEvt.metaKey,
            button: pointerEvt.button || 0,
            buttons: pointerEvt.buttons || 1,
            relatedTarget: null
        });
        return evt;
    }

    var shimActive = false;
    var captured = false;
    var downTarget = null;

    function onPointerDown(e) {
        // Only act on primary (left) button and when the target is inside the
        // Blockly SVG workspace or flyout.
        if (e.button !== 0) return;
        var svg = document.querySelector('svg.blocklySvg');
        if (!svg || !svg.contains(e.target)) return;

        // Prevent the browser's default scroll behaviour so pointermove stays live.
        e.preventDefault();

        downTarget = e.target;
        captured = true;

        // Forward as mousedown so Blockly starts its drag state machine.
        downTarget.dispatchEvent(syntheticMouse('mousedown', e));

        // Capture so we keep receiving pointermove even outside the SVG.
        try { e.target.setPointerCapture(e.pointerId); } catch (_) { }
    }

    function onPointerMove(e) {
        if (!captured) return;
        e.preventDefault();
        // Dispatch on the original down target so Blockly's listener fires.
        var target = downTarget || e.target;
        target.dispatchEvent(syntheticMouse('mousemove', e));
    }

    function onPointerUp(e) {
        if (!captured) return;
        captured = false;
        var target = downTarget || e.target;
        downTarget = null;
        target.dispatchEvent(syntheticMouse('mouseup', e));
        try { e.target.releasePointerCapture(e.pointerId); } catch (_) { }
    }

    function onPointerCancel(e) {
        if (!captured) return;
        captured = false;
        var target = downTarget || e.target;
        downTarget = null;
        target.dispatchEvent(syntheticMouse('mouseup', e));
        try { e.target.releasePointerCapture(e.pointerId); } catch (_) { }
    }

    // ── apply touch-action:none to workspace SVG ───────────────────────────────

    function patchSvgTouchAction() {
        var svg = document.querySelector('svg.blocklySvg');
        if (!svg) return false;

        // touch-action: none tells the browser "don't handle scroll/zoom here,
        // let JS do it" — this unblocks pointermove delivery.
        svg.style.touchAction = 'none';

        // Also patch the toolbox flyout if present.
        var flyout = document.querySelector('.blocklyFlyout');
        if (flyout) flyout.style.touchAction = 'none';

        return true;
    }

    // ── install pointer shim ───────────────────────────────────────────────────

    function installShim() {
        if (shimActive) return;
        shimActive = true;

        // Capture phase so we intercept before Blockly's goog.events listeners.
        document.addEventListener('pointerdown', onPointerDown, { capture: true, passive: false });
        document.addEventListener('pointermove', onPointerMove, { capture: true, passive: false });
        document.addEventListener('pointerup', onPointerUp, { capture: true, passive: false });
        document.addEventListener('pointercancel', onPointerCancel, { capture: true, passive: false });
    }

    // ── wait for Blockly to render the SVG, then patch ────────────────────────

    function waitForBlockly() {
        // Blockly renders after DOMContentLoaded + inject() call.
        // Poll until the SVG appears.
        var attempts = 0;
        var interval = setInterval(function () {
            attempts++;
            if (patchSvgTouchAction()) {
                clearInterval(interval);
                console.log('[blockly-drag-fix] SVG patched – drag should now work.');
            } else if (attempts > 100) {
                clearInterval(interval);
                console.warn('[blockly-drag-fix] SVG not found after 10s – patch skipped.');
            }
        }, 100);
    }

    // Run early so the shim is in place before any user interaction.
    installShim();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForBlockly);
    } else {
        waitForBlockly();
    }

})();
