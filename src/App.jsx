import { useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase';
import logo from './assets/logo.png';
function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);

  return isMobile;
}

function AuthScreen() {
  const isMobile = useIsMobile();
  const [mode, setMode] = useState('register');
  const [lang, setLang] = useState('de');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [purchaseCode, setPurchaseCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const t = {
    de: {
      subtitle: 'Login / Registrierung mit Kaufcode',
      name: 'Name',
      email: 'E-Mail',
      password: 'Passwort',
      code: 'Kaufcode',
      register: 'Registrieren',
      login: 'Login',
      reset: 'Passwort vergessen',
      resetBtn: 'Reset-Link senden',
      wait: 'Bitte warten...',
      successRegister: 'Registrierung erfolgreich. Bitte prüfe deine E-Mail.',
      successLogin: 'Login erfolgreich.',
      successReset: 'Reset-Link wurde per E-Mail gesendet.',
      checkCodeError: 'Fehler beim Prüfen des Kaufcodes.',
      codeInvalid: 'Kaufcode ungültig oder bereits benutzt.',
      userCreateError: 'Benutzer konnte nicht erstellt werden.',
      codeUpdateError: 'Kaufcode konnte nicht aktualisiert werden.',
      genericError: 'Etwas ist schiefgelaufen.',
      loginError: 'Login fehlgeschlagen.',
      resetError: 'Reset konnte nicht gestartet werden.',
    },
    en: {
      subtitle: 'Login / Register with purchase code',
      name: 'Name',
      email: 'Email',
      password: 'Password',
      code: 'Purchase code',
      register: 'Register',
      login: 'Login',
      reset: 'Forgot password',
      resetBtn: 'Send reset link',
      wait: 'Please wait...',
      successRegister: 'Registration successful. Please check your email.',
      successLogin: 'Login successful.',
      successReset: 'Reset link has been sent by email.',
      checkCodeError: 'Error while checking purchase code.',
      codeInvalid: 'Purchase code invalid or already used.',
      userCreateError: 'User could not be created.',
      codeUpdateError: 'Purchase code could not be updated.',
      genericError: 'Something went wrong.',
      loginError: 'Login failed.',
      resetError: 'Reset could not be started.',
    },
    hu: {
      subtitle: 'Bejelentkezés / Regisztráció vásárlási kóddal',
      name: 'Név',
      email: 'E-mail',
      password: 'Jelszó',
      code: 'Vásárlási kód',
      register: 'Regisztráció',
      login: 'Belépés',
      reset: 'Elfelejtett jelszó',
      resetBtn: 'Reset link küldése',
      wait: 'Kérlek várj...',
      successRegister: 'Sikeres regisztráció. Kérlek ellenőrizd az e-mailt.',
      successLogin: 'Sikeres bejelentkezés.',
      successReset: 'A reset link elküldve e-mailben.',
      checkCodeError: 'Hiba a vásárlási kód ellenőrzésekor.',
      codeInvalid: 'A vásárlási kód érvénytelen vagy már felhasznált.',
      userCreateError: 'A felhasználó nem hozható létre.',
      codeUpdateError: 'A vásárlási kód nem frissíthető.',
      genericError: 'Valami hiba történt.',
      loginError: 'Sikertelen bejelentkezés.',
      resetError: 'A reset nem indítható el.',
    },
  };

  async function handleRegister(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const normalizedCode = purchaseCode.trim().toUpperCase();

      const { data: codeRow, error: codeError } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', normalizedCode)
        .eq('is_used', false)
        .maybeSingle();

      if (codeError) throw new Error(t[lang].checkCodeError);
      if (!codeRow) throw new Error(t[lang].codeInvalid);

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw new Error(signUpError.message);

      const userId = signUpData.user?.id;
      if (!userId) throw new Error(t[lang].userCreateError);

      const { error: updateCodeError } = await supabase
        .from('access_codes')
        .update({
          is_used: true,
          used_by: userId,
          used_at: new Date().toISOString(),
        })
        .eq('id', codeRow.id);

      if (updateCodeError) throw new Error(t[lang].codeUpdateError);

      setMessage(t[lang].successRegister);
      setFullName('');
      setEmail('');
      setPassword('');
      setPurchaseCode('');
    } catch (err) {
      setMessage(err.message || t[lang].genericError);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error(error.message);

      setMessage(t[lang].successLogin);
    } catch (err) {
      setMessage(err.message || t[lang].loginError);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:5173/reset-password',
      });

      if (error) throw new Error(error.message);

      setMessage(t[lang].successReset);
    } catch (err) {
      setMessage(err.message || t[lang].resetError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={authPageStyle}>
      <div
  style={{
    ...authShellStyle,
    gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
  }}
>
        <div style={authHeroStyle}>
          <div style={heroBadgeStyle}>Brotformel</div>
          <h1
  style={{
    ...heroTitleStyle,
    fontSize: isMobile ? 40 : heroTitleStyle.fontSize,
    textAlign: isMobile ? 'center' : 'left',
  }}
>
  Premium bread formula app
</h1>
          <p style={heroTextStyle}>
            Geschützter Zugang mit Kaufcode, Passwort-Reset und Premium-Rechner für Brotformeln.
          </p>
          <div
  style={{
    ...authFeatureGrid,
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
  }}
>
            <div style={authFeatureCard}>Registrierung nur mit Kaufcode</div>
            <div style={authFeatureCard}>Sicherer Login</div>
            <div style={authFeatureCard}>Passwort-Reset per E-Mail</div>
          </div>
        </div>

        <div style={authCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <img
              src={logo}
              alt="Brotformel"
              style={{
                height: 70,
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
            {['de', 'en', 'hu'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: lang === l ? '#111' : '#ddd',
                  color: lang === l ? 'white' : '#111',
                  fontWeight: 600,
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <p style={{ color: '#6a6158', marginTop: 0, textAlign: 'center' }}>
            {t[lang].subtitle}
          </p>

          <div style={styles.tabs}>
            <button onClick={() => setMode('register')} style={mode === 'register' ? styles.activeTab : styles.tab}>
              {t[lang].register}
            </button>
            <button onClick={() => setMode('login')} style={mode === 'login' ? styles.activeTab : styles.tab}>
              {t[lang].login}
            </button>
            <button onClick={() => setMode('reset')} style={mode === 'reset' ? styles.activeTab : styles.tab}>
              {t[lang].reset}
            </button>
          </div>

          {mode === 'register' && (
            <form onSubmit={handleRegister} style={styles.form}>
              <input
                style={styles.input}
                placeholder={t[lang].name}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <input
                style={styles.input}
                placeholder={t[lang].email}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                style={styles.input}
                placeholder={t[lang].password}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                style={styles.input}
                placeholder={t[lang].code}
                value={purchaseCode}
                onChange={(e) => setPurchaseCode(e.target.value)}
                required
              />
              <button style={styles.button} disabled={loading}>
                {loading ? t[lang].wait : t[lang].register}
              </button>
            </form>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} style={styles.form}>
              <input
                style={styles.input}
                placeholder={t[lang].email}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                style={styles.input}
                placeholder={t[lang].password}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button style={styles.button} disabled={loading}>
                {loading ? t[lang].wait : t[lang].login}
              </button>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} style={styles.form}>
              <input
                style={styles.input}
                placeholder={t[lang].email}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button style={styles.button} disabled={loading}>
                {loading ? t[lang].wait : t[lang].resetBtn}
              </button>
            </form>
          )}

          {message && <div style={styles.message}>{message}</div>}
        </div>
      </div>
    </div>
  );
}

function ProtectedApp({ user, onLogout }) {
  const isMobile = useIsMobile();
  
  const [lang, setLang] = useState('de');
  const [tab, setTab] = useState('mix');

  const [baseWaterPct, setBaseWaterPct] = useState(80);
  const [saltPercent, setSaltPercent] = useState(2);
  const [method, setMethod] = useState('both'); // yeast | sourdough | both
  const [time, setTime] = useState('8-12h');
  const [autoMode, setAutoMode] = useState(true);
  const [manualYeastPercent, setManualYeastPercent] = useState(0.3);
  const [manualSourdoughPercent, setManualSourdoughPercent] = useState(20);
  const [adminCodes, setAdminCodes] = useState([]);
  const [adminProfiles, setAdminProfiles] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  const [flourAmount, setFlourAmount] = useState(1000);
  const [desiredDough, setDesiredDough] = useState(1000);
  const [pieces, setPieces] = useState(2);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  console.log('USER EMAIL:', user?.email);
  console.log('PROFILE:', profile);
  console.log('IS ADMIN:', isAdmin);
  const [stats, setStats] = useState({
  totalCodes: 0,
  validCodes: 0,
  usedCodes: 0,
  totalUsers: 0,
});
  const [flours, setFlours] = useState({
    wheat: 700,
    wholegrain: 200,
    rye: 100,
    spelt: 0,
    oat: 0,
    durum: 0,
    corn: 0,
    misc: 0,
  });

  useEffect(() => {
  async function loadProfile() {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, preferred_language')
      .eq('id', user.id)
      .maybeSingle();

    console.log('PROFILE LOAD DATA:', data);
    console.log('PROFILE LOAD ERROR:', error);

    setProfile(data || null);
    setIsAdmin(
      data?.role === 'admin' || user?.email === 'digitalvirello@gmail.com'
    );
  }

  loadProfile();
}, [user?.id]);

    useEffect(() => {
  async function loadAdminData() {
    if (tab !== 'admin') return;

    setAdminLoading(true);

    try {
      const { data: codes, error: codesError } = await supabase
        .from('access_codes')
        .select('id, code, is_used, used_at, created_at')
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      const { count: totalCodes } = await supabase
        .from('access_codes')
        .select('*', { count: 'exact', head: true });

      const { count: validCodes } = await supabase
        .from('access_codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_used', false);

      const { count: usedCodes } = await supabase
        .from('access_codes')
        .select('*', { count: 'exact', head: true })
        .eq('is_used', true);

      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      console.log('codesError:', codesError);
      console.log('profilesError:', profilesError);
      console.log('codes:', codes);
      console.log('profiles:', profiles);

      setAdminCodes(codes || []);
      setAdminProfiles(profiles || []);

      setStats({
        totalCodes: totalCodes || 0,
        validCodes: validCodes || 0,
        usedCodes: usedCodes || 0,
        totalUsers: totalUsers || 0,
      });
    } catch (err) {
      console.error('Admin load failed:', err);
    } finally {
      setAdminLoading(false);
    }
  }

  loadAdminData();
}, [tab]);
  const t = {
    de: {
      brand: 'Brotformel',
      hero: 'Premium Brot-Rechner für Sauerteig, Hefe, Hydration und Mehlmischungen.',
      premium: 'Premium',
      mobile: 'Mobile optimiert',
      baker: 'Brot-Rechner',
      loggedInAs: 'Eingeloggt als',
      logout: 'Abmelden',
      language: 'Sprache',
      tabs: {
        mix: 'Mischung',
        flour: 'Mehl',
        dough: 'Teig',
        recipe: 'Rezept',
        admin: 'Admin',
      },
      fields: {
        baseWater: 'Basis-Wasser',
        salt: 'Salz',
        method: 'Methode',
        time: 'Zeit',
        logic: 'Sauerteig / Hefe Logik',
        auto: 'Automatisch',
        manual: 'Manuell',
        manualYeast: 'Hefe manuell',
        manualSourdough: 'Sauerteig manuell',
        totalFlour: 'Gesamtmehl',
        hydration: 'Hydration %',
        saltPercent: 'Salz %',
        yeastPercent: 'Hefe %',
        sourdoughPercent: 'Sauerteig %',
        desiredDough: 'Gewünschter Gesamtteig',
        breads: 'Anzahl Brote',
        totalDough: 'Gesamtteig',
        effectiveHydration: 'Effektive Hydration',
        extraWater: 'Zusatzwasser aus Mehlmix',
      },
      methods: {
        yeast: 'Hefe',
        sourdough: 'Sauerteig',
        both: 'Kombi',
      },
      times: {
        '2-4h': '2–4h',
        '8-12h': '8–12h',
        '24h': '24h',
      },
      flours: {
        wheat: 'Weizenmehl',
        wholegrain: 'Vollkorn',
        rye: 'Roggen',
        spelt: 'Dinkel',
        oat: 'Hafer',
        durum: 'Hartweizen',
        corn: 'Mais',
        misc: 'Sonstiges',
      },
      cards: {
        summary: 'Live-Zusammenfassung',
        ingredients: 'Zutaten',
        instructions: 'Anleitung',
        admin: 'Interner Admin-Bereich',
      },
      labels: {
        flour: 'Mehl',
        water: 'Wasser',
        salt: 'Salz',
        yeast: 'Hefe',
        sourdough: 'Sauerteig',
        total: 'Gesamt',
        perBread: 'Pro Brot',
        directFlour: 'Mehl direkt',
        directWater: 'Wasser direkt',
      },
      adminText: 'Hier kommen später Kaufcodes, Benutzer und Reset-Verwaltung rein.',
      recipeSteps: {
        step1: 'Mehl und Wasser mischen und 30 Minuten ruhen lassen.',
        step2: 'Sauerteig und/oder Hefe hinzufügen und gut einarbeiten.',
        step3: 'Salz hinzufügen und den Teig 5–10 Minuten kneten.',
        short: 'Teig 2–4 Stunden warm gehen lassen.',
        medium: 'Teig 8–12 Stunden bei Raumtemperatur gehen lassen.',
        long: 'Teig 24 Stunden langsam kühl reifen lassen.',
        step5: 'Während der ersten Phase 2–3 Mal dehnen und falten.',
        step6: 'Teig formen und 1 Stunde ruhen lassen.',
        step7: 'Ofen auf 250°C vorheizen.',
        step8: 'Mit Dampf 20 Minuten backen.',
        step9: 'Auf 220°C reduzieren und weitere 20 Minuten backen.',
        step10: 'Vollständig auskühlen lassen.',
      },
      copy: 'Rezept kopieren',
    },
    en: {
      brand: 'Brotformel',
      hero: 'Premium bread calculator for sourdough, yeast, hydration and flour mixes.',
      premium: 'Premium',
      mobile: 'Mobile optimized',
      baker: 'Bread calculator',
      loggedInAs: 'Logged in as',
      logout: 'Logout',
      language: 'Language',
      tabs: {
        mix: 'Mix',
        flour: 'Flour',
        dough: 'Dough',
        recipe: 'Recipe',
        admin: 'Admin',
      },
      fields: {
        baseWater: 'Base water',
        salt: 'Salt',
        method: 'Method',
        time: 'Time',
        logic: 'Sourdough / yeast logic',
        auto: 'Automatic',
        manual: 'Manual',
        manualYeast: 'Manual yeast',
        manualSourdough: 'Manual sourdough',
        totalFlour: 'Total flour',
        hydration: 'Hydration %',
        saltPercent: 'Salt %',
        yeastPercent: 'Yeast %',
        sourdoughPercent: 'Sourdough %',
        desiredDough: 'Desired total dough',
        breads: 'Number of breads',
        totalDough: 'Total dough',
        effectiveHydration: 'Effective hydration',
        extraWater: 'Extra water from flour mix',
      },
      methods: {
        yeast: 'Yeast',
        sourdough: 'Sourdough',
        both: 'Combo',
      },
      times: {
        '2-4h': '2–4h',
        '8-12h': '8–12h',
        '24h': '24h',
      },
      flours: {
        wheat: 'Wheat flour',
        wholegrain: 'Whole grain',
        rye: 'Rye',
        spelt: 'Spelt',
        oat: 'Oat',
        durum: 'Durum',
        corn: 'Corn',
        misc: 'Misc',
      },
      cards: {
        summary: 'Live summary',
        ingredients: 'Ingredients',
        instructions: 'Instructions',
        admin: 'Internal admin area',
      },
      labels: {
        flour: 'Flour',
        water: 'Water',
        salt: 'Salt',
        yeast: 'Yeast',
        sourdough: 'Sourdough',
        total: 'Total',
        perBread: 'Per bread',
        directFlour: 'Direct flour',
        directWater: 'Direct water',
      },
      adminText: 'Purchase codes, users and reset tools will be added here later.',
      recipeSteps: {
        step1: 'Mix flour and water and let rest for 30 minutes.',
        step2: 'Add sourdough and/or yeast and mix well.',
        step3: 'Add salt and knead the dough for 5–10 minutes.',
        short: 'Let the dough ferment 2–4 hours in a warm place.',
        medium: 'Let the dough ferment 8–12 hours at room temperature.',
        long: 'Let the dough mature slowly in the cold for 24 hours.',
        step5: 'Stretch and fold the dough 2–3 times during the first phase.',
        step6: 'Shape the dough and let rest for 1 hour.',
        step7: 'Preheat oven to 250°C.',
        step8: 'Bake 20 minutes with steam.',
        step9: 'Reduce to 220°C and bake 20 more minutes.',
        step10: 'Let cool completely.',
      },
      copy: 'Copy recipe',
    },
    hu: {
      brand: 'Brotformel',
      hero: 'Prémium kenyér kalkulátor kovászhoz, élesztőhöz, hidratációhoz és lisztkeverékekhez.',
      premium: 'Prémium',
      mobile: 'Mobilra optimalizálva',
      baker: 'Kenyér kalkulátor',
      loggedInAs: 'Bejelentkezve mint',
      logout: 'Kilépés',
      language: 'Nyelv',
      tabs: {
        mix: 'Keverék',
        flour: 'Liszt',
        dough: 'Tészta',
        recipe: 'Recept',
        admin: 'Admin',
      },
      fields: {
        baseWater: 'Alap víz',
        salt: 'Só',
        method: 'Módszer',
        time: 'Idő',
        logic: 'Kovász / élesztő logika',
        auto: 'Automatikus',
        manual: 'Kézi',
        manualYeast: 'Kézi élesztő',
        manualSourdough: 'Kézi kovász',
        totalFlour: 'Összes liszt',
        hydration: 'Hidratáció %',
        saltPercent: 'Só %',
        yeastPercent: 'Élesztő %',
        sourdoughPercent: 'Kovász %',
        desiredDough: 'Kívánt össztészta',
        breads: 'Kenyerek száma',
        totalDough: 'Össztészta',
        effectiveHydration: 'Effektív hidratáció',
        extraWater: 'Plusz víz a lisztkeverékből',
      },
      methods: {
        yeast: 'Élesztő',
        sourdough: 'Kovász',
        both: 'Kombó',
      },
      times: {
        '2-4h': '2–4h',
        '8-12h': '8–12h',
        '24h': '24h',
      },
      flours: {
        wheat: 'Búzaliszt',
        wholegrain: 'Teljes kiőrlésű',
        rye: 'Rozs',
        spelt: 'Tönköly',
        oat: 'Zab',
        durum: 'Durum',
        corn: 'Kukorica',
        misc: 'Egyéb',
      },
      cards: {
        summary: 'Élő összegzés',
        ingredients: 'Hozzávalók',
        instructions: 'Elkészítés',
        admin: 'Belső admin felület',
      },
      labels: {
        flour: 'Liszt',
        water: 'Víz',
        salt: 'Só',
        yeast: 'Élesztő',
        sourdough: 'Kovász',
        total: 'Összesen',
        perBread: 'Egy kenyérre',
        directFlour: 'Közvetlen liszt',
        directWater: 'Közvetlen víz',
      },
      adminText: 'Ide kerül később a kódok, felhasználók és reset kezelés.',
      recipeSteps: {
        step1: 'Keverd össze a lisztet és a vizet, majd pihentesd 30 percig.',
        step2: 'Add hozzá a kovászt és/vagy élesztőt, majd dolgozd össze.',
        step3: 'Add hozzá a sót, és dagaszd 5–10 percig.',
        short: 'Hagyd a tésztát 2–4 órát kelni melegebb helyen.',
        medium: 'Hagyd a tésztát 8–12 órát kelni szobahőmérsékleten.',
        long: 'Hagyd a tésztát 24 órán át lassan, hűvösen érni.',
        step5: 'Az első szakaszban 2–3 alkalommal hajtogasd meg.',
        step6: 'Formázd meg a tésztát, majd pihentesd 1 órát.',
        step7: 'Melegítsd elő a sütőt 250°C-ra.',
        step8: 'Gőzzel süsd 20 percig.',
        step9: 'Csökkentsd 220°C-ra, és süsd további 20 percig.',
        step10: 'Hagyd teljesen kihűlni.',
      },
      copy: 'Recept másolása',
    },
  };
  async function generateCode() {
  const newCode =
    'BF-' +
    Math.random().toString(36).substring(2, 6).toUpperCase() +
    '-' +
    Math.random().toString(36).substring(2, 6).toUpperCase();

  const { error } = await supabase.from('access_codes').insert({
    code: newCode,
    is_used: false,
  });

  if (!error) {
    await navigator.clipboard.writeText(newCode);
    alert('Code erstellt und kopiert: ' + newCode);

    const { data: codes } = await supabase
      .from('access_codes')
      .select('id, code, is_used, used_at, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    setAdminCodes(codes || []);
  }
}

  const flourConfig = [
    { key: 'wheat', extra: 0 },
    { key: 'wholegrain', extra: 0.12 },
    { key: 'rye', extra: 0.08 },
    { key: 'spelt', extra: 0.04 },
    { key: 'oat', extra: 0.05 },
    { key: 'durum', extra: 0.02 },
    { key: 'corn', extra: 0.03 },
    { key: 'misc', extra: 0 },
  ];

  const flourMix = useMemo(() => {
    const items = flourConfig.map((item) => {
      const grams = Number(flours[item.key]) || 0;
      return {
        ...item,
        grams,
        share: 0,
      };
    });

    const totalFlour = items.reduce((sum, item) => sum + item.grams, 0);
    const weightedExtra = totalFlour > 0
      ? items.reduce((sum, item) => sum + (item.grams / totalFlour) * item.extra, 0)
      : 0;

    const hydratedItems = items.map((item) => ({
      ...item,
      share: totalFlour > 0 ? item.grams / totalFlour : 0,
    }));

    return {
      items: hydratedItems,
      totalFlour,
      weightedExtra,
      hydrationPct: Number(baseWaterPct) + weightedExtra * 100,
    };
  }, [flours, baseWaterPct]);

  function getYeastPct() {
    if (!autoMode) return Number(manualYeastPercent) / 100;

    if (method === 'sourdough') return 0;
    if (method === 'yeast') {
      if (time === '2-4h') return 0.015;
      if (time === '8-12h') return 0.003;
      return 0.001;
    }
    if (time === '2-4h') return 0.005;
    if (time === '8-12h') return 0.001;
    return 0.0003;
  }

  function getSourdoughPct() {
    if (!autoMode) return Number(manualSourdoughPercent) / 100;

    if (method === 'yeast') return 0;
    if (method === 'sourdough') {
      if (time === '2-4h') return 0.35;
      if (time === '8-12h') return 0.2;
      return 0.1;
    }
    if (time === '2-4h') return 0.2;
    if (time === '8-12h') return 0.1;
    return 0.05;
  }

  const sourdoughPct = getSourdoughPct();
  const yeastPct = getYeastPct();

  function calculateRecipe(totalFlourInput) {
    const flourTotal = Number(totalFlourInput) || 0;
    const hydrationPct = flourMix.hydrationPct / 100;
    const saltPct = Number(saltPercent) / 100;

    const sourdough = flourTotal * sourdoughPct;
    const sourdoughFlour = sourdough / 2;
    const sourdoughWater = sourdough / 2;

    const totalWater = flourTotal * hydrationPct;
    const directWater = totalWater - sourdoughWater;
    const directFlour = flourTotal - sourdoughFlour;

    const salt = flourTotal * saltPct;
    const yeast = flourTotal * yeastPct;
    const dryYeast = yeast / 3;

    const totalDough = directFlour + directWater + salt + sourdough + yeast;

    return {
      flourTotal,
      directFlour,
      totalWater,
      directWater,
      salt,
      sourdough,
      yeast,
      dryYeast,
      totalDough,
    };
  }

  const mixRecipe = calculateRecipe(flourMix.totalFlour);

  const flourRecipe = calculateRecipe(flourAmount);

  const totalPctForDough =
    1 +
    flourMix.hydrationPct / 100 +
    Number(saltPercent) / 100 +
    sourdoughPct +
    yeastPct;

  const flourFromDough = desiredDough / totalPctForDough;
  const doughRecipe = calculateRecipe(flourFromDough);

  const recipeSteps = [
    t[lang].recipeSteps.step1,
    t[lang].recipeSteps.step2,
    t[lang].recipeSteps.step3,
    time === '2-4h'
      ? t[lang].recipeSteps.short
      : time === '8-12h'
        ? t[lang].recipeSteps.medium
        : t[lang].recipeSteps.long,
    t[lang].recipeSteps.step5,
    t[lang].recipeSteps.step6,
    t[lang].recipeSteps.step7,
    t[lang].recipeSteps.step8,
    t[lang].recipeSteps.step9,
    t[lang].recipeSteps.step10,
  ];

  const activeRecipe =
  tab === 'flour'
    ? flourRecipe
    : tab === 'dough'
      ? doughRecipe
      : mixRecipe;

const recipeText = `
${t[lang].cards.ingredients}
- ${t[lang].labels.flour}: ${activeRecipe.directFlour.toFixed(0)} g
- ${t[lang].labels.water}: ${activeRecipe.directWater.toFixed(0)} g
- ${t[lang].labels.salt}: ${activeRecipe.salt.toFixed(1)} g
${method !== 'yeast' ? `- ${t[lang].labels.sourdough}: ${activeRecipe.sourdough.toFixed(1)} g` : ''}
${method !== 'sourdough' ? `- ${t[lang].labels.yeast}: ${activeRecipe.yeast.toFixed(1)} g` : ''}

${t[lang].cards.instructions}
1. ${recipeSteps[0]}
2. ${recipeSteps[1]}
3. ${recipeSteps[2]}
4. ${recipeSteps[3]}
5. ${recipeSteps[4]}
6. ${recipeSteps[5]}
7. ${recipeSteps[6]}
8. ${recipeSteps[7]}
9. ${recipeSteps[8]}
10. ${recipeSteps[9]}
`.trim();

  return (
    <div style={appPageStyle}>
      <div style={{
  width: '100%',
  maxWidth: isMobile ? '100%' : 1280,
  margin: isMobile ? 0 : '0 auto'
}}>
        <div style={heroShellStyle}>
          <div
  style={{
    ...heroTopRowStyle,
    gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
  }}
>
            <div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <span style={goldBadgeStyle}>{t[lang].premium}</span>
                <span style={outlineBadgeStyle}>{t[lang].mobile}</span>
                <span style={outlineBadgeStyle}>{t[lang].baker}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
  <img
  src={logo}
  alt="Brotformel"
  style={{
    height: isMobile ? 70 : 100,
    maxWidth: '100%',
    width: 'auto',
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 12px rgba(231,194,122,0.6))',
    transition: '0.3s',
  }}
  onMouseEnter={(e) => (e.target.style.transform = 'scale(1.05)')}
  onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
/>
</div>
              <p style={heroMainTextStyle}>{t[lang].hero}</p>

              <div style={metricGridStyle}>
                <MetricCard title={t[lang].fields.effectiveHydration} value={`${round(flourMix.hydrationPct)}%`} />
                <MetricCard title={t[lang].labels.sourdough} value={`${round(sourdoughPct * 100, 2)}%`} />
                <MetricCard title={t[lang].labels.yeast} value={`${round(yeastPct * 100, 2)}%`} />
              </div>
            </div>

            <div style={headerSideCardStyle}>
              <div style={smallMutedStyle}>{t[lang].loggedInAs}</div>
              <div style={{ fontWeight: 700, marginBottom: 16 }}>{user?.email}</div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['de', 'en', 'hu'].map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    style={langButtonStyle(lang === l)}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              <button onClick={onLogout} style={lightButtonStyle}>
                {t[lang].logout}
              </button>
            </div>
          </div>

          <div
  style={{
    ...topSettingsShell,
    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)',
  }}
>
            <FieldBlock label={t[lang].fields.baseWater}>
              <input style={premiumInputDark} type="number" value={baseWaterPct} onChange={(e) => setBaseWaterPct(Number(e.target.value))} />
            </FieldBlock>

            <FieldBlock label={t[lang].fields.salt}>
              <input style={premiumInputDark} type="number" value={saltPercent} onChange={(e) => setSaltPercent(Number(e.target.value))} />
            </FieldBlock>

            <FieldBlock label={t[lang].fields.method}>
              <select style={premiumSelectStyle} value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="yeast">{t[lang].methods.yeast}</option>
                <option value="sourdough">{t[lang].methods.sourdough}</option>
                <option value="both">{t[lang].methods.both}</option>
              </select>
            </FieldBlock>

            <FieldBlock label={t[lang].fields.time}>
              <select style={premiumSelectStyle} value={time} onChange={(e) => setTime(e.target.value)}>
                <option value="2-4h">{t[lang].times['2-4h']}</option>
                <option value="8-12h">{t[lang].times['8-12h']}</option>
                <option value="24h">{t[lang].times['24h']}</option>
              </select>
            </FieldBlock>

            <FieldBlock label={t[lang].fields.logic}>
              <select style={premiumSelectStyle} value={autoMode ? 'auto' : 'manual'} onChange={(e) => setAutoMode(e.target.value === 'auto')}>
                <option value="auto">{t[lang].fields.auto}</option>
                <option value="manual">{t[lang].fields.manual}</option>
              </select>
            </FieldBlock>

            {!autoMode && (
              <>
                <FieldBlock label={t[lang].fields.manualSourdough}>
                  <input style={premiumInputDark} type="number" value={manualSourdoughPercent} onChange={(e) => setManualSourdoughPercent(Number(e.target.value))} />
                </FieldBlock>
                <FieldBlock label={t[lang].fields.manualYeast}>
                  <input style={premiumInputDark} type="number" value={manualYeastPercent} onChange={(e) => setManualYeastPercent(Number(e.target.value))} />
                </FieldBlock>
              </>
            )}
          </div>
        </div>

        <div
  style={{
    ...mainGridStyle,
    gridTemplateColumns: isMobile ? '1fr' : '1.15fr 0.85fr',
  }}
>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div
  style={{
    ...tabsBarStyle,
    display: 'flex',
    overflowX: 'auto',
    gap: 8,
  }}
>
              {['mix', 'flour', 'dough', 'recipe', ...(isAdmin ? ['admin'] : [])].map((tabKey) => (
                <button key={tabKey} onClick={() => setTab(tabKey)} style={{
  ...tabButtonStyle(tab === tabKey),
  minWidth: isMobile ? 120 : 'auto',
  flexShrink: 0,
}}>
                  {t[lang].tabs[tabKey]}
                </button>
              ))}
            </div>

            {tab === 'mix' && (
              <section style={creamCardStyle}>
                <h2 style={sectionTitleStyle}>{t[lang].tabs.mix}</h2>
                <p style={sectionTextStyle}>
                  {t[lang].fields.totalFlour}, {t[lang].fields.effectiveHydration} und {t[lang].fields.extraWater}
                </p>

                <div
  style={{
    ...flourGridStyle,
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
  }}
>
                  {flourMix.items.map((item) => (
                    <div key={item.key} style={flourCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1f1a17' }}>{t[lang].flours[item.key]}</div>
                          <div style={{ fontSize: 12, color: '#7a7064' }}>
                            +{round(item.extra * 100)}% water
                          </div>
                        </div>
                        <div style={smallBadgeStyle}>{round(item.share * 100)}%</div>
                      </div>

                      <input
                        style={premiumInput}
                        type="number"
                        value={flours[item.key]}
                        onChange={(e) =>
                          setFlours((prev) => ({
                            ...prev,
                            [item.key]: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>

                <div
  style={{
    ...resultGridLightStyle,
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
  }}
>
                  <ResultCardLight label={t[lang].fields.totalFlour} value={`${round(flourMix.totalFlour)} g`} strong />
                  <ResultCardLight label={t[lang].fields.extraWater} value={`${round(flourMix.weightedExtra * 100)} %`} />
                  <ResultCardLight label={t[lang].fields.effectiveHydration} value={`${round(flourMix.hydrationPct)} %`} />
                </div>
              </section>
            )}

            {tab === 'flour' && (
              <section style={creamCardStyle}>
                <h2 style={sectionTitleStyle}>{t[lang].tabs.flour}</h2>
                <p style={sectionTextStyle}>Für Fälle wie: „Ich habe 1 kg Mehl. Was brauche ich?“</p>

                <div style={fieldGridTwoStyle}>
                  <FieldBlockLight label={t[lang].fields.totalFlour}>
                    <input style={premiumInput} type="number" value={flourAmount} onChange={(e) => setFlourAmount(Number(e.target.value))} />
                  </FieldBlockLight>

                  <FieldBlockLight label={t[lang].fields.breads}>
                    <input style={premiumInput} type="number" value={pieces} onChange={(e) => setPieces(Number(e.target.value))} />
                  </FieldBlockLight>
                </div>

                <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                  <ResultRowLight label={t[lang].labels.directFlour} value={`${round(flourRecipe.directFlour)} g`} />
                  <ResultRowLight label={t[lang].labels.directWater} value={`${round(flourRecipe.directWater)} g`} />
                  <ResultRowLight label={t[lang].labels.salt} value={`${round(flourRecipe.salt)} g`} />
                  {method !== 'yeast' && <ResultRowLight label={t[lang].labels.sourdough} value={`${round(flourRecipe.sourdough)} g`} />}
                  {method !== 'sourdough' && <ResultRowLight label={t[lang].labels.yeast} value={`${round(flourRecipe.yeast)} g`} />}
                  <ResultRowLight label={t[lang].fields.totalDough} value={`${round(flourRecipe.totalDough)} g`} strong />
                  <ResultRowLight label={t[lang].labels.perBread} value={`${round(flourRecipe.totalDough / Math.max(1, pieces))} g`} />
                </div>
              </section>
            )}

            {tab === 'dough' && (
              <section style={creamCardStyle}>
                <h2 style={sectionTitleStyle}>{t[lang].tabs.dough}</h2>
                <p style={sectionTextStyle}>Für Fälle wie: „Ich will genau 1000 g Gesamtteig haben.“</p>

                <div
  style={{
    ...summaryTileGridStyle,
    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(2, 1fr)',
  }}
>
                  <FieldBlockLight label={t[lang].fields.desiredDough}>
                    <input style={premiumInput} type="number" value={desiredDough} onChange={(e) => setDesiredDough(Number(e.target.value))} />
                  </FieldBlockLight>

                  <FieldBlockLight label={t[lang].fields.breads}>
                    <input style={premiumInput} type="number" value={pieces} onChange={(e) => setPieces(Number(e.target.value))} />
                  </FieldBlockLight>
                </div>

                <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                  <ResultRowLight label={t[lang].labels.flour} value={`${round(doughRecipe.flourTotal)} g`} strong />
                  <ResultRowLight label={t[lang].labels.directWater} value={`${round(doughRecipe.directWater)} g`} />
                  <ResultRowLight label={t[lang].labels.salt} value={`${round(doughRecipe.salt)} g`} />
                  {method !== 'yeast' && <ResultRowLight label={t[lang].labels.sourdough} value={`${round(doughRecipe.sourdough)} g`} />}
                  {method !== 'sourdough' && <ResultRowLight label={t[lang].labels.yeast} value={`${round(doughRecipe.yeast)} g`} />}
                  <ResultRowLight label={t[lang].fields.totalDough} value={`${round(desiredDough)} g`} strong />
                  <ResultRowLight label={t[lang].labels.perBread} value={`${round(desiredDough / Math.max(1, pieces))} g`} />
                </div>
              </section>
            )}

            {tab === 'recipe' && (
  <section style={creamCardStyle}>
    <h2 style={sectionTitleStyle}>{t[lang].tabs.recipe}</h2>

    <p style={sectionTextStyle}>
      {tab === 'flour'
        ? 'Rezept auf Basis der Mehlmenge.'
        : tab === 'dough'
          ? 'Rezept auf Basis des gewünschten Gesamtteigs.'
          : 'Rezept auf Basis der aktuellen Mehlmischung.'}
    </p>

    <div style={recipeBoxStyle}>{recipeText}</div>

    <button
      style={{ ...styles.button, marginTop: 18, width: '100%' }}
      onClick={() => navigator.clipboard.writeText(recipeText)}
    >
      {t[lang].copy}
    </button>
  </section>
)}

            {tab === 'admin' && isAdmin && (
  <section style={creamCardStyle}>
    <h2 style={sectionTitleStyle}>{t[lang].cards.admin}</h2>
    <p style={sectionTextStyle}>{t[lang].adminText}</p>

    {adminLoading && <div>Lade Admin-Daten...</div>}

    {!adminLoading && (
      <>
        <div style={adminPreviewGridStyle}>
          <div style={adminStatCardStyle}>
            <div style={adminStatLabel}>Users</div>
            <div style={adminStatValue}>{adminProfiles.length}</div>
          </div>
          <div style={adminStatCardStyle}>
            <div style={adminStatLabel}>Codes</div>
            <div style={adminStatValue}>{adminCodes.length}</div>
          </div>
          <div style={adminStatCardStyle}>
            <div style={adminStatLabel}>Used</div>
            <div style={adminStatValue}>
              {adminCodes.filter((c) => c.is_used).length}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
  <h3 style={{ marginBottom: 10 }}>Codes</h3>
  <div style={{ display: 'grid', gap: 10 }}>
    {adminCodes.map((code) => (
      <div
        key={code.id}
        style={{
          ...resultRowLightStyle,
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontWeight: 600 }}>{code.code}</span>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
  <span
    style={{
      padding: '6px 10px',
      borderRadius: '999px',
      fontSize: 12,
      fontWeight: 700,
      background: code.is_used ? '#f3d6d6' : '#dff2df',
      color: code.is_used ? '#8a2d2d' : '#256c2b',
    }}
  >
    {code.is_used ? 'used' : 'active'}
  </span>

  <button
    onClick={() => navigator.clipboard.writeText(code.code)}
    style={{
      border: 'none',
      borderRadius: 10,
      padding: '8px 12px',
      cursor: 'pointer',
      background: '#efe7db',
      fontWeight: 600,
    }}
  >
    Copy
  </button>

  {!code.is_used && (
    <button
      onClick={async () => {
        const { error } = await supabase
          .from('access_codes')
          .update({ is_used: true })
          .eq('id', code.id);

        if (!error) {
          const { data: codes } = await supabase
            .from('access_codes')
            .select('id, code, is_used, used_at, created_at')
            .eq('is_used', false)
            .order('created_at', { ascending: false })
            .limit(10);

          setAdminCodes(codes || []);
        }
      }}
      style={{
        border: 'none',
        borderRadius: 10,
        padding: '8px 12px',
        cursor: 'pointer',
        background: '#e74c3c',
        color: 'white',
        fontWeight: 600,
      }}
    >
      Deaktivieren
    </button>
  )}
</div>
          
        </div>
      
    ))}
  </div>
</div>

        <div style={{ marginTop: 24 }}>
  <h3 style={{ marginBottom: 10 }}>Users</h3>
  <div style={{ display: 'grid', gap: 10 }}>
    {adminProfiles.map((profile) => (
      <div key={profile.id} style={resultRowLightStyle}>
        <div>
          <div style={{ fontWeight: 600 }}>{profile.email || profile.full_name || 'user'}</div>
          <div style={{ fontSize: 12, color: '#6d6358' }}>
            {profile.preferred_language || 'de'}
          </div>
        </div>
        <strong>{profile.role || 'user'}</strong>
      </div>
    ))}
  </div>
</div>
      </>
    )}
    <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
  <button
    style={{
      ...styles.button,
      background: '#111',
      minWidth: 220,
    }}
    onClick={generateCode}
  >
    Neuen Code erstellen
  </button>
</div>
  </section>
)}
          </div>

          <aside style={rightColumnShellStyle}>
            <h2 style={rightTitleStyle}>{t[lang].cards.summary}</h2>

            <div
  style={{
    ...summaryTileGridStyle,
    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(2, 1fr)',
  }}
>
              <SummaryTile label={t[lang].fields.baseWater} value={`${round(baseWaterPct)}%`} />
              <SummaryTile label={t[lang].fields.effectiveHydration} value={`${round(flourMix.hydrationPct)}%`} />
              <SummaryTile label={t[lang].labels.yeast} value={`${round(yeastPct * 100, 2)}%`} />
              <SummaryTile label={t[lang].labels.sourdough} value={`${round(sourdoughPct * 100, 2)}%`} />
            </div>

            <div style={darkInfoBoxStyle}>
              <div style={darkInfoLineStyle}>• Mehrere Mehlsorten mit Extra-Wasser</div>
              <div style={darkInfoLineStyle}>• Hefe, Sauerteig oder Kombi</div>
              <div style={darkInfoLineStyle}>• 2–4h, 8–12h oder 24h</div>
              <div style={darkInfoLineStyle}>• Mischung, Mehl, Teig und Rezept</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div style={metricCardStyle}>
      <div style={metricTitleStyle}>{title}</div>
      <div style={metricValueStyle}>{value}</div>
    </div>
  );
}

function FieldBlock({ label, children }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={fieldLabelDark}>{label}</div>
      {children}
    </div>
  );
}

function FieldBlockLight({ label, children }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={fieldLabel}>{label}</div>
      {children}
    </div>
  );
}

function ResultCardLight({ label, value, strong = false }) {
  return (
    <div style={{ ...resultLightCardStyle, ...(strong ? strongLightCardStyle : {}) }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function ResultRowLight({ label, value, strong = false }) {
  return (
    <div style={{ ...resultRowLightStyle, ...(strong ? strongResultRowLightStyle : {}) }}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SummaryTile({ label, value }) {
  return (
    <div style={summaryTileStyle}>
      <div style={summaryTileLabelStyle}>{label}</div>
      <div style={summaryTileValueStyle}>{value}</div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession ?? null);
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (loadingSession) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>Lade Sitzung...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <ProtectedApp user={session.user} onLogout={handleLogout} />;
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #231815 0%, #0f0a09 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '520px',
    background: '#f6f1ea',
    borderRadius: '24px',
    padding: '28px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  },
  title: {
    margin: 0,
    fontSize: '32px',
  },
  subtitle: {
    color: '#666',
    marginBottom: '20px',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
  },
  tab: {
    flex: 1,
    padding: '12px',
    borderRadius: '14px',
    border: '1px solid #ddd',
    background: 'white',
    cursor: 'pointer',
  },
  activeTab: {
    flex: 1,
    padding: '12px',
    borderRadius: '14px',
    border: '1px solid #111',
    background: '#111',
    color: 'white',
    cursor: 'pointer',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    height: '46px',
    borderRadius: '12px',
    border: '1px solid #d0d0d0',
    padding: '0 14px',
    fontSize: '16px',
  },
  button: {
    height: '48px',
    borderRadius: '14px',
    border: 'none',
    background: '#111',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '0 16px',
  },
  message: {
    marginTop: '16px',
    padding: '12px',
    borderRadius: '12px',
    background: '#fff',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
};

const authPageStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at top, #3b2f2f 0%, #1e1715 38%, #0f0a09 100%)',
  padding: 24,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Arial, sans-serif',
};

const authShellStyle = {
  width: '100%',
  maxWidth: 1200,
  display: 'grid',
  gridTemplateColumns: '1.1fr 0.9fr',
  gap: 24,
};

const authHeroStyle = {
  borderRadius: 32,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.05)',
  padding: 32,
  color: 'white',
  backdropFilter: 'blur(16px)',
};

const authCardStyle = {
  borderRadius: 32,
  background: '#f6f1ea',
  padding: 28,
  boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
};

const heroBadgeStyle = {
  display: 'inline-block',
  padding: '8px 14px',
  borderRadius: 999,
  background: '#e7c27a',
  color: '#1a140f',
  fontWeight: 700,
  marginBottom: 18,
};

const heroTitleStyle = {
  margin: 0,
  fontSize: 52,
  lineHeight: 1.05,
  color: 'white',
};

const heroTextStyle = {
  color: 'rgba(255,255,255,0.82)',
  fontSize: 18,
  lineHeight: 1.6,
  maxWidth: 650,
};

const authFeatureGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
  marginTop: 24,
};

const authFeatureCard = {
  borderRadius: 20,
  padding: 18,
  background: 'rgba(0,0,0,0.18)',
  border: '1px solid rgba(255,255,255,0.08)',
};

const appPageStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at top, #3a2a20 0%, #1a120e 42%, #080605 100%)',
  padding: 24,
  fontFamily: 'Arial, sans-serif',
};

const heroShellStyle = {
  marginBottom: 24,
  borderRadius: 36,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.06)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.28)',
  backdropFilter: 'blur(18px)',
  padding: 32,
};

const heroTopRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1.1fr 0.9fr',
  gap: 24,
  marginBottom: 24,
};

const goldBadgeStyle = {
  display: 'inline-block',
  padding: '8px 14px',
  borderRadius: 999,
  background: '#e7c27a',
  color: '#1a140f',
  fontWeight: 700,
};

const outlineBadgeStyle = {
  display: 'inline-block',
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.16)',
  background: 'rgba(0,0,0,0.18)',
  color: 'white',
};

const heroMainTitleStyle = {
  margin: 0,
  color: 'white',
  fontSize: 60,
  lineHeight: 1.05,
};

const heroMainTextStyle = {
  color: 'rgba(255,255,255,0.84)',
  fontSize: 20,
  maxWidth: 720,
};

const metricGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
  marginTop: 24,
};

const metricCardStyle = {
  borderRadius: 24,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(0,0,0,0.18)',
  padding: 18,
  color: 'white',
};

const metricTitleStyle = {
  fontSize: 12,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  opacity: 0.78,
  marginBottom: 8,
};

const metricValueStyle = {
  fontSize: 32,
  fontWeight: 700,
};

const headerSideCardStyle = {
  borderRadius: 28,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(0,0,0,0.18)',
  padding: 24,
  color: 'white',
  alignSelf: 'start',
};

const smallMutedStyle = {
  fontSize: 13,
  opacity: 0.72,
};

const langButtonStyle = (active) => ({
  padding: '8px 12px',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  background: active ? '#e7c27a' : '#e0e0e0',
  color: '#111',
  fontWeight: 700,
});

const lightButtonStyle = {
  height: 46,
  borderRadius: 14,
  border: 'none',
  background: 'white',
  color: '#111',
  padding: '0 16px',
  fontWeight: 700,
  cursor: 'pointer',
};

const topSettingsShell = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 16,
  alignItems: 'start',
};

const premiumInputDark = {
  height: 48,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'white',
  padding: '0 14px',
  fontSize: 15,
  outline: 'none',
};

const premiumSelectStyle = {
  height: 48,
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'white',
  padding: '0 14px',
  fontSize: 15,
  outline: 'none',
};

const fieldLabelDark = {
  color: 'white',
  fontSize: 14,
  fontWeight: 600,
};

const mainGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1.15fr 0.85fr',
  gap: 24,
};

const tabsBarStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 8,
  borderRadius: 24,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.05)',
  padding: 8,
};

const tabButtonStyle = (active) => ({
  height: 46,
  borderRadius: 16,
  border: 'none',
  cursor: 'pointer',
  background: active ? 'white' : 'transparent',
  color: active ? '#111' : 'white',
  fontWeight: 700,
});

const creamCardStyle = {
  borderRadius: 32,
  background: 'linear-gradient(180deg, #f8f3ec 0%, #f2ebe1 100%)',
  padding: 28,
  boxShadow: '0 20px 60px rgba(0,0,0,0.24)',
  border: '1px solid rgba(120, 90, 60, 0.08)',
};

const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: 8,
  fontSize: 30,
  color: '#1f1a17',
};

