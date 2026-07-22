import { Link, useLocation } from "react-router-dom";
import NotchedHeroNav from "../../components/layout/NotchedHeroNav";
import "../Home/Home.css";
import "./NotFound.css";

export default function NotFound() {
  const location = useLocation();
  const attemptedPath = location.pathname || "/";

  return (
    <div className="notfound-page-root">
      <NotchedHeroNav maskFrame={false} />

      <main className="notfound-main">
        <p className="notfound-brand">MUGATE</p>
        <p className="notfound-code">404</p>
        <h1 className="notfound-title">Page not found</h1>
        <p className="notfound-lede">
          The path <code className="notfound-path">{attemptedPath}</code> does not
          exist on MuGate.
        </p>
        <Link to="/" className="notfound-home-btn">
          Back to home
        </Link>
      </main>
    </div>
  );
}
