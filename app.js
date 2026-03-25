import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

// INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const BLACKGATE = (() => {
    
    const boot = () => {
        _log("KERNEL: INITIALIZING_OMEGA_CORE", "var(--accent-neon)");
        _initClock();
        _initAuth();
        _loadPrefs();
    };

    const _initClock = () => {
        setInterval(() => {
            document.getElementById('os-time').innerText = new Date().toLocaleTimeString('en-GB', { hour12: false });
        }, 1000);
    };

    const _initAuth = () => {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                document.body.classList.add('authenticated');
                _sync();
                _log("SESSION: ACTIVE_NODE_" + user.uid.substring(0,6), "var(--success-neon)");
            } else {
                document.body.classList.remove('authenticated');
            }
        });

        document.getElementById('auth-trigger').onclick = async () => {
            const e = document.getElementById('login-email').value;
            const p = document.getElementById('login-pass').value;
            try {
                await signInWithEmailAndPassword(auth, e, p);
            } catch (err) {
                document.getElementById('auth-log').innerText = "ACCESS_DENIED: " + err.code;
            }
        };
    };

    const _sync = () => {
        // Shield Listener
        onValue(ref(db, 'network/security_shield'), (s) => {
            const active = s.val() === 'Active';
            const b = document.getElementById('shield-toggle');
            b.innerText = active ? "SHIELD_ONLINE" : "SHIELD_OFFLINE";
            b.className = active ? "btn-core on" : "btn-core";
            _log("DATA_SYNC: SHIELD_" + s.val());
        });

        // Traffic Listener
        onValue(ref(db, 'network/traffic'), (s) => {
            const v = document.getElementById('traffic-viewport');
            const m = document.getElementById('map-render');
            v.innerHTML = ''; m.innerHTML = '';
            const data = s.val();
            if(data) Object.keys(data).forEach(id => {
                const el = document.createElement('div');
                el.className = 'feed-item';
                el.innerHTML = `<span style="color:var(--accent-neon)">${id.replaceAll('-','.')}</span><br>${data[id].current_page}`;
                v.prepend(el);
                
                const dot = document.createElement('div');
                dot.style = `position:absolute; width:3px; height:3px; background:var(--accent-neon); left:${Math.random()*90}%; top:${Math.random()*90}%; box-shadow:0 0 5px var(--accent-neon);`;
                m.appendChild(dot);
            });
        });

        // Command Bindings
        document.getElementById('sig-trigger').onclick = () => {
            const val = document.getElementById('sig-msg').value;
            if(val) set(ref(db, 'network/global_marquee'), val);
        };

        document.getElementById('shield-toggle').onclick = async () => {
            const r = ref(db, 'network/security_shield');
            const s = await get(r);
            set(r, s.val() === 'Active' ? 'Disabled' : 'Active');
        };

        document.getElementById('email-sync-btn').onclick = async () => {
            try { await updateEmail(auth.currentUser, document.getElementById('sync-email').value); alert("SYNC_OK"); } catch(e){ alert(e.message); }
        };

        document.getElementById('pass-sync-btn').onclick = async () => {
            try { await updatePassword(auth.currentUser, document.getElementById('sync-pass').value); alert("SYNC_OK"); } catch(e){ alert(e.message); }
        };

        fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => document.getElementById('node-ip').innerText = "NODE_IP: " + d.ip);
    };

    const _log = (m, c) => {
        const v = document.getElementById('log-viewport');
        const e = document.createElement('div');
        e.className = 'feed-item';
        e.style.color = c || 'var(--text-secondary)';
        e.innerHTML = `> [${new Date().toLocaleTimeString()}] ${m}`;
        v.prepend(e);
    };

    const _loadPrefs = () => {
        ['mod-map', 'mod-shield', 'mod-traffic'].forEach(id => {
            if(localStorage.getItem('x_pref_'+id) === 'true') {
                document.getElementById(id).classList.add('hidden-node');
                document.getElementById('tog-'+id.split('-')[1]).classList.remove('on');
            }
        });
    };

    return {
        boot,
        vaultUI: (s) => {
            document.getElementById('latency-vfx').style.display = 'flex';
            setTimeout(() => {
                document.getElementById('latency-vfx').style.display = 'none';
                document.getElementById('vault-overlay').classList.toggle('active', s);
            }, 700);
        },
        toggle: (n, t) => {
            const isH = document.getElementById(n).classList.toggle('hidden-node');
            document.getElementById(t).classList.toggle('on', !isH);
            localStorage.setItem('x_pref_'+n, isH);
        },
        scrollToTop: (id) => document.getElementById(id).scrollTop = 0,
        exit: () => signOut(auth).then(() => location.reload())
    };
})();

window.BLACKGATE = BLACKGATE;