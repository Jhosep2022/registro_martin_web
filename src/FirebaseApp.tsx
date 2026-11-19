import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { onValue, ref } from 'firebase/database';
import { Landmark } from 'lucide-react';
import { auth, database, firebaseConfigured } from './lib/firebase';
import { createFirebaseRepository } from './data/firebaseRepository';
import App from './App';

const repository = database ? createFirebaseRepository(database) : null;

export default function FirebaseApp() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [connected, setConnected] = useState(false);
  const [accessFailed, setAccessFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (value) => {
      setUser(value);
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (!auth || !ready || user) return;
    let active = true;
    signInAnonymously(auth).catch(() => {
      if (active) setAccessFailed(true);
    });
    return () => { active = false; };
  }, [ready, user, retry]);
  useEffect(() => {
    if (!database) return;
    return onValue(ref(database, '.info/connected'), (snapshot) => setConnected(snapshot.val() === true));
  }, []);

  if (user && repository) return <App key={user.uid} repository={repository} connected={connected} />;

  let content: ReactNode;
  if (!firebaseConfigured) {
    content = <>
      <h2>Aplicación pendiente de configuración</h2>
      <p>El administrador debe conectar esta aplicación antes de comenzar a registrar notas.</p>
    </>;
  } else if (accessFailed) {
    content = <>
      <p className="field-error" role="alert">No se pudo abrir el registro. Compruebe su conexión e intente nuevamente.</p>
      <button className="button outline full" onClick={() => {
        setAccessFailed(false);
        setRetry((value) => value + 1);
      }}>Reintentar</button>
    </>;
  } else {
    content = <p role="status">Conectando con el registro…</p>;
  }

  return (
    <div className="access-page">
      <section className="panel access-panel">
        <div className="brand-icon"><Landmark size={28} /></div>
        <h1>G.A.M. CAQUIAVIRI</h1>
        <p className="subtitle">Registro de notas externas · Gestión 2026</p>
        {content}
      </section>
    </div>
  );
}
