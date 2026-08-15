import { Link } from "react-router-dom";
import NotchedHeroNav from "./NotchedHeroNav";
import "../../pages/Home/Home.css";
import "./LoginGate.css";

/**
 * Same-URL auth gate — keeps the current path (no hard redirect) so crawlers
 * do not see a client-side navigation away from the page.
 */
export default function LoginGate({ feature = "this page" }) {
  return (
    <div className="login-gate-root">
      <NotchedHeroNav maskFrame={false} />
      <main className="login-gate-main">
        <p className="login-gate-brand">MUGATE</p>
        <h1 className="login-gate-title">Sign in to continue</h1>
        <p className="login-gate-lede">
          You need an MU account to use {feature}. Sign in to unlock this feature.
        </p>
        <Link to="/?focus=login" className="login-gate-btn">
          Sign in
        </Link>
      </main>
    </div>
  );
}
