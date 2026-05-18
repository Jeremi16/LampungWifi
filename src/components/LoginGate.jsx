export function LoginGate({ user, onSignIn, onSignOut, configured }) {
  if (user) {
    return (
      <div className="login-card login-card--signed-in">
        {user.picture ? <img src={user.picture} alt="" /> : null}
        <div>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>
        <button type="button" className="button button--ghost button--small" onClick={onSignOut}>
          Keluar
        </button>
      </div>
    )
  }

  return (
    <div className="login-card">
      <div>
        <strong>Login Google diperlukan</strong>
        <span>Masuk dulu untuk kirim tempat atau rating WiFi.</span>
      </div>
      <button type="button" className="button button--primary button--small" onClick={onSignIn} disabled={!configured}>
        Login Google
      </button>
      {!configured ? <small>Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` untuk mengaktifkan login.</small> : null}
    </div>
  )
}