const sectionTextStyle = {
  color: '#72685d',
  marginTop: 0,
  marginBottom: 20,
};

const flourGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 16,
};

const flourCardStyle = {
  borderRadius: 24,
  background: 'white',
  border: '1px solid #e3dbd1',
  padding: 18,
};

const smallBadgeStyle = {
  borderRadius: 999,
  padding: '6px 10px',
  background: '#faf4ea',
  border: '1px solid #e5dac8',
  fontSize: 12,
  fontWeight: 700,
  alignSelf: 'start',
};

const resultGridLightStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
  marginTop: 18,
};

const resultLightCardStyle = {
  borderRadius: 22,
  border: '1px solid #e3dbd1',
  background: 'white',
  padding: 18,
};

const strongLightCardStyle = {
  background: 'linear-gradient(90deg, #f2e3c2 0%, #fff8eb 100%)',
};

const fieldGridTwoStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 14,
};

const premiumInput = {
  height: '52px',
  borderRadius: '16px',
  border: '1px solid #ddd6cc',
  padding: '0 16px',
  fontSize: '16px',
  background: 'white',
  outline: 'none',
};

const fieldLabel = {
  marginBottom: '6px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#5c5348',
};

const resultRowLightStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 18px',
  borderRadius: '18px',
  background: 'white',
  border: '1px solid #e5ddd2',
};

