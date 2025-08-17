/**
 * Timer Module
 * Handles game timing and countdown functionality
 */

class Timer {
    constructor() {
        this.intervalId = null;
        this.timeLeft = 0;
        this.callback = null;
        this.onTick = null;
    }

    /**
     * Start a countdown timer
     */
    start(duration, onComplete, onTick = null) {
        this.stop(); // Clear any existing timer
        
        this.timeLeft = duration;
        this.callback = onComplete;
        this.onTick = onTick;
        
        // Initial tick
        if (this.onTick) {
            this.onTick(this.timeLeft);
        }
        
        this.intervalId = setInterval(() => {
            this.timeLeft--;
            
            if (this.onTick) {
                this.onTick(this.timeLeft);
            }
            
            if (this.timeLeft <= 0) {
                this.stop();
                if (this.callback) {
                    this.callback();
                }
            }
        }, 1000);
    }

    /**
     * Stop the timer
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Get remaining time
     */
    getTimeLeft() {
        return this.timeLeft;
    }

    /**
     * Check if timer is running
     */
    isRunning() {
        return this.intervalId !== null;
    }

    /**
     * Add time to the timer
     */
    addTime(seconds) {
        this.timeLeft += seconds;
        if (this.onTick) {
            this.onTick(this.timeLeft);
        }
    }

    /**
     * Set new time
     */
    setTime(seconds) {
        this.timeLeft = seconds;
        if (this.onTick) {
            this.onTick(this.timeLeft);
        }
    }
}

// Export timer instances
export const gameTimer = new Timer();
export const syncTimer = new Timer();
