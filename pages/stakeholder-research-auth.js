const SESSION_STORAGE_KEY = 'stakeholder_research_authenticated';
const ATTEMPT_STORAGE_KEY = 'stakeholder_research_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 300000; // 5 minutes in milliseconds
const SALT = 'stakeholder_salt';
const ITERATIONS = 100000;
const PASSWORD_HASH = 'e0d42196b80a20d3a41b3420a2bf3cf3c2d9dbf1efbf15fd2b43f75ac22207e8';
// PBKDF2 hash function using Web Crypto API
async function pbkdf2Hash(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const saltData = encoder.encode(SALT);
    
    const key = await crypto.subtle.importKey(
        'raw',
        data,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );
    
    const bits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: saltData,
            iterations: ITERATIONS,
            hash: 'SHA-256'
        },
        key,
        256
    );
    
    const hashArray = Array.from(new Uint8Array(bits));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check if user is locked out
function isLockedOut() {
    const lockoutData = sessionStorage.getItem(ATTEMPT_STORAGE_KEY);
    if (!lockoutData) return false;
    
    try {
        const data = JSON.parse(lockoutData);
        if (data.attempts >= MAX_ATTEMPTS) {
            const timeSinceLockout = Date.now() - data.lockoutTime;
            if (timeSinceLockout < LOCKOUT_TIME) {
                const remainingMinutes = Math.ceil((LOCKOUT_TIME - timeSinceLockout) / 60000);
                return { locked: true, minutes: remainingMinutes };
            } else {
                // Reset after lockout period
                sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
                return false;
            }
        }
    } catch (e) {
        return false;
    }
    return false;
}

// Record failed attempt
function recordAttempt() {
    const lockoutData = sessionStorage.getItem(ATTEMPT_STORAGE_KEY);
    let data = lockoutData ? JSON.parse(lockoutData) : { attempts: 0 };
    data.attempts++;
    data.lockoutTime = Date.now();
    sessionStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(data));
}

// Check if user is already authenticated
function checkAuthentication() {
    const isAuthenticated = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
    if (isAuthenticated) {
        showContent();
    }
}

// Show content and hide password overlay
function showContent() {
    const overlay = document.getElementById('password-overlay');
    const content = document.getElementById('page-content');
    
    // Set attribute on html element for immediate hiding
    document.documentElement.setAttribute('data-authenticated', 'true');
    
    if (overlay) overlay.classList.add('hidden');
    if (content) content.classList.add('authenticated');
    
    // Store authentication in session storage
    sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    // Clear failed attempts on successful login
    sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
}

// Check password on form submit
async function checkPassword(event) {
    event.preventDefault();
    
    const passwordInput = document.getElementById('password-input');
    const errorDiv = document.getElementById('password-error');
    const submitBtn = document.querySelector('.password-submit-btn');
    const enteredPassword = passwordInput.value.trim();
    
    // Clear previous error
    if (errorDiv) errorDiv.textContent = '';
    
    // Check for lockout
    const lockout = isLockedOut();
    if (lockout && lockout.locked) {
        if (errorDiv) {
            errorDiv.textContent = `Too many failed attempts. Please try again in ${lockout.minutes} minute(s).`;
        }
        if (passwordInput) passwordInput.disabled = true;
        if (submitBtn) submitBtn.disabled = true;
        return;
    }
    
    if (!enteredPassword) {
        if (errorDiv) {
            errorDiv.textContent = 'Please enter a password.';
        }
        return;
    }
    
    // Hash the entered password and compare
    const enteredHash = await pbkdf2Hash(enteredPassword);
    
    if (enteredHash === (PASSWORD_HASH)) {
        showContent();
    } else {
        recordAttempt();
        const remaining = MAX_ATTEMPTS - (JSON.parse(sessionStorage.getItem(ATTEMPT_STORAGE_KEY) || '{"attempts":0}').attempts);
        
        // Show error
        if (errorDiv) {
            if (remaining > 0) {
                errorDiv.textContent = `Incorrect password. ${remaining} attempt(s) remaining.`;
            } else {
                errorDiv.textContent = `Too many failed attempts. Please try again in ${Math.ceil(LOCKOUT_TIME / 60000)} minutes.`;
                if (passwordInput) passwordInput.disabled = true;
                if (submitBtn) submitBtn.disabled = true;
            }
        }
        // Clear input and refocus
        if (passwordInput && !passwordInput.disabled) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    
    // Attach form submit handler
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', checkPassword);
    }
    
    // Check lockout status on load
    const lockout = isLockedOut();
    if (lockout && lockout.locked) {
        const passwordInput = document.getElementById('password-input');
        const errorDiv = document.getElementById('password-error');
        const submitBtn = document.querySelector('.password-submit-btn');
        if (passwordInput) passwordInput.disabled = true;
        if (submitBtn) submitBtn.disabled = true;
        if (errorDiv) {
            errorDiv.textContent = `Too many failed attempts. Please try again in ${lockout.minutes} minute(s).`;
        }
    }
});