const strongResultRowLightStyle = {
  background: 'linear-gradient(90deg, #f2e3c2 0%, #fff8eb 100%)',
};

const recipeBoxStyle = {
  borderRadius: 20,
  background: 'white',
  border: '1px solid #e3dbd1',
  padding: 20,
  whiteSpace: 'pre-line',
  lineHeight: 1.65,
  fontSize: 14,
};

const adminPreviewGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
  marginTop: 18,
};

const adminStatCardStyle = {
  borderRadius: 20,
  border: '1px solid #e3dbd1',
  background: 'white',
  padding: 18,
};

const adminStatLabel = {
  fontSize: 13,
  color: '#6f675d',
  marginBottom: 8,
};

const adminStatValue = {
  fontSize: 30,
  fontWeight: 700,
  color: '#1c1714',
};

const rightColumnShellStyle = {
  borderRadius: 32,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.06)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.24)',
  backdropFilter: 'blur(18px)',
  padding: 24,
  color: 'white',
  alignSelf: 'start',
};

const rightTitleStyle = {
  marginTop: 0,
  fontSize: 28,
  color: 'white',
};

const summaryTileGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
  marginBottom: 18,
};

const summaryTileStyle = {
  borderRadius: 22,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.08)',
  padding: 18,
  boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
};

const summaryTileLabelStyle = {
  fontSize: 13,
  opacity: 0.72,
  marginBottom: 8,
};

const summaryTileValueStyle = {
  fontSize: 30,
  fontWeight: 700,
};

const darkInfoBoxStyle = {
  borderRadius: 24,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(0,0,0,0.18)',
  padding: 18,
  display: 'grid',
  gap: 12,
};

const darkInfoLineStyle = {
  fontSize: 14,
  color: 'rgba(255,255,255,0.9)',
};