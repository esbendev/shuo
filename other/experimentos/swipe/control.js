// ==========================================
// 8BitDo Micro (G-Mode) Background Keyboard Adapter
// ==========================================
(() => {
    // CONFIGURATION: Map 8BitDo button indexes to Arrow Keys
    const controllerMapping = {
        // map abyx
        0: "ArrowUp",     // A
        1: "ArrowRight",   // B
        2: "ArrowLeft",   // X
        3: "ArrowDown",  // Y
    };

    let controllerIndex = null;
    let prevStates = [];
    let pollInterval = null;

    // Listen for the controller connection
    window.addEventListener("gamepadconnected", (e) => {
        controllerIndex = e.gamepad.index;
        prevStates = new Array(e.gamepad.buttons.length).fill(false);
        
        // Start checking the controller state 60 times a second in the background
        if (!pollInterval) {
            pollInterval = setInterval(checkGamepad, 1000 / 60);
        }
    });

    // Clear everything if disconnected
    window.addEventListener("gamepaddisconnected", () => {
        controllerIndex = null;
        clearInterval(pollInterval);
        pollInterval = null;
    });

    // Plain background checker function
    function checkGamepad() {
        if (controllerIndex === null) return;

        const gp = navigator.getGamepads()[controllerIndex];
        if (!gp) return;

        gp.buttons.forEach((button, index) => {
            const isPressed = button.pressed;
            const wasPressed = prevStates[index];
            const targetKey = controllerMapping[index];

            // Only fire exactly ONCE when the user presses down
            if (isPressed && !wasPressed && targetKey) {
                // Fake a physical keyboard event
                const keyEvent = new KeyboardEvent("keydown", {
                    key: targetKey,
                    code: targetKey,
                    bubbles: true,
                    cancelable: true
                });
                
                // Blast it out to the window for your existing code to handle
                window.dispatchEvent(keyEvent);
            }

            // Save state for next check
            prevStates[index] = isPressed;
        });
    }
})();
